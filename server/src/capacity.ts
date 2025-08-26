import { HousecallProClient } from './housecall';
import { loadConfig } from './config';
import { Logger } from './logger';
import {
  getStartOfDayInTZ,
  getEndOfDayInTZ,
  getTomorrowInTZ,
  getNowInTZ,
  formatTimeInTZ,
} from './util/time';

export interface TechCapacity {
  score: number;
  open_windows: string[];
  booked_minutes: number;
  total_bookable_minutes: number;
}

export interface OverallCapacity {
  score: number;
  state: 'SAME_DAY_FEE_WAIVED' | 'LIMITED_SAME_DAY' | 'NEXT_DAY';
}

export interface CapacityResponse {
  overall: OverallCapacity;
  tech: {
    nate: TechCapacity;
    nick: TechCapacity;
    jahz: TechCapacity;
  };
  ui_copy: any;
  expires_at: string;
}

export class CapacityCalculator {
  private static instance: CapacityCalculator;
  private hcpClient: HousecallProClient;
  private cache: Map<string, { data: CapacityResponse; expires: number }> = new Map();

  private constructor() {
    this.hcpClient = HousecallProClient.getInstance();
  }

  static getInstance(): CapacityCalculator {
    if (!this.instance) {
      this.instance = new CapacityCalculator();
    }
    return this.instance;
  }

