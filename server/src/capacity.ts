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
    // Use EST/EDT date for cache key
    const estDateStr = date.toLocaleDateString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const [month, day, year] = estDateStr.split('/');
    const cacheKey = `capacity:${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const cached = this.cache.get(cacheKey);
    
    // Cache for 5 minutes to reduce API costs
    if (cached && cached.expires > Date.now()) {
      Logger.debug('Capacity cache hit', { date: date.toISOString(), cacheHit: true });
      return cached.data;
    }

    Logger.info('Calculating capacity', { date: date.toISOString() });

    const config = loadConfig();
    const startOfDay = getStartOfDayInTZ(date);
    const endOfDay = getEndOfDayInTZ(date);
    const now = getNowInTZ();

    // Fetch data from Housecall Pro - ONLY use estimates (jobs API is failing with 400)
    // Use Promise.allSettled to handle individual failures gracefully
    const results = await Promise.allSettled([
      this.hcpClient.getEmployees(),
      this.hcpClient.getBookingWindows(date.toISOString().split('T')[0]),
      this.hcpClient.getEstimates({
        scheduled_start_min: startOfDay.toISOString(),
        scheduled_start_max: endOfDay.toISOString(),
        work_status: ['scheduled', 'in_progress', 'completed'],
      }),
    ]);

    // Extract results with fallback defaults for failed requests
    const employees = results[0].status === 'fulfilled' ? results[0].value : [];
    const bookingWindows = results[1].status === 'fulfilled' ? results[1].value : [];
    const estimates = results[2].status === 'fulfilled' ? results[2].value : [];

    // Log any failures for debugging
    if (results[0].status === 'rejected') {
      Logger.error('[Capacity] Failed to fetch employees:', { error: results[0].reason?.message });
    }
    if (results[1].status === 'rejected') {
      Logger.error('[Capacity] Failed to fetch booking windows:', { error: results[1].reason?.message });
    }
    if (results[2].status === 'rejected') {
      Logger.error('[Capacity] Failed to fetch estimates:', { error: results[2].reason?.message });
    }
    
    const jobs: any[] = []; // Empty jobs array since jobs API is broken

    // Log estimates data for visibility (jobs API is broken, but that's fine)
    Logger.debug('Using HCP booking windows as authoritative availability source');
    Logger.debug(`Found ${estimates.length} estimates for debugging purposes`);
    
    // The booking windows API already factors in ALL scheduled work (jobs + estimates)
    // so we don't need to manually calculate from individual items
    const relevantJobs = estimates; // Keep for legacy compatibility
    
    // Use HCP booking windows as-is (they already reflect all scheduled work)
    Logger.debug('Using authoritative HCP booking windows - no manual override needed');
    const realBookingWindows = bookingWindows;
    
    // Debug: Check if we got real windows
    Logger.debug(`[Capacity] Booking windows received: ${realBookingWindows.length}`);
    
    // CRITICAL FIX: The API returns windows with ISO timestamps like "2025-08-27T12:00:00.000Z"
    // We need to check if the date part matches today, not if date is missing
    const todayDateStr = date.toISOString().split('T')[0];
    const availableToday = realBookingWindows.filter(w => {
      // Check if this window is for today
      const windowDateStr = w.start_time ? w.start_time.split('T')[0] : (w.date ? w.date.split('T')[0] : '');
      const isToday = windowDateStr === todayDateStr;
      const isAvailable = w.available === true;
      
      if (isToday && !isAvailable) {
        Logger.debug(`[Capacity] Window for today but NOT available: ${w.start_time} - ${w.end_time}`);
      }
      
      return isToday && isAvailable;
    });
    Logger.debug(`[Capacity] REAL available windows today: ${availableToday.length}`);

    // Map employees to our tech names
    const techEmployeeMap = this.mapEmployeesToTechs(employees, config);
    
    // DEBUG: Log employee mapping
    Logger.debug(`[Capacity] Employee mapping:`);
    for (const [techName, employeeId] of techEmployeeMap) {
      const employee = employees.find(e => e.id === employeeId);
      Logger.debug(`[Capacity]   ${techName} -> ${employeeId} (${employee?.first_name} ${employee?.last_name})`);
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
    Logger.debug(`[Express] Starting express windows filtering for ${todayStr}. RealBookingWindows count: ${realBookingWindows.length}`);
    
    // Define 3-hour service windows in EST (converted to UTC for comparison)
    // Morning: 8-11 AM EST = 13:00-16:00 UTC
    // Midday: 11 AM-2 PM EST = 16:00-19:00 UTC  
    // Afternoon: 2-5 PM EST = 19:00-22:00 UTC
    const serviceWindows = [
      { label: 'Morning', startHourUTC: 13, endHourUTC: 16, startEST: '08:00', endEST: '11:00' },
      { label: 'Midday', startHourUTC: 16, endHourUTC: 19, startEST: '11:00', endEST: '14:00' },
      { label: 'Afternoon', startHourUTC: 19, endHourUTC: 22, startEST: '14:00', endEST: '17:00' }
    ];
    
    // Track which service windows have available slots
    const availableServiceWindows: string[] = [];
    
    for (const serviceWindow of serviceWindows) {
      // Check if any 30-min slot falls within this service window
      const hasAvailableSlot = realBookingWindows.some(window => {
        // Check if window is for the target date
        const windowDate = window.start_time ? window.start_time.split('T')[0] : 
                          (window.date ? window.date.split('T')[0] : todayStr);
        if (windowDate !== todayStr) return false;
        
        // Parse window time
        let windowStart: Date;
        if (window.start_time.includes('T') && window.start_time.includes('Z')) {
          windowStart = new Date(window.start_time);
        } else {
          windowStart = this.parseWindowTime(window.start_time, new Date(window.date || date));
        }
        
        const windowHourUTC = windowStart.getUTCHours();
        
        // Check if this slot falls within the service window
        const isInServiceWindow = windowHourUTC >= serviceWindow.startHourUTC && windowHourUTC < serviceWindow.endHourUTC;
        
        // Filter out expired windows - must be bookable 30 minutes before start
        const bookingCutoff = new Date(windowStart.getTime() - 30 * 60000);
        const isBookable = now < bookingCutoff;
        
        return window.available && isBookable && isInServiceWindow;
      });
      
      if (hasAvailableSlot) {
        // Add the consolidated 3-hour window as a time string
        availableServiceWindows.push(`${serviceWindow.startEST} - ${serviceWindow.endEST}`);
        Logger.debug(`[Express] Service window ${serviceWindow.label} (${serviceWindow.startEST} - ${serviceWindow.endEST}) has available slots`);
      } else {
        Logger.debug(`[Express] Service window ${serviceWindow.label} has no available slots`);
      }
    }

    const expressWindows = availableServiceWindows;
    Logger.debug(`[Express] Consolidated service windows count: ${expressWindows.length}`, expressWindows);

    // Create unique express windows with tech availability
    const uniqueExpressWindows = this.consolidateTimeSlots(expressWindows, techCapacities, date);
    Logger.debug(`[Express] Unique express windows count: ${uniqueExpressWindows.length}`, uniqueExpressWindows);

    // Calculate expiration time (5 minutes to reduce API costs)
    const expiresAt = new Date(Date.now() + 300000);

    const response: CapacityResponse = {
      overall,
      tech: techCapacities,
      ui_copy: uiCopy,
      expires_at: expiresAt.toISOString(),
      express_eligible: expressEligible,
      express_windows: expressWindows,
      unique_express_windows: uniqueExpressWindows,
    };

    // Cache for 5 minutes to reduce API costs significantly
    this.cache.set(cacheKey, {
      data: response,
      expires: Date.now() + 300000,
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
    Logger.debug(`[Capacity] calculateTechCapacities: ${availableWindowsToday.length} available windows for ${todayStr}`);
    
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
        Logger.debug(`[Capacity] No available windows for ${techName} on ${todayStr}`);
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

      // Calculate booked minutes - use booking windows since they already reflect scheduled work
      // Since booking windows are authoritative, unavailable windows = booked time
      const unavailableWindows = bookingWindows.filter(window => {
        const windowDateStr = window.start_time ? window.start_time.split('T')[0] : 
                             (window.date ? window.date.split('T')[0] : todayStr);
        const isToday = windowDateStr === todayStr;
        const isUnavailable = window.available === false;
        const isTechAssigned = !window.employee_ids || window.employee_ids.includes(employeeId);
        
        return isToday && isUnavailable && isTechAssigned;
      });

      const bookedMinutes = unavailableWindows.reduce((sum, window) => {
        const start = this.parseWindowTime(window.start_time, new Date(window.date || todayStr));
        const end = this.parseWindowTime(window.end_time, new Date(window.date || todayStr));
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
      const windowDate = window.start_time
        ? window.start_time.split('T')[0]
        : (window.date ? window.date.split('T')[0] : todayStr);
      if (windowDate !== todayStr) return false;
      const baseDate = window.start_time || window.date || now;
      const windowStart = this.parseWindowTime(window.start_time, new Date(baseDate));
      const bookingCutoff = new Date(windowStart.getTime() - 30 * 60000);
      return window.available && bookingCutoff > now;
    });

    // Check if we're past the last window TODAY
    const lastWindowEnd = bookingWindows
      .filter(window => {
        const windowDate = window.start_time
          ? window.start_time.split('T')[0]
          : (window.date ? window.date.split('T')[0] : todayStr);
        return windowDate === todayStr;
      })
      .reduce((latest, window) => {
        const baseDate = window.start_time || window.date || now;
        const windowEnd = this.parseWindowTime(window.end_time, new Date(baseDate));
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
    // Get day of week in EST timezone (getDay() respects timezone from estString)
    const dayOfWeek = estNow.getDay(); // Sunday = 0, Monday = 1, etc.
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
    
    // Determine if we're in express booking hours (8am-12pm any day)
    const isBeforeNoon = currentTime < 12; // Before 12 PM (noon)
    
    // Determine state based on availability first, then time-based rules
    let state: OverallCapacity['state'];

    // First check if there are actual available windows TODAY
    if (!hasWindowsToday || isPastLastWindow || !hasAvailableTechs) {
      // No slots available today - show NEXT_DAY state
      // Frontend will fetch tomorrow's capacity and show appropriate UI
      state = 'NEXT_DAY';
    } else if (isBeforeNoon) {
      // Before noon with available slots - show same day with fee based on capacity
      if (overallScore >= config.thresholds.same_day_fee_waived) {
        state = 'SAME_DAY_FEE_WAIVED';
      } else if (overallScore >= config.thresholds.limited_same_day) {
        state = 'LIMITED_SAME_DAY';
      } else {
        state = 'NEXT_DAY';
      }
    } else {
      // After noon - show NEXT_DAY state (even if slots available today)
      state = 'NEXT_DAY';
    }

    // Handle force_state override (removed - we'll use actual time-based logic)
    // Logging for debugging time-based states
    Logger.debug(`[Capacity] Time check: ${estHours}:${estMinutes} EST, Day: ${dayOfWeek}, State: ${state}`);

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

  private consolidateTimeSlots(expressWindows: string[], techCapacities: any, targetDate: Date): ExpressWindow[] {
    const results: ExpressWindow[] = [];
    
    // Priority order for tech assignment (Jahz first)
    const techPriority = ['jahz', 'nate', 'nick'];
    
    // Service window definitions with UTC hour ranges for matching
    // Morning: 8-11 AM EST = 13-16 UTC
    // Midday: 11 AM-2 PM EST = 16-19 UTC
    // Afternoon: 2-5 PM EST = 19-22 UTC
    const serviceWindowDefs = [
      { key: '08:00 - 11:00', startUTC: 13, endUTC: 16 },
      { key: '11:00 - 14:00', startUTC: 16, endUTC: 19 },
      { key: '14:00 - 17:00', startUTC: 19, endUTC: 22 }
    ];
    
    // Process each consolidated express window
    for (const window of expressWindows) {
      const [startTime, endTime] = window.split(' - ');
      
      // Find the matching service window definition
      const serviceDef = serviceWindowDefs.find(def => def.key === window);
      
      // Convert EST time strings to ISO timestamps
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      
      // Create dates in EST and convert to ISO (EST = UTC-5)
      const startDate = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        startHour + 5,
        startMin || 0
      ));
      
      const endDate = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        endHour + 5,
        endMin || 0
      ));
      
      // Find techs who have ANY 30-min slot within this 3-hour window
      const availableTechs: string[] = [];
      
      for (const tech of techPriority) {
        const capacity = techCapacities[tech];
        if (!capacity || !capacity.open_windows) continue;
        
        // Check if this tech has any open 30-min slot within the service window
        const hasSlotInWindow = capacity.open_windows.some((techWindow: string) => {
          // Parse the tech's 30-min slot (format: "HH:MM - HH:MM" in 24hr EST converted from UTC)
          const [slotStart] = techWindow.split(' - ');
          const [slotHour] = slotStart.split(':').map(Number);
          
          // slotHour is already in 24hr format representing EST time
          // Check if it falls within the service window's EST hours
          const windowStartHour = startHour;
          const windowEndHour = endHour;
          
          return slotHour >= windowStartHour && slotHour < windowEndHour;
        });
        
        if (hasSlotInWindow && !availableTechs.includes(tech)) {
          availableTechs.push(tech);
        }
      }
      
      // If at least one tech is available, add this window
      if (availableTechs.length > 0) {
        results.push({
          time_slot: window,
          available_techs: availableTechs,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
        });
      }
    }
    
    // Sort by start time
    return results.sort((a, b) => a.start_time.localeCompare(b.start_time));
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
    Logger.debug(`[Capacity] Calculating real availability for ${dateStr}`);
    
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
    
    // Mark busy slots based on jobs and estimates (using correct HCP API structure)
    Logger.debug(`[Capacity] Checking ${jobs.length} jobs for busy slots`);
    for (const item of jobs) {
      if (!item.assigned_employees) continue;
      
      // Get schedule info - handle both job format and estimate format
      const scheduledStart = item.scheduled_start || item.schedule?.scheduled_start;
      const scheduledEnd = item.scheduled_end || item.schedule?.scheduled_end;
      const workStarted = item.work_timestamps?.started_at;
      const workCompleted = item.work_timestamps?.completed_at;
      
      for (const emp of item.assigned_employees) {
        if (!techMap.has(emp.id)) continue;
        const techName = techMap.get(emp.id);
        
        // Check work status and determine which slots are busy
        if (item.work_status === 'in_progress' || item.work_status === 'scheduled' || item.work_status === 'completed') {
          Logger.debug(`[Capacity] ${techName} has ${item.work_status} work: ${scheduledStart} to ${scheduledEnd}`);
          
          // Check if work has already started
          if (workStarted) {
            // Work is actively being worked on
            const workStartHour = new Date(workStarted).getUTCHours();
            Logger.debug(`[Capacity] ${techName} started work at UTC hour ${workStartHour}`);
            
            // If work hasn't ended, assume they're busy for the rest of the day
            if (!workCompleted) {
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
          } else if (scheduledStart && scheduledEnd) {
            // Work is scheduled but not started yet - use scheduled times
            const scheduleStartHour = new Date(scheduledStart).getUTCHours();
            const scheduleEndHour = new Date(scheduledEnd).getUTCHours();
            Logger.debug(`[Capacity] ${techName} scheduled work UTC hours ${scheduleStartHour}-${scheduleEndHour}`);
            
            // Mark slots as busy based on scheduled window
            if (scheduleStartHour < 15) techBusySlots.get(emp.id).add(0); // 8-11 AM EST
            if (scheduleStartHour < 18 || scheduleEndHour > 15) techBusySlots.get(emp.id).add(1); // 11-2 PM EST  
            if (scheduleEndHour > 18) techBusySlots.get(emp.id).add(2); // 2-5 PM EST
          } else {
            // No schedule info available, make conservative assumption
            if (item.work_status === 'in_progress') {
              Logger.debug(`[Capacity] ${techName} has in-progress work with no times - marking all day busy`);
              techBusySlots.get(emp.id).add(0); // 8-11 AM
              techBusySlots.get(emp.id).add(1); // 11-2 PM
              techBusySlots.get(emp.id).add(2); // 2-5 PM
            } else {
              // For scheduled work without times, assume all day commitment
              Logger.debug(`[Capacity] ${techName} has scheduled work with no times - marking ALL DAY busy`);
              techBusySlots.get(emp.id).add(0); // 8-11 AM
              techBusySlots.get(emp.id).add(1); // 11-2 PM
              techBusySlots.get(emp.id).add(2); // 2-5 PM
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
        Logger.debug(`[Capacity] SKIPPED: ${slot.label} - expired (cutoff ${estCutoff} EST, now ${estNow} EST)`);
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
          Logger.debug(`[Capacity] CORRECTED: ${slot.label} marked as AVAILABLE (was unavailable)`);
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
        Logger.debug(`[Capacity] CREATED: ${slot.label} window with availability: ${isAnyTechAvailable}`);
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
    
    Logger.debug(`[Capacity] Corrected windows: ${correctedWindows.filter(w => w.available).length} available of ${correctedWindows.length} total`);
    return correctedWindows;
  }

  async getTodayCapacity(userZip?: string): Promise<CapacityResponse> {
    // Get today's date in EST/EDT timezone
    const now = new Date();
    const estDateStr = now.toLocaleDateString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit'
    });
    const [month, day, year] = estDateStr.split('/');
    const todayEST = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T12:00:00`);
    
    return this.calculateCapacity(todayEST, userZip);
  }

  async getTomorrowCapacity(userZip?: string): Promise<CapacityResponse> {
    return this.calculateCapacity(getTomorrowInTZ(), userZip);
  }
}
