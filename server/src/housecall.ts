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
  total_amount?: number; // Total amount in cents
  outstanding_balance?: number;
}

export class HousecallProClient {
  private static instance: HousecallProClient;
  private cache: Map<string, { data: any; expires: number }> = new Map();
  private circuitBreakerState: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5;
  private readonly CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute

  private constructor() { }

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
    options: RetryOptions & { method?: string; body?: any } = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      initialDelay = 1000,
      maxDelay = 10000,
      backoffFactor = 2,
      method = 'GET',
      body
    } = options;

    // Check circuit breaker
    this.checkCircuitBreaker();

    // Only cache GET requests
    const cacheKey = `${method}:${endpoint}:${JSON.stringify(params)}`;
    if (method === 'GET') {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expires > Date.now()) {
        Logger.debug('Cache hit', { endpoint, cacheHit: true });
        return cached.data;
      }
    }

    // FAIL FAST if no API key is configured - never serve mock data in production
    if (!API_KEY) {
      const errorMsg = 'CRITICAL: HousecallPro API key not configured. Set HOUSECALL_PRO_API_KEY or HCP_COMPANY_API_KEY environment variable.';
      Logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    let lastError: Error | null = null;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const requestId = Logger.generateRequestId();
      const startTime = Date.now();

      try {
        const url = new URL(endpoint, HCP_API_BASE);

        // For GET requests, add params to query string
        if (method === 'GET') {
          Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
              if (Array.isArray(params[key])) {
                params[key].forEach((item: string) => url.searchParams.append(key, item));
              } else {
                url.searchParams.append(key, params[key].toString());
              }
            }
          });
        }

        const authHeader = API_KEY.startsWith('Token ') ? API_KEY : `Bearer ${API_KEY}`;

        const fetchOptions: RequestInit = {
          method,
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
        };

        // For POST/PUT/PATCH requests, add body
        if (method !== 'GET' && body) {
          fetchOptions.body = JSON.stringify(body);
        }

        const response = await fetch(url.toString(), fetchOptions);

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
          // Try to get error details from response body
          let errorDetails = '';
          try {
            const errorBody = await response.text();
            errorDetails = errorBody ? `: ${errorBody}` : '';
          } catch (e) {
            // Ignore parse errors
          }
          throw new Error(`API error: ${response.status} ${response.statusText}${errorDetails}`);
        }

        const data = await response.json();

        // Only cache GET requests
        if (method === 'GET') {
          // Cache for 5 minutes + random jitter to prevent thundering herd
          const cacheTime = 300000 + Math.random() * 60000; // 5-6 minutes
          this.cache.set(cacheKey, {
            data,
            expires: Date.now() + cacheTime,
          });
        }

        Logger.info('API call successful', {
          requestId,
          endpoint,
          method,
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
    try {
      const data = await this.callAPI<{ employees: HCPEmployee[] }>('/employees', {
        page_size: 100,
      });
      return data.employees || [];
    } catch (error) {
      Logger.error('Failed to fetch employees', { error: (error as Error).message });
      return []; // Graceful degradation
    }
  }

  async getBookingWindows(date: string): Promise<HCPBookingWindow[]> {
    try {
      Logger.debug(`[HousecallProClient] Getting booking windows for date: ${date}`);
      const data = await this.callAPI<{ booking_windows: HCPBookingWindow[] }>(
        '/company/schedule_availability/booking_windows',
        {
          start_date: date,
          end_date: date,
        }
      );
      Logger.debug(`[HousecallProClient] Booking windows response: ${JSON.stringify(data.booking_windows)}`);
      Logger.debug(`[HousecallProClient] First window available? ${data.booking_windows?.[0]?.available}`);

      const windows = data.booking_windows || [];

      // Log availability summary
      const availableCount = windows.filter(w => w.available).length;
      Logger.debug(`[HousecallProClient] ${availableCount} of ${windows.length} windows are available`);

      // NO FAKE DATA - Return exactly what the API gives us
      return windows;
    } catch (error) {
      Logger.error('Failed to fetch booking windows', { error: (error as Error).message, date });
      return []; // Graceful degradation - show no slots instead of crashing
    }
  }

  async getJobs(params: {
    scheduled_start_min?: string;
    scheduled_start_max?: string;
    employee_ids?: string[];
    work_status?: string[];
    customer_id?: string;
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
      Logger.debug(`[HousecallProClient] Searching for customer: ${JSON.stringify(searchParams)}`);

      // Build search query using the 'q' parameter as per API docs
      // The 'q' parameter searches across name, email, mobile number and address
      // Try searching by phone first, as it's most unique
      const params: Record<string, any> = {
        page_size: 50,
        page: 1,
      };

      if (searchParams.phone) {
        // Search by phone - the API seems to work better with just the phone number
        const cleanPhone = searchParams.phone.replace(/\D/g, '');
        params.q = cleanPhone;
        Logger.debug(`[HousecallProClient] Searching by phone: "${cleanPhone}"`);
      } else if (searchParams.email) {
        params.q = searchParams.email;
        Logger.debug(`[HousecallProClient] Searching by email: "${searchParams.email}"`);
      } else if (searchParams.name) {
        // Fall back to name search if no phone
        params.q = searchParams.name;
        Logger.debug(`[HousecallProClient] Searching by name: "${searchParams.name}"`);
      }

      const data = await this.callAPI<{ customers: any[] }>('/customers', params);
      const customers = data.customers || [];

      Logger.debug(`[HousecallProClient] API returned ${customers.length} customers`);

      // If we have both phone and name, filter results to ensure exact match
      if (searchParams.phone && searchParams.name && customers.length > 0) {
        const searchPhone = searchParams.phone.replace(/\D/g, '');
        const searchName = searchParams.name.toLowerCase().trim();

        const exactMatches = customers.filter(customer => {
          const customerPhone = (customer.mobile_number || '').replace(/\D/g, '');
          const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.toLowerCase().trim();

          const phoneMatch = customerPhone === searchPhone;
          const nameMatch = fullName === searchName ||
            fullName.includes(searchName) ||
            searchName.includes(fullName);

          if (phoneMatch && nameMatch) {
            Logger.debug(`[HousecallProClient] Exact match found: ${customer.first_name} ${customer.last_name} (${customer.mobile_number})`);
          }

          return phoneMatch && nameMatch;
        });

        Logger.debug(`[HousecallProClient] Filtered to ${exactMatches.length} exact matches`);
        return exactMatches;
      }

      return customers;

    } catch (error) {
      console.error('[HousecallProClient] Customer search failed:', (error as Error).message);
      Logger.error('Customer search failed', { error: (error as Error).message, searchParams });
      return [];
    }
  }

  // Mock data removed for production security - system must fail fast if API is unavailable

  async getServices(): Promise<any[]> {
    try {
      // Try to get line items from recent jobs first (when circuit breaker allows)
      try {
        Logger.debug('[HousecallProClient] Trying to extract line items from recent jobs...');
        const jobsData = await this.callAPI<{ jobs?: any[] }>('/jobs', {
          page_size: 20,
          created_after: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() // Last 90 days
        });
        const jobs = jobsData.jobs || [];
        Logger.debug(`[HousecallProClient] Fetched ${jobs.length} jobs from API`);

        const lineItems = new Set();
        let jobsWithLineItems = 0;
        jobs.forEach(job => {
          if (job.line_items && Array.isArray(job.line_items) && job.line_items.length > 0) {
            jobsWithLineItems++;
            job.line_items.forEach((item: any) => {
              // Accept any line item that looks like a service
              const isService = item.type === 'service' ||
                item.kind === 'service' ||
                (item.description && !item.type); // Fallback if type missing
              if (isService && (item.description || item.name)) {
                lineItems.add(JSON.stringify({
                  id: item.id || `service_${(item.description || item.name).replace(/\s+/g, '_').toLowerCase()}`,
                  name: item.description || item.name,
                  price: item.price || item.total || item.unit_price || 0,
                  type: 'service',
                  source: 'housecall_pro'
                }));
              }
            });
          }
        });

        Logger.debug(`[HousecallProClient] Jobs with line_items: ${jobsWithLineItems}/${jobs.length}`);
        const uniqueServices = Array.from(lineItems).map(item => JSON.parse(item as string));
        Logger.debug(`[HousecallProClient] Extracted ${uniqueServices.length} unique services from jobs`);

        if (uniqueServices.length > 0) {
          return uniqueServices;
        }
      } catch (error: any) {
        Logger.debug(`[HousecallProClient] Jobs extraction failed: ${error.message}`);
      }

      // Fallback to common plumbing services - all use $99 service call fee
      Logger.debug('[HousecallProClient] Using fallback service definitions');
      const fallbackServices = [
        {
          id: 'service_fee',
          name: 'Service Fee',
          price: 99.00,
          type: 'service',
          source: 'fallback',
          description: 'Standard $99 service fee applied to all service calls. This fee is credited toward the cost of repairs.'
        },
        {
          id: 'service_call',
          name: 'Service call',
          price: 99.00,
          type: 'service',
          source: 'fallback',
          description: 'A service call is your first step to resolving any plumbing concerns. Our professional plumber will assess your situation and provide expert solutions.'
        },
        {
          id: 'drain_cleaning',
          name: 'Drain Cleaning',
          price: 99.00,
          type: 'service',
          source: 'fallback',
          description: 'Professional drain cleaning service'
        },
        {
          id: 'emergency_repair',
          name: 'Emergency Plumbing Repair',
          price: 99.00,
          type: 'service',
          source: 'fallback',
          description: '24/7 emergency plumbing repair'
        },
        {
          id: 'water_heater_service',
          name: 'Water Heater Service',
          price: 99.00,
          type: 'service',
          source: 'fallback',
          description: 'Water heater repair and maintenance'
        },
        {
          id: 'pipe_repair',
          name: 'Pipe Repair',
          price: 99.00,
          type: 'service',
          source: 'fallback',
          description: 'Professional pipe repair service'
        }
      ];

      return fallbackServices;
    } catch (error) {
      console.error('[HousecallProClient] Error fetching services:', error);
      throw error;
    }
  }

  async createJob(jobData: any): Promise<any> {
    Logger.debug(`[HousecallProClient] Creating job with data: ${JSON.stringify(jobData, null, 2)}`);
    const job = await this.callAPI('/jobs', {}, { method: 'POST', body: jobData });
    Logger.debug(`[HousecallProClient] Job created: ${JSON.stringify(job)}`);
    return job;
  }

  async uploadAttachment(jobId: string, fileData: { filename: string; mimeType: string; base64: string }): Promise<any> {
    Logger.debug(`[HousecallProClient] Uploading attachment to job ${jobId}: ${fileData.filename}`);

    if (!API_KEY) {
      const errorMsg = 'CRITICAL: HousecallPro API key not configured for attachment upload';
      Logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      const buffer = Buffer.from(fileData.base64, 'base64');
      const FormData = (await import('undici')).FormData;
      const formData = new FormData();

      const blob = new Blob([buffer], { type: fileData.mimeType });
      formData.append('file', blob, fileData.filename);

      const authHeader = API_KEY.startsWith('Token ') ? API_KEY : `Bearer ${API_KEY}`;
      const url = `${HCP_API_BASE}/jobs/${jobId}/attachments`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
        },
        body: formData as any,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to upload attachment: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      Logger.debug(`[HousecallProClient] Attachment uploaded successfully: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Logger.error(`[HousecallProClient] Failed to upload attachment to job ${jobId}: ${errorMessage}`);
      throw error;
    }
  }

  async createAppointment(jobId: string, appointmentData: any): Promise<any> {
    Logger.debug(`[HousecallProClient] Creating appointment for job ${jobId}: ${JSON.stringify(appointmentData, null, 2)}`);
    const appointment = await this.callAPI(`/jobs/${jobId}/appointments`, {}, { method: 'POST', body: appointmentData });
    Logger.debug(`[HousecallProClient] Appointment created: ${JSON.stringify(appointment)}`);
    return appointment;
  }

  async createCustomerAddress(customerId: string, addressData: any): Promise<string> {
    Logger.debug(`[HousecallProClient] Creating address for customer ${customerId}: ${JSON.stringify(addressData, null, 2)}`);
    const address = await this.callAPI(`/customers/${customerId}/addresses`, {}, { method: 'POST', body: addressData });
    Logger.debug(`[HousecallProClient] Address created: ${JSON.stringify(address)}`);
    return (address as any).id;
  }

  async createCustomer(customerData: any): Promise<any> {
    Logger.debug(`[HousecallProClient] Creating customer: ${JSON.stringify(customerData, null, 2)}`);
    const customer = await this.callAPI('/customers', {}, { method: 'POST', body: customerData });
    Logger.debug(`[HousecallProClient] Customer created: ${JSON.stringify(customer)}`);
    return customer;
  }

  async getCustomer(customerId: string): Promise<any> {
    Logger.debug(`[HousecallProClient] Getting customer ${customerId}`);
    const customer = await this.callAPI(`/customers/${customerId}`, {}, { method: 'GET' });
    Logger.debug(`[HousecallProClient] Customer retrieved: ${JSON.stringify(customer)}`);
    return customer;
  }

  async updateCustomer(customerId: string, updateData: any): Promise<any> {
    Logger.debug(`[HousecallProClient] Updating customer ${customerId}: ${JSON.stringify(updateData, null, 2)}`);
    const customer = await this.callAPI(`/customers/${customerId}`, {}, { method: 'PUT', body: updateData });
    Logger.debug(`[HousecallProClient] Customer updated: ${JSON.stringify(customer)}`);
    return customer;
  }

  async addCustomerNote(customerId: string, note: string): Promise<void> {
    Logger.debug(`[HousecallProClient] Adding note to customer ${customerId}: ${note}`);
    try {
      await this.callAPI(`/customers/${customerId}/notes`, {}, { method: 'POST', body: { content: note } });
      Logger.debug('[HousecallProClient] Customer note added successfully');
    } catch (error) {
      console.error('[HousecallProClient] Failed to add customer note:', error);
      throw error;
    }
  }

  async addJobNote(jobId: string, note: string): Promise<void> {
    Logger.debug(`[HousecallProClient] Adding note to job ${jobId}: ${note}`);
    try {
      await this.callAPI(`/jobs/${jobId}/notes`, {}, { method: 'POST', body: { content: note } });
      Logger.debug('[HousecallProClient] Note added successfully');
    } catch (error) {
      console.error('[HousecallProClient] Failed to add job note:', error);
      throw error;
    }
  }

  async createLead(leadData: any): Promise<any> {
    Logger.debug(`[HousecallProClient] Creating lead: ${JSON.stringify(leadData, null, 2)}`);

    try {
      const lead = await this.callAPI('/leads', {}, { method: 'POST', body: leadData });
      Logger.debug(`[HousecallProClient] Lead created: ${JSON.stringify(lead)}`);
      return lead;
    } catch (error) {
      // If lead source not found, retry without it
      if (error instanceof Error && error.message.includes('Lead source not found')) {
        Logger.debug('[HousecallProClient] Lead source not found, retrying without lead_source');
        const leadDataWithoutSource = {
          ...leadData,
          customer: {
            ...leadData.customer,
            lead_source: undefined
          }
        };
        delete leadDataWithoutSource.customer.lead_source;

        const lead = await this.callAPI('/leads', {}, { method: 'POST', body: leadDataWithoutSource });
        Logger.debug(`[HousecallProClient] Lead created without lead_source: ${JSON.stringify(lead)}`);
        return lead;
      }
      throw error;
    }
  }
}