  async calculateCapacity(date: Date = new Date()): Promise<CapacityResponse> {
    const cacheKey = `capacity:${date.toISOString().split('T')[0]}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && cached.expires > Date.now()) {
      Logger.debug('Capacity cache hit', { date: date.toISOString(), cacheHit: true });
      return cached.data;
    }

    Logger.info('Calculating capacity', { date: date.toISOString() });

    const config = loadConfig();
    const startOfDay = getStartOfDayInTZ(date);
    const endOfDay = getEndOfDayInTZ(date);
    const now = getNowInTZ();

    // Fetch data from Housecall Pro
    const [employees, bookingWindows, jobs] = await Promise.all([
      this.hcpClient.getEmployees(),
      this.hcpClient.getBookingWindows(date.toISOString().split('T')[0]),
      this.hcpClient.getJobs({
        scheduled_start_min: startOfDay.toISOString(),
        scheduled_start_max: endOfDay.toISOString(),
      }),
    ]);

    // Map employees to our tech names
    const techEmployeeMap = this.mapEmployeesToTechs(employees, config);
    
    // Calculate per-tech capacity
    const techCapacities = this.calculateTechCapacities(
      techEmployeeMap,
      bookingWindows,
      jobs,
      now
    );

    // Calculate overall capacity and state
    const overall = this.calculateOverallCapacity(techCapacities, bookingWindows, now);

    // Get UI copy based on state
    const uiCopy = config.ui_copy[overall.state] || config.ui_copy.NEXT_DAY;

    // Calculate expiration time (2 minutes from now)
    const expiresAt = new Date(Date.now() + 120000);

    const response: CapacityResponse = {
      overall,
      tech: techCapacities,
      ui_copy: uiCopy,
      expires_at: expiresAt.toISOString(),
    };

    // Cache for 90 seconds
    this.cache.set(cacheKey, {
      data: response,
      expires: Date.now() + 90000,
    });

    return response;
  }

  private mapEmployeesToTechs(employees: any[], config: any): Map<string, string> {
    const map = new Map<string, string>();

    for (const employee of employees) {
      const fullName = `${employee.first_name} ${employee.last_name}`.toLowerCase();
      
      if (fullName.includes('nate') || employee.id === config.tech_map.nate) {
        map.set('nate', employee.id);
        config.tech_map.nate = employee.id; // Update config with actual ID
      } else if (fullName.includes('nick') || employee.id === config.tech_map.nick) {
        map.set('nick', employee.id);
        config.tech_map.nick = employee.id;
      } else if (fullName.includes('jahz') || employee.id === config.tech_map.jahz) {
        map.set('jahz', employee.id);
        config.tech_map.jahz = employee.id;
      }
    }

    // Use placeholders if not found
    if (!map.has('nate')) map.set('nate', config.tech_map.nate);
    if (!map.has('nick')) map.set('nick', config.tech_map.nick);
    if (!map.has('jahz')) map.set('jahz', config.tech_map.jahz);

    return map;
  }

  private calculateTechCapacities(
    techEmployeeMap: Map<string, string>,
    bookingWindows: any[],
    jobs: any[],
    now: Date
  ): any {
    const capacities: any = {};

    const techEntries = Array.from(techEmployeeMap.entries());
    for (const [techName, employeeId] of techEntries) {
      // Get windows for this tech
      const techWindows = bookingWindows.filter(window =>
        window.available && 
        (!window.employee_ids || window.employee_ids.includes(employeeId))
      );

      // Get open windows (not yet passed)
      const openWindows = techWindows.filter(window => {
        const windowEnd = this.parseWindowTime(window.end_time, new Date(window.date));
        return windowEnd > now;
      }).map(window => `${window.start_time} - ${window.end_time}`);

      // Calculate total bookable minutes for today
      const totalBookableMinutes = techWindows.reduce((sum, window) => {
        const start = this.parseWindowTime(window.start_time, new Date(window.date));
        const end = this.parseWindowTime(window.end_time, new Date(window.date));
        return sum + (end.getTime() - start.getTime()) / 60000;
      }, 0);

      // Calculate booked minutes
      const techJobs = jobs.filter(job => 
        job.employee_ids && job.employee_ids.includes(employeeId)
      );

      const bookedMinutes = techJobs.reduce((sum, job) => {
        if (job.duration_minutes) {
          return sum + job.duration_minutes;
        }
        const start = new Date(job.scheduled_start);
        const end = new Date(job.scheduled_end);
        return sum + (end.getTime() - start.getTime()) / 60000;
      }, 0);

      // Calculate capacity score
      const score = totalBookableMinutes > 0 
        ? 1 - (bookedMinutes / totalBookableMinutes)
        : 0;

      capacities[techName] = {
        score: Math.max(0, Math.min(1, score)),
        open_windows: openWindows,
        booked_minutes: bookedMinutes,
        total_bookable_minutes: totalBookableMinutes,
      };
    }

    return capacities;
  }

  private calculateOverallCapacity(
    techCapacities: any,
    bookingWindows: any[],
    now: Date
  ): OverallCapacity {
    const config = loadConfig();

    // Calculate average score of bookable techs
    const bookableTechs = ['nate', 'nick', 'jahz'];
    const scores = bookableTechs
      .map(tech => techCapacities[tech]?.score || 0)
      .filter(score => score > 0);

    const overallScore = scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;

    // Check if any windows remain today
    const hasWindowsToday = bookingWindows.some(window => {
      const windowEnd = this.parseWindowTime(window.end_time, new Date(window.date));
      return window.available && windowEnd > now;
    });

    // Check if we're past the last window
    const lastWindowEnd = bookingWindows.reduce((latest, window) => {
      const windowEnd = this.parseWindowTime(window.end_time, new Date(window.date));
      return windowEnd > latest ? windowEnd : latest;
    }, new Date(0));

    const isPastLastWindow = now > lastWindowEnd;

    // Determine state based on rules
    let state: OverallCapacity['state'];

    if (!hasWindowsToday || isPastLastWindow) {
      state = 'NEXT_DAY';
    } else if (overallScore >= config.thresholds.same_day_fee_waived) {
      state = 'SAME_DAY_FEE_WAIVED';
    } else if (overallScore >= config.thresholds.limited_same_day) {
      state = 'LIMITED_SAME_DAY';
    } else {
      state = 'NEXT_DAY';
    }

    // Handle force_state override
    if (process.env.FORCE_CAPACITY_STATE) {
      state = process.env.FORCE_CAPACITY_STATE as OverallCapacity['state'];
      Logger.warn('Using forced capacity state', { forcedState: state });
    }

    return {
      score: overallScore,
      state,
    };
  }

  private parseWindowTime(timeStr: string, date: Date): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  async getTodayCapacity(): Promise<CapacityResponse> {
    return this.calculateCapacity(new Date());
  }

  async getTomorrowCapacity(): Promise<CapacityResponse> {
    return this.calculateCapacity(getTomorrowInTZ());
  }
}