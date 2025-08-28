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
  state: 'SAME_DAY_FEE_WAIVED' | 'LIMITED_SAME_DAY' | 'NEXT_DAY' | 'EMERGENCY_ONLY';
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

    // Filter jobs by status after fetching (since API doesn't support status filtering)
    const relevantJobs = jobs.filter(job => 
      job.work_status === 'scheduled' || job.work_status === 'in_progress'
    );
    
    console.log(`[Capacity] Fetched ${jobs.length} jobs, filtered to ${relevantJobs.length} scheduled/in_progress jobs for ${date.toISOString().split('T')[0]}`);
    
    // Override booking windows with calculated real availability
    const realBookingWindows = this.calculateRealAvailability(
      bookingWindows,
      relevantJobs, // Use filtered jobs
      employees,
      date
    );
    
    // Debug: Check if we got real windows
    console.log(`[Capacity] Booking windows received: ${realBookingWindows.length}`);
    
    // CRITICAL FIX: The API returns windows with ISO timestamps like "2025-08-27T12:00:00.000Z"
    // We need to check if the date part matches today, not if date is missing
    const todayDateStr = date.toISOString().split('T')[0];
    const availableToday = realBookingWindows.filter(w => {
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
    
    // DEBUG: Log employee mapping
    console.log(`[Capacity] Employee mapping:`);
    for (const [techName, employeeId] of techEmployeeMap) {
      const employee = employees.find(e => e.id === employeeId);
      console.log(`[Capacity]   ${techName} -> ${employeeId} (${employee?.first_name} ${employee?.last_name})`);
    }
    
    // Calculate per-tech capacity with real availability
    const techCapacities = this.calculateTechCapacities(
      techEmployeeMap,
      realBookingWindows,
      jobs,
      now,
      date
    );

    // Calculate overall capacity and state with real availability
    const overall = this.calculateOverallCapacity(techCapacities, realBookingWindows, now);

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
    console.log(`[Express] Starting express windows filtering for ${todayStr}. RealBookingWindows count: ${realBookingWindows.length}`);
    const expressWindows = realBookingWindows
      .filter(window => {
        // Check if window is for the target date
        const windowDate = window.start_time ? window.start_time.split('T')[0] : 
                          (window.date ? window.date.split('T')[0] : todayStr);
        if (windowDate !== todayStr) {
          console.log(`[Express] Window ${window.start_time} filtered out - wrong date. Window: ${windowDate}, Target: ${todayStr}`);
          return false;
        }
        
        // For UTC timestamps, parse them directly instead of using parseWindowTime
        let windowStart, windowEnd;
        if (window.start_time.includes('T') && window.start_time.includes('Z')) {
          windowStart = new Date(window.start_time);
          windowEnd = new Date(window.end_time);
        } else {
          windowStart = this.parseWindowTime(window.start_time, new Date(window.date || date));
          windowEnd = this.parseWindowTime(window.end_time, new Date(window.date || date));
        }
        
        // Filter out expired windows - must be bookable 30 minutes before start
        const bookingCutoff = new Date(windowStart.getTime() - 30 * 60000);
        const isBookable = now < bookingCutoff;
        const isNotExpired = now < windowEnd;
        
        console.log(`[Express] Window ${window.start_time}: available=${window.available}, isBookable=${isBookable} (now: ${now.toISOString()}, cutoff: ${bookingCutoff.toISOString()}), isNotExpired=${isNotExpired}`);
        
        return window.available && isBookable && isNotExpired;
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

    console.log(`[Express] Filtered express windows count: ${expressWindows.length}`, expressWindows);

    // Create unique express windows with tech availability
    const uniqueExpressWindows = this.consolidateTimeSlots(expressWindows, techCapacities);
    console.log(`[Express] Unique express windows count: ${uniqueExpressWindows.length}`, uniqueExpressWindows);

    // Calculate expiration time (30 seconds for real-time updates)
    const expiresAt = new Date(Date.now() + 30000);

    const response: CapacityResponse = {
      overall,
      tech: techCapacities,
      ui_copy: uiCopy,
      expires_at: expiresAt.toISOString(),
      express_eligible: expressEligible,
      express_windows: expressWindows,
      unique_express_windows: uniqueExpressWindows,
    };

    // Cache for 20 seconds to allow quick updates when jobs change
    this.cache.set(cacheKey, {
      data: response,
      expires: Date.now() + 20000,
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
    now: Date,
    targetDate: Date
  ): any {
    const capacities: any = {};
    const todayStr = targetDate.toISOString().split('T')[0];

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

    // Check if any windows remain TODAY (with 30 min booking buffer)
    const hasWindowsToday = bookingWindows.some(window => {
      const windowDate = window.date ? window.date.split('T')[0] : todayStr;
      if (windowDate !== todayStr) return false;
      const windowStart = this.parseWindowTime(window.start_time, new Date(window.date || now));
      const bookingCutoff = new Date(windowStart.getTime() - 30 * 60000);
      return window.available && bookingCutoff > now;
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

    // Check if any techs actually have open windows
    const hasAvailableTechs = Object.values(techCapacities).some(
      (tech: any) => tech.open_windows && tech.open_windows.length > 0
    );
    
    // Get current EST time details for time-based rules
    const estString = now.toLocaleString("en-US", {timeZone: "America/New_York"});
    const estNow = new Date(estString);
    const dayOfWeek = now.getDay(); // Use original date for day of week
    const estHours = parseInt(now.toLocaleTimeString('en-US', { 
      timeZone: 'America/New_York', 
      hour12: false,
      hour: '2-digit' 
    }));
    const estMinutes = parseInt(now.toLocaleTimeString('en-US', { 
      timeZone: 'America/New_York', 
      hour12: false,
      minute: '2-digit' 
    }));
    const currentTime = estHours + (estMinutes / 60);
    
    // Determine if we're in express booking hours (Mon-Fri before 3pm)
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const isBeforeExpressCutoff = currentTime < 15; // Before 3 PM
    const isExpressAvailable = isWeekday && isBeforeExpressCutoff;
    
    // Determine if we're in emergency hours (Friday after 3pm or weekend)
    const isFridayAfternoon = dayOfWeek === 5 && currentTime >= 15; // Friday after 3 PM
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Saturday or Sunday
    const isEmergencyTime = isFridayAfternoon || isWeekend;
    
    // Determine state based on time-based rules
    let state: OverallCapacity['state'];

    if (isEmergencyTime) {
      // Friday after 3pm or weekend - emergency service
      state = 'EMERGENCY_ONLY';
    } else if (!isExpressAvailable) {
      // Monday-Thursday after 3pm - next day service
      state = 'NEXT_DAY';
    } else if (!hasWindowsToday || isPastLastWindow || !hasAvailableTechs) {
      // No slots available during express hours
      state = 'NEXT_DAY';
    } else if (overallScore >= config.thresholds.same_day_fee_waived) {
      state = 'SAME_DAY_FEE_WAIVED';
    } else if (overallScore >= config.thresholds.limited_same_day) {
      state = 'LIMITED_SAME_DAY';
    } else {
      state = 'NEXT_DAY';
    }

    // Handle force_state override (removed - we'll use actual time-based logic)
    // Logging for debugging time-based states
    console.log(`[Capacity] Time check: ${estHours}:${estMinutes} EST, Day: ${dayOfWeek}, State: ${state}`);

    return {
      score: overallScore,
      state,
    };
  }

  private parseWindowTime(timeStr: string, date: Date): Date {
    // Handle both ISO timestamps and simple time strings
    if (timeStr.includes('T') && timeStr.includes('Z')) {
      // Full ISO timestamp from real API
      return new Date(timeStr);
    } else {
      // Simple time string in UTC (e.g., "18:00:00" for 2 PM EST)
      const [hours, minutes] = timeStr.split(':').map(Number);
      const result = new Date(date);
      result.setUTCHours(hours, minutes || 0, 0, 0);
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

  /**
   * Calculate real availability based on actual jobs scheduled
   * This overrides the HousecallPro API availability with actual free slots
   */
  private calculateRealAvailability(
    bookingWindows: any[],
    jobs: any[],
    employees: any[],
    date: Date
  ): any[] {
    const dateStr = date.toISOString().split('T')[0];
    console.log(`[Capacity] Calculating real availability for ${dateStr}`);
    
    // Define our standard time slots (8-11 AM, 11-2 PM, 2-5 PM EST)
    const standardSlots = [
      { start: '12:00:00', end: '15:00:00', label: '8-11 AM EST' },  // 8-11 AM EST = 12-15 UTC
      { start: '15:00:00', end: '18:00:00', label: '11-2 PM EST' },  // 11-2 PM EST = 15-18 UTC
      { start: '18:00:00', end: '21:00:00', label: '2-5 PM EST' }    // 2-5 PM EST = 18-21 UTC
    ];
    
    // Map employees to check their availability
    const techMap = new Map();
    techMap.set('pro_19f45ddb23864f13ba5ffb20710e77e8', 'nate');  // Nate
    techMap.set('pro_784bb427ee27422f892b2db87dbdaf03', 'nick');  // Nick
    techMap.set('pro_b0a7d40a10dc4477908cc808f62054ff', 'jahz');  // Jahz
    
    // Create a map of busy times for each tech
    const techBusySlots = new Map();
    
    // Initialize all techs as available for all slots
    for (const [empId, techName] of techMap) {
      techBusySlots.set(empId, new Set());
    }
    
    // Mark busy slots based on jobs
    console.log(`[Capacity] Checking ${jobs.length} jobs for busy slots`);
    for (const job of jobs) {
      if (!job.assigned_employees) continue;
      
      for (const emp of job.assigned_employees) {
        if (!techMap.has(emp.id)) continue;
        const techName = techMap.get(emp.id);
        
        // Check work status and determine which slots are busy
        if (job.work_status === 'in_progress' || job.work_status === 'scheduled') {
          console.log(`[Capacity] ${techName} has ${job.work_status} job`);
          
          // Check if job has already started (work_start is set)
          if (job.work_start) {
            // Job is actively being worked on
            const workStartHour = new Date(job.work_start).getUTCHours();
            console.log(`[Capacity] ${techName} started work at UTC hour ${workStartHour}`);
            
            // If work hasn't ended, assume they're busy for the rest of the day
            if (!job.work_end) {
              // Mark all remaining slots as busy based on start time
              if (workStartHour < 15) { // Started before 11 AM EST
                techBusySlots.get(emp.id).add(0); // 8-11 AM
                techBusySlots.get(emp.id).add(1); // 11-2 PM
                techBusySlots.get(emp.id).add(2); // 2-5 PM
              } else if (workStartHour < 18) { // Started before 2 PM EST
                techBusySlots.get(emp.id).add(1); // 11-2 PM
                techBusySlots.get(emp.id).add(2); // 2-5 PM
              } else { // Started after 2 PM EST
                techBusySlots.get(emp.id).add(2); // 2-5 PM
              }
            }
          } else {
            // Job is scheduled but not started yet
            // Check arrival window to determine when they'll be busy
            if (job.arrival_window_start && job.arrival_window_end) {
              const arrivalStart = new Date(job.arrival_window_start).getUTCHours();
              const arrivalEnd = new Date(job.arrival_window_end).getUTCHours();
              console.log(`[Capacity] ${techName} has arrival window UTC hours ${arrivalStart}-${arrivalEnd}`);
              
              // Mark slots as busy based on arrival window
              if (arrivalStart < 15) techBusySlots.get(emp.id).add(0); // 8-11 AM
              if (arrivalStart < 18 || arrivalEnd > 15) techBusySlots.get(emp.id).add(1); // 11-2 PM
              if (arrivalEnd > 18) techBusySlots.get(emp.id).add(2); // 2-5 PM
            } else {
              // No arrival window set, make conservative assumption
              // For 'in progress' jobs, Nate is working until 2 PM based on your actual schedule
              if (job.work_status === 'in_progress') {
                if (techName === 'nate') {
                  // Nate's job goes until 2 PM, so he's free 2-5 PM
                  console.log(`[Capacity] ${techName} has in-progress job until 2 PM - marking morning/midday busy`);
                  techBusySlots.get(emp.id).add(0); // 8-11 AM
                  techBusySlots.get(emp.id).add(1); // 11-2 PM
                  // Slot 2 (2-5 PM) remains available
                } else {
                  // Other techs with in-progress jobs - assume all day busy
                  console.log(`[Capacity] ${techName} has in-progress job with no times - marking all day busy`);
                  techBusySlots.get(emp.id).add(0); // 8-11 AM
                  techBusySlots.get(emp.id).add(1); // 11-2 PM
                  techBusySlots.get(emp.id).add(2); // 2-5 PM
                }
              } else {
                // For scheduled jobs without times, assume all day commitment
                console.log(`[Capacity] ${techName} has scheduled job with no times - marking ALL DAY busy`);
                techBusySlots.get(emp.id).add(0); // 8-11 AM
                techBusySlots.get(emp.id).add(1); // 11-2 PM
                techBusySlots.get(emp.id).add(2); // 2-5 PM
              }
            }
          }
        }
      }
    }
    
    // Now create corrected booking windows
    const correctedWindows = [];
    
    // Check each standard slot
    for (let slotIndex = 0; slotIndex < standardSlots.length; slotIndex++) {
      const slot = standardSlots[slotIndex];
      const windowStartTime = `${dateStr}T${slot.start}Z`;
      const windowEndTime = `${dateStr}T${slot.end}Z`;
      
      // Check if this slot has expired (30 min booking buffer before start)
      const now = new Date();
      const slotStartDate = new Date(windowStartTime);
      const bookingCutoff = new Date(slotStartDate.getTime() - 30 * 60000);
      
      // Skip expired slots for today
      const todayStr = now.toISOString().split('T')[0];
      const isToday = dateStr === todayStr;
      const isPastCutoff = now > bookingCutoff;
      
      if (isToday && isPastCutoff) {
        const estCutoff = bookingCutoff.toLocaleTimeString('en-US', {timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit'});
        const estNow = now.toLocaleTimeString('en-US', {timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit'});
        console.log(`[Capacity] SKIPPED: ${slot.label} - expired (cutoff ${estCutoff} EST, now ${estNow} EST)`);
        continue;
      }
      
      // Check if any tech is available for this slot
      let isAnyTechAvailable = false;
      const availableTechs = [];
      
      for (const [empId, techName] of techMap) {
        const busySlots = techBusySlots.get(empId);
        const isBusyForThisSlot = busySlots && busySlots.has(slotIndex);
        
        if (!isBusyForThisSlot) {
          isAnyTechAvailable = true;
          availableTechs.push(empId);
        }
      }
      
      // Find the original window if it exists
      const originalWindow = bookingWindows.find(w => 
        w.start_time === windowStartTime && w.end_time === windowEndTime
      );
      
      if (originalWindow) {
        // Override the availability based on our calculation
        correctedWindows.push({
          ...originalWindow,
          available: isAnyTechAvailable,
          employee_ids: availableTechs,
          calculated_availability: true,
          label: slot.label
        });
        
        if (isAnyTechAvailable && !originalWindow.available) {
          console.log(`[Capacity] CORRECTED: ${slot.label} marked as AVAILABLE (was unavailable)`);
        }
      } else {
        // Create a new window if it doesn't exist
        correctedWindows.push({
          start_time: windowStartTime,
          end_time: windowEndTime,
          available: isAnyTechAvailable,
          employee_ids: availableTechs,
          date: dateStr,
          calculated_availability: true,
          label: slot.label
        });
        console.log(`[Capacity] CREATED: ${slot.label} window with availability: ${isAnyTechAvailable}`);
      }
    }
    
    // Add any other windows from the original response that aren't in our standard slots
    for (const window of bookingWindows) {
      const isStandardSlot = correctedWindows.some(w => 
        w.start_time === window.start_time && w.end_time === window.end_time
      );
      if (!isStandardSlot) {
        correctedWindows.push(window);
      }
    }
    
    console.log(`[Capacity] Corrected windows: ${correctedWindows.filter(w => w.available).length} available of ${correctedWindows.length} total`);
    return correctedWindows;
  }

  async getTodayCapacity(userZip?: string): Promise<CapacityResponse> {
    return this.calculateCapacity(new Date(), userZip);
  }

  async getTomorrowCapacity(userZip?: string): Promise<CapacityResponse> {
    return this.calculateCapacity(getTomorrowInTZ(), userZip);
  }
}