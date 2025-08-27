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

export interface ExpressWindow {
  time_slot: string;
  available_techs: string[];
  start_time: string;
  end_time: string;
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
  express_eligible?: boolean;
  express_windows?: string[];
  unique_express_windows?: ExpressWindow[];
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

  async calculateCapacity(date: Date = new Date(), userZip?: string): Promise<CapacityResponse> {
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
    
    // Debug: Check if we got real windows
    console.log(`[Capacity] Booking windows received: ${bookingWindows.length}`);
    
    // CRITICAL FIX: The API returns windows with ISO timestamps like "2025-08-27T12:00:00.000Z"
    // We need to check if the date part matches today, not if date is missing
    const todayDateStr = date.toISOString().split('T')[0];
    const availableToday = bookingWindows.filter(w => {
      // Check if this window is for today
      const windowDateStr = w.start_time ? w.start_time.split('T')[0] : (w.date ? w.date.split('T')[0] : '');
      const isToday = windowDateStr === todayDateStr;
      const isAvailable = w.available === true;
      
      if (isToday && !isAvailable) {
        console.log(`[Capacity] Window for today but NOT available: ${w.start_time} - ${w.end_time}`);
      }
      
      return isToday && isAvailable;
    });
    console.log(`[Capacity] REAL available windows today: ${availableToday.length}`);

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

    // Calculate express eligibility based on user ZIP
    let expressEligible = true;
    if (userZip && config.express_zones) {
      const tier1Eligible = config.express_zones.tier1?.includes(userZip) || false;
      const tier2Eligible = (config.express_zones.tier2?.includes(userZip) || false) && overall.score >= 0.5;
      const tier3Eligible = (config.express_zones.tier3?.includes(userZip) || false) && overall.score >= 0.7;
      expressEligible = tier1Eligible || tier2Eligible || tier3Eligible;
    }

    // Get available express windows for TODAY only
    const todayStr = date.toISOString().split('T')[0];
    const expressWindows = bookingWindows
      .filter(window => {
        // Check if window is for today
        const windowDate = window.date ? window.date.split('T')[0] : todayStr;
        if (windowDate !== todayStr) return false;
        
        const windowEnd = this.parseWindowTime(window.end_time, new Date(window.date || date));
        return window.available && windowEnd > now;
      })
      .map(window => {
        // Convert UTC timestamps to EST time strings for display
        if (window.start_time.includes('T') && window.start_time.includes('Z')) {
          const startDate = new Date(window.start_time);
          const endDate = new Date(window.end_time);
          const startTimeEST = startDate.toLocaleTimeString('en-US', { 
            timeZone: 'America/New_York', 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });
          const endTimeEST = endDate.toLocaleTimeString('en-US', { 
            timeZone: 'America/New_York', 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });
          return `${startTimeEST} - ${endTimeEST}`;
        } else {
          // Simple time strings from mock data
          return `${window.start_time} - ${window.end_time}`;
        }
      });

    // Create unique express windows with tech availability
    const uniqueExpressWindows = this.consolidateTimeSlots(expressWindows, techCapacities);

    // Calculate expiration time (2 minutes from now)
    const expiresAt = new Date(Date.now() + 120000);

    const response: CapacityResponse = {
      overall,
      tech: techCapacities,
      ui_copy: uiCopy,
      expires_at: expiresAt.toISOString(),
      express_eligible: overall.state !== 'NEXT_DAY' ? expressEligible : false,
      express_windows: overall.state !== 'NEXT_DAY' ? expressWindows : [],
      unique_express_windows: overall.state !== 'NEXT_DAY' ? uniqueExpressWindows : [],
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
    const todayStr = now.toISOString().split('T')[0];

    const techEntries = Array.from(techEmployeeMap.entries());
    
    // DEBUG: Check the actual booking windows we got from API
    const availableWindowsToday = bookingWindows.filter(w => {
      const windowDateStr = w.start_time ? w.start_time.split('T')[0] : '';
      return windowDateStr === todayStr && w.available === true;
    });
    console.log(`[Capacity] calculateTechCapacities: ${availableWindowsToday.length} available windows for ${todayStr}`);
    
    for (const [techName, employeeId] of techEntries) {
      // Get windows for this tech - TODAY ONLY
      const techWindows = bookingWindows.filter(window => {
        // Check if window is for today
        const windowDateStr = window.start_time ? window.start_time.split('T')[0] : 
                             (window.date ? window.date.split('T')[0] : todayStr);
        const isToday = windowDateStr === todayStr;
        const isAvailable = window.available === true;
        const isTechAssigned = !window.employee_ids || window.employee_ids.includes(employeeId);
        
        return isToday && isAvailable && isTechAssigned;
      });
      
      // Debug: Log if no windows found
      if (techWindows.length === 0) {
        console.log(`[Capacity] No available windows for ${techName} on ${todayStr}`);
      }

      // Get open windows (not yet passed)
      const openWindows = techWindows.filter(window => {
        const windowEnd = this.parseWindowTime(window.end_time, new Date(window.date));
        return windowEnd > now;
      }).map(window => {
        // Convert UTC timestamps to EST time strings for display
        if (window.start_time.includes('T') && window.start_time.includes('Z')) {
          const startDate = new Date(window.start_time);
          const endDate = new Date(window.end_time);
          const startTimeEST = startDate.toLocaleTimeString('en-US', { 
            timeZone: 'America/New_York', 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });
          const endTimeEST = endDate.toLocaleTimeString('en-US', { 
            timeZone: 'America/New_York', 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });
          return `${startTimeEST} - ${endTimeEST}`;
        } else {
          // Simple time strings from mock data
          return `${window.start_time} - ${window.end_time}`;
        }
      });

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

      // Only show real availability from API, no fake data
      capacities[techName] = {
        score: techWindows.length > 0 ? Math.max(0, Math.min(1, score)) : 0,
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
    const todayStr = now.toISOString().split('T')[0];

    // Calculate average score of bookable techs
    const bookableTechs = ['nate', 'nick', 'jahz'];
    const scores = bookableTechs
      .map(tech => techCapacities[tech]?.score || 0)
      .filter(score => score > 0);

    const overallScore = scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;

    // Check if any windows remain TODAY
    const hasWindowsToday = bookingWindows.some(window => {
      const windowDate = window.date ? window.date.split('T')[0] : todayStr;
      if (windowDate !== todayStr) return false;
      const windowEnd = this.parseWindowTime(window.end_time, new Date(window.date || now));
      return window.available && windowEnd > now;
    });

    // Check if we're past the last window TODAY
    const lastWindowEnd = bookingWindows
      .filter(window => {
        const windowDate = window.date ? window.date.split('T')[0] : todayStr;
        return windowDate === todayStr;
      })
      .reduce((latest, window) => {
        const windowEnd = this.parseWindowTime(window.end_time, new Date(window.date || now));
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
    // Handle both ISO timestamps and simple time strings
    if (timeStr.includes('T') && timeStr.includes('Z')) {
      // Full ISO timestamp from real API - convert from UTC to EST
      return new Date(timeStr);
    } else {
      // Simple time string from mock data
      const [hours, minutes] = timeStr.split(':').map(Number);
      const result = new Date(date);
      result.setHours(hours, minutes, 0, 0);
      return result;
    }
  }

  private consolidateTimeSlots(expressWindows: string[], techCapacities: any): ExpressWindow[] {
    const slotMap = new Map<string, ExpressWindow>();
    
    // Priority order for tech assignment (Jahz first)
    const techPriority = ['jahz', 'nate', 'nick'];
    
    // First, create entries for all available express windows
    for (const window of expressWindows) {
      const [startTime, endTime] = window.split(' - ');
      slotMap.set(window, {
        time_slot: window,
        available_techs: [],
        start_time: startTime,
        end_time: endTime,
      });
    }
    
    // Then add techs who have these windows available
    for (const tech of techPriority) {
      const capacity = techCapacities[tech];
      if (!capacity || !capacity.open_windows) continue;
      
      for (const window of capacity.open_windows) {
        if (slotMap.has(window)) {
          const slot = slotMap.get(window)!;
          if (!slot.available_techs.includes(tech)) {
            slot.available_techs.push(tech);
          }
        }
      }
    }
    
    // Filter out slots with no available techs and sort
    return Array.from(slotMap.values())
      .filter(slot => slot.available_techs.length > 0)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
      .map(slot => ({
        ...slot,
        available_techs: slot.available_techs.sort((a, b) => 
          techPriority.indexOf(a) - techPriority.indexOf(b)
        )
      }));
  }

  async getTodayCapacity(userZip?: string): Promise<CapacityResponse> {
    return this.calculateCapacity(new Date(), userZip);
  }

  async getTomorrowCapacity(userZip?: string): Promise<CapacityResponse> {
    return this.calculateCapacity(getTomorrowInTZ(), userZip);
  }
}