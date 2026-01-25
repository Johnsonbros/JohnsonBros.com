import { analytics } from '@/lib/monitoring/analytics';
import { abTestingManager } from './abTesting';

// Conversion funnel stages
export enum FunnelStage {
  VISIT = 'visit',
  VIEW_SERVICE = 'view_service',
  START_BOOKING = 'start_booking',
  ENTER_DETAILS = 'enter_details',
  SELECT_TIME = 'select_time',
  COMPLETE_BOOKING = 'complete_booking',
  PLAN_VIEWED = 'plan_viewed',
  PLAN_CONFIGURED = 'plan_configured',
  PLAN_SIGNED_UP = 'plan_signed_up',
  UPSELL_SHOWN = 'upsell_shown',
  UPSELL_ACCEPTED = 'upsell_accepted'
}

// Micro-conversion events
export enum MicroConversion {
  FORM_START = 'form_start',
  FORM_FIELD_FILLED = 'form_field_filled',
  FORM_ABANDON = 'form_abandon',
  PHOTO_UPLOAD_START = 'photo_upload_start',
  PHOTO_UPLOAD_COMPLETE = 'photo_upload_complete',
  CHAT_OPENED = 'chat_opened',
  VIDEO_PLAYED = 'video_played',
  REVIEW_VIEWED = 'review_viewed',
  PHONE_CLICKED = 'phone_clicked',
  EMAIL_CLICKED = 'email_clicked',
  MAP_INTERACTION = 'map_interaction',
  PRICING_CALCULATOR_USED = 'pricing_calculator_used',
  SERVICE_COMPARISON = 'service_comparison',
  FAQ_EXPANDED = 'faq_expanded',
  SCROLL_DEPTH = 'scroll_depth',
  TIME_ON_PAGE = 'time_on_page'
}

// Attribution sources
export interface Attribution {
  source: string;
  medium: string;
  campaign?: string;
  term?: string;
  content?: string;
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
  utm_id?: string;
  referrer?: string;
  landingPage?: string;
  entryTime?: number;
}

interface ConversionEvent {
  type: string;
  value?: number;
  properties?: Record<string, any>;
  attribution?: Attribution;
  testData?: {
    testId: string;
    variantId: string;
  }[];
}

interface FunnelData {
  funnelId: string;
  stage: FunnelStage;
  previousStage?: FunnelStage;
  timeInStage?: number;
  properties?: Record<string, any>;
}

