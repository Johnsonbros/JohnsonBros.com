import { Logger } from './logger';

const HCP_API_BASE = process.env.HCP_API_BASE || 'https://api.housecallpro.com';
const API_KEY = process.env.HCP_COMPANY_API_KEY || process.env.HOUSECALL_PRO_API_KEY;

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
}

interface HCPEmployee {
  id: string;
  first_name: string;
  last_name: string;
  can_be_booked_online: boolean;
  is_active: boolean;
}

interface HCPBookingWindow {
  id: string;
  start_time: string;
  end_time: string;
  date: string;
  available: boolean;
  employee_ids: string[];
}

interface HCPJob {
  id: string;
  employee_ids: string[];
  scheduled_start: string;
  scheduled_end: string;
  work_status: string;
  duration_minutes?: number;
}

export class HousecallProClient {
  private static instance: HousecallProClient;
  private cache: Map<string, { data: any; expires: number }> = new Map();
  private circuitBreakerState: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5;
  private readonly CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute

  private constructor() {}

  static getInstance(): HousecallProClient {
    if (!this.instance) {
      this.instance = new HousecallProClient();
    }
    return this.instance;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private addJitter(delay: number): number {
    return delay + Math.random() * delay * 0.1;
  }

  private checkCircuitBreaker(): void {
    if (this.circuitBreakerState === 'open') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure > this.CIRCUIT_BREAKER_TIMEOUT) {
        this.circuitBreakerState = 'half-open';
        Logger.info('Circuit breaker entering half-open state');
      } else {
        throw new Error('Circuit breaker is open - service unavailable');
      }
    }
  }

  private recordSuccess(): void {
    if (this.circuitBreakerState === 'half-open') {
      this.circuitBreakerState = 'closed';
      this.failureCount = 0;
      Logger.info('Circuit breaker closed - service recovered');
    }
  }

  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.CIRCUIT_BREAKER_THRESHOLD) {
      this.circuitBreakerState = 'open';
      Logger.error('Circuit breaker opened - too many failures', { failureCount: this.failureCount });
    }
  }

  async callAPI<T>(
    endpoint: string,
    params: Record<string, any> = {},
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      initialDelay = 1000,
      maxDelay = 10000,
      backoffFactor = 2,
    } = options;

    // Check circuit breaker
    this.checkCircuitBreaker();

    // Check cache
    const cacheKey = `${endpoint}:${JSON.stringify(params)}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      Logger.debug('Cache hit', { endpoint, cacheHit: true });
      return cached.data;
    }

    // Use mock data if no API key is configured
    if (!API_KEY) {
      Logger.warn('Using mock data - no API key configured');
      return this.getMockData(endpoint) as T;
    }

    let lastError: Error | null = null;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const requestId = Logger.generateRequestId();
      const startTime = Date.now();

      try {
        const url = new URL(endpoint, HCP_API_BASE);
        Object.keys(params).forEach(key => {
          if (params[key] !== undefined && params[key] !== null) {
            if (Array.isArray(params[key])) {
              params[key].forEach((item: string) => url.searchParams.append(key, item));
            } else {
              url.searchParams.append(key, params[key].toString());
            }
          }
        });

        const authHeader = API_KEY.startsWith('Token ') ? API_KEY : `Bearer ${API_KEY}`;

        const response = await fetch(url.toString(), {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
        });

        const latency = Date.now() - startTime;

        if (response.status === 429) {
          // Rate limit - extract retry-after header
          const retryAfter = response.headers.get('Retry-After');
          const retryDelay = retryAfter ? parseInt(retryAfter) * 1000 : delay;
          
          Logger.warn(`Rate limited, retrying after ${retryDelay}ms`, {
            requestId,
            attempt,
            endpoint,
            status: 429,
            retryAfter,
          });

          if (attempt < maxRetries) {
            await this.sleep(this.addJitter(retryDelay));
            delay = Math.min(delay * backoffFactor, maxDelay);
            continue;
          }
        }

        if (response.status >= 500) {
          // Server error - retry with backoff
          Logger.warn(`Server error, retrying`, {
            requestId,
            attempt,
            endpoint,
            status: response.status,
            latency,
          });

          if (attempt < maxRetries) {
            await this.sleep(this.addJitter(delay));
            delay = Math.min(delay * backoffFactor, maxDelay);
            continue;
          }
        }

        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Cache successful responses for 60-90 seconds
        const cacheTime = 60000 + Math.random() * 30000;
        this.cache.set(cacheKey, {
          data,
          expires: Date.now() + cacheTime,
        });

        Logger.info('API call successful', {
          requestId,
          endpoint,
          latency,
          cacheHit: false,
        });

        this.recordSuccess();
        return data;

      } catch (error) {
        lastError = error as Error;
        
        Logger.error(`API call failed (attempt ${attempt + 1}/${maxRetries + 1})`, {
          requestId,
          endpoint,
          error: lastError.message,
          attempt,
        });

        if (attempt < maxRetries) {
          await this.sleep(this.addJitter(delay));
          delay = Math.min(delay * backoffFactor, maxDelay);
        }
      }
    }

    this.recordFailure();
    Logger.error('All API call attempts failed', {
      endpoint,
      error: lastError?.message,
    });

    // NO FAKE DATA - Throw error instead of returning mock data
    throw new Error(`API call failed after ${maxRetries} retries: ${lastError?.message}`);
  }

  async getEmployees(): Promise<HCPEmployee[]> {
    const data = await this.callAPI<{ employees: HCPEmployee[] }>('/employees', {
      page_size: 100,
    });
    return data.employees || [];
  }

  async getBookingWindows(date: string): Promise<HCPBookingWindow[]> {
    console.log('[HousecallProClient] Getting booking windows for date:', date);
    const data = await this.callAPI<{ booking_windows: HCPBookingWindow[] }>(
      '/company/schedule_availability/booking_windows',
      {
        start_date: date,
        end_date: date,
      }
    );
    console.log('[HousecallProClient] Booking windows response:', JSON.stringify(data.booking_windows));
    console.log('[HousecallProClient] First window available?', data.booking_windows?.[0]?.available);
    
    const windows = data.booking_windows || [];
    
    // Log availability summary
    const availableCount = windows.filter(w => w.available).length;
    console.log(`[HousecallProClient] ${availableCount} of ${windows.length} windows are available`);
    
    // NO FAKE DATA - Return exactly what the API gives us
    return windows;
  }

  async getJobs(params: {
    scheduled_start_min?: string;
    scheduled_start_max?: string;
    employee_ids?: string[];
    work_status?: string[];
  }): Promise<HCPJob[]> {
    const data = await this.callAPI<{ jobs: HCPJob[] }>('/jobs', {
      ...params,
      page_size: 100,
    });
    return data.jobs || [];
  }

  async getEstimates(params: {
    scheduled_start_min?: string;
    scheduled_start_max?: string;
    employee_ids?: string[];
    work_status?: string[];
  }): Promise<HCPJob[]> {
    const data = await this.callAPI<{ estimates: HCPJob[] }>('/estimates', {
      ...params,
      page_size: 100,
    });
    return data.estimates || [];
  }

  async searchCustomers(searchParams: {
    phone?: string;
    email?: string;
    name?: string;
  }): Promise<any[]> {
    try {
      console.log(`[HousecallProClient] Searching for customer:`, searchParams);
      
      // Clear cache to ensure fresh data
      this.cache.clear();
      
      // Get customers with pagination to ensure we find all customers
      let allCustomers: any[] = [];
      let page = 1;
      let hasMorePages = true;
      
      while (hasMorePages && page <= 5) { // Limit to 5 pages for now
        console.log(`[HousecallProClient] Fetching page ${page} of customers...`);
        const data = await this.callAPI<{ customers: any[] }>('/customers', {
          page: page,
          page_size: 50 // Get more customers per page
        });
        
        const pageCustomers = data.customers || [];
        allCustomers.push(...pageCustomers);
        
        console.log(`[HousecallProClient] Page ${page}: Got ${pageCustomers.length} customers (total: ${allCustomers.length})`);
        
        // If we got fewer customers than page_size, we've reached the end
        hasMorePages = pageCustomers.length === 50;
        page++;
        
        // Small delay between API calls to be respectful
        if (hasMorePages) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      console.log(`[HousecallProClient] Retrieved ${allCustomers.length} customers from API`);
      
      if (allCustomers.length === 0) {
        console.log('[HousecallProClient] No customers returned from API');
        return [];
      }
      
      // Filter locally to find matching customers
      let matches = allCustomers;
      
      // Filter by phone if provided
      if (searchParams.phone) {
        const searchPhone = searchParams.phone.replace(/\D/g, '');
        console.log(`[HousecallProClient] Filtering by phone: ${searchPhone}`);
        
        matches = matches.filter(customer => {
          const customerPhone = (customer.mobile_number || '').replace(/\D/g, '');
          const match = customerPhone === searchPhone;
          if (match) {
            console.log(`[HousecallProClient] Phone match found for ${customer.first_name} ${customer.last_name}: ${customer.mobile_number}`);
          }
          return match;
        });
      }
      
      // Filter by name if provided  
      if (searchParams.name) {
        const searchName = searchParams.name.toLowerCase().trim();
        console.log(`[HousecallProClient] Filtering by name: "${searchName}"`);
        
        matches = matches.filter(customer => {
          const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.toLowerCase().trim();
          const firstNameMatch = (customer.first_name || '').toLowerCase() === searchName.split(' ')[0]?.toLowerCase();
          const lastNameMatch = (customer.last_name || '').toLowerCase() === searchName.split(' ').slice(1).join(' ').toLowerCase();
          const fullNameMatch = fullName === searchName;
          
          const match = fullNameMatch || (firstNameMatch && lastNameMatch);
          if (match) {
            console.log(`[HousecallProClient] Name match found: "${fullName}" matches "${searchName}"`);
          }
          return match;
        });
      }
      
      console.log(`[HousecallProClient] Final filtered results: ${matches.length} customers`);
      return matches;
      
    } catch (error) {
      console.error('[HousecallProClient] Customer search failed:', (error as Error).message);
      Logger.error('Customer search failed', { error: (error as Error).message, searchParams });
      return [];
    }
  }

  private getMockData(endpoint: string): any {
    Logger.warn('Using mock data', { endpoint });

    if (endpoint.includes('/employees')) {
      return {
        employees: [
          {
            id: 'emp_mock_nate',
            first_name: 'Nate',
            last_name: 'Johnson',
            can_be_booked_online: true,
            is_active: true,
          },
          {
            id: 'emp_mock_nick',
            first_name: 'Nick',
            last_name: 'Johnson',
            can_be_booked_online: true,
            is_active: true,
          },
          {
            id: 'emp_mock_jahz',
            first_name: 'Jahz',
            last_name: 'Tech',
            can_be_booked_online: true,
            is_active: true,
          },
        ],
      };
    }

    if (endpoint.includes('booking_windows')) {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentHour = now.getHours();
      
      // Generate booking windows that are always in the future
      const windows: HCPBookingWindow[] = [];
      
      // DISABLED: Don't generate fake same-day slots in production
      // Only return empty windows to properly show "Next Day Guarantee"
      if (false && currentHour < 17) { // Disabled mock same-day slots
        // Business hours: 8 AM - 5 PM for plumbing service
        const businessHourEnd = 17; // 5 PM
        
        // Generate realistic morning/afternoon slots
        if (currentHour < 11) {
          // Morning slots
          windows.push({
            id: 'window_morning_1',
            start_time: '09:00',
            end_time: '11:00',
            date: today,
            available: true,
            employee_ids: ['emp_mock_nate', 'emp_mock_nick'],
          });
          
          windows.push({
            id: 'window_morning_2',
            start_time: '11:00',
            end_time: '13:00',
            date: today,
            available: true,
            employee_ids: ['emp_mock_jahz'],
          });
        } else if (currentHour < 15) {
          // Afternoon slots
          windows.push({
            id: 'window_afternoon_1',
            start_time: '13:00',
            end_time: '15:00',
            date: today,
            available: true,
            employee_ids: ['emp_mock_nate', 'emp_mock_nick'],
          });
          
          windows.push({
            id: 'window_afternoon_2',
            start_time: '15:00',
            end_time: '17:00',
            date: today,
            available: true,
            employee_ids: ['emp_mock_jahz'],
          });
        } else {
          // Late afternoon slot (last chance for same day)
          windows.push({
            id: 'window_late_afternoon',
            start_time: '15:00',
            end_time: '17:00',
            date: today,
            available: true,
            employee_ids: ['emp_mock_nate', 'emp_mock_nick', 'emp_mock_jahz'],
          });
        }
      }
      
      // If no same-day windows (or it's late), add tomorrow morning slots
      if (windows.length === 0) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        windows.push(
          {
            id: 'window_tomorrow_1',
            start_time: '08:00',
            end_time: '10:00',
            date: tomorrowStr,
            available: true,
            employee_ids: ['emp_mock_nate'],
          },
          {
            id: 'window_tomorrow_2',
            start_time: '10:00',
            end_time: '12:00',
            date: tomorrowStr,
            available: true,
            employee_ids: ['emp_mock_nick', 'emp_mock_jahz'],
          },
          {
            id: 'window_tomorrow_3',
            start_time: '14:00',
            end_time: '16:00',
            date: tomorrowStr,
            available: true,
            employee_ids: ['emp_mock_nate', 'emp_mock_jahz'],
          }
        );
      }
      
      return {
        booking_windows: windows,
      };
    }

    if (endpoint.includes('/jobs')) {
      // Return fewer jobs to show more availability
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
      
      return {
        jobs: [
          {
            id: 'job_mock_1',
            employee_ids: ['emp_mock_nate'],
            scheduled_start: oneHourAgo.toISOString(),
            scheduled_end: now.toISOString(),
            work_status: 'completed',
            duration_minutes: 60,
          },
        ],
      };
    }


    return {};
  }
}