class ConversionTracker {
  private static instance: ConversionTracker;
  private sessionId: string;
  private attribution: Attribution | null = null;
  private funnelState: Map<string, FunnelStage> = new Map();
  private stageTimestamps: Map<string, number> = new Map();
  private microConversionBuffer: ConversionEvent[] = [];
  private flushInterval: number = 5000; // Flush every 5 seconds
  private scrollDepthMax: number = 0;
  private sessionStartTime: number;
  private pageLoadTime: number;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.pageLoadTime = Date.now();
    this.initializeAttribution();
    this.setupScrollTracking();
    this.setupTimeTracking();
    this.setupFormTracking();
    this.startFlushInterval();
  }

  static getInstance(): ConversionTracker {
    if (!ConversionTracker.instance) {
      ConversionTracker.instance = new ConversionTracker();
    }
    return ConversionTracker.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeAttribution(): void {
    const params = new URLSearchParams(window.location.search);
    
    // Get UTM parameters
    const source = params.get('utm_source') || this.getSourceFromReferrer();
    const medium = params.get('utm_medium') || this.getMediumFromReferrer();
    const campaign = params.get('utm_campaign') || undefined;
    const term = params.get('utm_term') || undefined;
    const content = params.get('utm_content') || undefined;
    
    // Get click IDs for ad platforms
    const gclid = params.get('gclid') || undefined;
    const fbclid = params.get('fbclid') || undefined;
    const msclkid = params.get('msclkid') || undefined;
    const utm_id = params.get('utm_id') || undefined;
    
    this.attribution = {
      source,
      medium,
      campaign,
      term,
      content,
      gclid,
      fbclid,
      msclkid,
      utm_id,
      referrer: document.referrer || undefined,
      landingPage: window.location.pathname,
      entryTime: Date.now()
    };

    // Store attribution in session storage for cross-page tracking
    if (this.attribution) {
      sessionStorage.setItem('conversion_attribution', JSON.stringify(this.attribution));
    }
  }

  private getSourceFromReferrer(): string {
    const referrer = document.referrer;
    if (!referrer) return 'direct';
    
    const referrerHost = new URL(referrer).hostname;
    
    // Common sources
    if (referrerHost.includes('google')) return 'google';
    if (referrerHost.includes('facebook')) return 'facebook';
    if (referrerHost.includes('bing')) return 'bing';
    if (referrerHost.includes('yahoo')) return 'yahoo';
    if (referrerHost.includes('linkedin')) return 'linkedin';
    if (referrerHost.includes('twitter')) return 'twitter';
    if (referrerHost.includes('instagram')) return 'instagram';
    
    return 'referral';
  }

  private getMediumFromReferrer(): string {
    const referrer = document.referrer;
    if (!referrer) return 'none';
    
    const referrerHost = new URL(referrer).hostname;
    
    // Search engines
    if (referrerHost.includes('google') || 
        referrerHost.includes('bing') || 
        referrerHost.includes('yahoo')) {
      return 'organic';
    }
    
    // Social media
    if (referrerHost.includes('facebook') || 
        referrerHost.includes('twitter') || 
        referrerHost.includes('instagram') || 
        referrerHost.includes('linkedin')) {
      return 'social';
    }
    
    return 'referral';
  }

  private setupScrollTracking(): void {
    let ticking = false;
    
    const updateScrollDepth = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      const scrollPercentage = Math.round((scrolled / scrollHeight) * 100);
      
      if (scrollPercentage > this.scrollDepthMax) {
        this.scrollDepthMax = scrollPercentage;
        
        // Track milestones
        if (scrollPercentage >= 25 && this.scrollDepthMax < 25) {
          this.trackMicroConversion(MicroConversion.SCROLL_DEPTH, { depth: 25 });
        }
        if (scrollPercentage >= 50 && this.scrollDepthMax < 50) {
          this.trackMicroConversion(MicroConversion.SCROLL_DEPTH, { depth: 50 });
        }
        if (scrollPercentage >= 75 && this.scrollDepthMax < 75) {
          this.trackMicroConversion(MicroConversion.SCROLL_DEPTH, { depth: 75 });
        }
        if (scrollPercentage >= 90 && this.scrollDepthMax < 90) {
          this.trackMicroConversion(MicroConversion.SCROLL_DEPTH, { depth: 90 });
        }
      }
      
      ticking = false;
    };
    
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDepth);
        ticking = true;
      }
    });
  }

  private setupTimeTracking(): void {
    // Track time on page milestones
    const timeMillestones = [30, 60, 120, 180, 300]; // seconds
    
    timeMillestones.forEach(seconds => {
      setTimeout(() => {
        this.trackMicroConversion(MicroConversion.TIME_ON_PAGE, { 
          seconds,
          page: window.location.pathname 
        });
      }, seconds * 1000);
    });

    // Track page unload time
    window.addEventListener('beforeunload', () => {
      const timeOnPage = Math.round((Date.now() - this.pageLoadTime) / 1000);
      this.trackMicroConversion(MicroConversion.TIME_ON_PAGE, { 
        seconds: timeOnPage,
        page: window.location.pathname,
        final: true
      });
      this.flushMicroConversions(); // Ensure we send data before leaving
    });
  }

  private setupFormTracking(): void {
    // Track form interactions
    document.addEventListener('focusin', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        const form = target.closest('form');
        const formName = form?.getAttribute('name') || form?.getAttribute('id') || 'unknown';
        this.trackMicroConversion(MicroConversion.FORM_FIELD_FILLED, {
          formName,
          fieldName: target.getAttribute('name') || target.getAttribute('id'),
          fieldType: target.getAttribute('type')
        });
      }
    });

    // Track form abandonment
    let formStarted: string | null = null;
    document.addEventListener('focusin', (e) => {
      const target = e.target as HTMLElement;
      const form = target.closest('form');
      if (form && !formStarted) {
        formStarted = form.getAttribute('name') || form.getAttribute('id') || 'unknown';
        this.trackMicroConversion(MicroConversion.FORM_START, { formName: formStarted });
      }
    });

    window.addEventListener('beforeunload', () => {
      if (formStarted) {
        this.trackMicroConversion(MicroConversion.FORM_ABANDON, { formName: formStarted });
      }
    });
  }

  private startFlushInterval(): void {
    setInterval(() => {
      this.flushMicroConversions();
    }, this.flushInterval);
  }

  private async flushMicroConversions(): Promise<void> {
    if (this.microConversionBuffer.length === 0) return;

    const events = [...this.microConversionBuffer];
    this.microConversionBuffer = [];

    try {
      await fetch('/api/v1/conversions/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          events
        })
      });
    } catch (error) {
      console.error('Failed to send micro-conversions:', error);
      // Re-add events to buffer on failure
      this.microConversionBuffer.unshift(...events);
    }
  }

  // Public API

  trackFunnelStage(funnelId: string, stage: FunnelStage, properties?: Record<string, any>): void {
    const previousStage = this.funnelState.get(funnelId);
    const previousTimestamp = this.stageTimestamps.get(`${funnelId}_${previousStage}`);
    
    const timeInStage = previousTimestamp ? Date.now() - previousTimestamp : 0;
    
    this.funnelState.set(funnelId, stage);
    this.stageTimestamps.set(`${funnelId}_${stage}`, Date.now());

    const funnelData: FunnelData = {
      funnelId,
      stage,
      previousStage,
      timeInStage,
      properties
    };

    // Send to analytics
    analytics.trackFunnelStep(funnelId, stage, {
      ...properties,
      previousStage,
      timeInStage,
      sessionId: this.sessionId,
      ...this.getActiveTestData()
    });

    // Send to backend
    this.sendConversionEvent({
      type: 'funnel_stage',
      properties: funnelData,
      attribution: this.attribution || undefined
    });
  }

  trackConversion(
    type: string, 
    value?: number, 
    properties?: Record<string, any>
  ): void {
    const event: ConversionEvent = {
      type,
      value,
      properties,
      attribution: this.attribution || undefined,
      testData: this.getActiveTestData()
    };

    // Send to analytics
    analytics.trackEvent(`conversion_${type}`, {
      value,
      ...properties,
      sessionId: this.sessionId,
      ...this.attribution
    });

    // Track in A/B tests
    const activeTests = abTestingManager.getTestAssignments();
    activeTests.forEach((assignment, testId) => {
      abTestingManager.trackConversion(testId, type, value);
    });

    // Send to backend
    this.sendConversionEvent(event);
  }

  trackMicroConversion(type: MicroConversion, properties?: Record<string, any>): void {
    const event: ConversionEvent = {
      type: `micro_${type}`,
      properties: {
        ...properties,
        timestamp: Date.now(),
        page: window.location.pathname
      }
    };

    this.microConversionBuffer.push(event);

    // Send to analytics for important micro-conversions
    if ([
      MicroConversion.PHOTO_UPLOAD_COMPLETE,
      MicroConversion.PRICING_CALCULATOR_USED,
      MicroConversion.PHONE_CLICKED,
      MicroConversion.VIDEO_PLAYED
    ].includes(type)) {
      analytics.trackEvent(`micro_conversion_${type}`, properties);
    }
  }

  trackAttribution(attribution: Partial<Attribution>): void {
    this.attribution = {
      ...this.attribution,
      ...attribution
    } as Attribution;
    
    sessionStorage.setItem('conversion_attribution', JSON.stringify(this.attribution));
  }

  getAttribution(): Attribution | null {
    if (!this.attribution) {
      const stored = sessionStorage.getItem('conversion_attribution');
      if (stored) {
        this.attribution = JSON.parse(stored);
      }
    }
    return this.attribution;
  }

  private getActiveTestData(): any {
    const testData: any[] = [];
    const activeTests = abTestingManager.getTestAssignments();
    
    activeTests.forEach((assignment, testId) => {
      testData.push({
        testId,
        variantId: assignment.variantId
      });
    });

    return testData.length > 0 ? { abTests: testData } : {};
  }

  private async sendConversionEvent(event: ConversionEvent): Promise<void> {
    try {
      await fetch('/api/v1/conversions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          ...event
        })
      });
    } catch (error) {
      console.error('Failed to send conversion event:', error);
    }
  }

  // Session recording stub - would integrate with a tool like FullStory or Hotjar
  startSessionRecording(): void {
    // This would integrate with a session recording tool
    console.log('Session recording started (integration required)');
  }

  // Heatmap data collection stub
  trackHeatmapInteraction(x: number, y: number, type: 'click' | 'move' | 'scroll'): void {
    // This would send data to a heatmap service
    const data = {
      x,
      y,
      type,
      page: window.location.pathname,
      timestamp: Date.now(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
    
    // Buffer and batch send heatmap data
    console.log('Heatmap interaction:', data);
  }
}

export const conversionTracker = ConversionTracker.getInstance();