import { analytics } from '@/lib/monitoring/analytics';

export interface ABTest {
  id: string;
  name: string;
  description: string;
  variants: ABTestVariant[];
  trafficAllocation: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  startDate?: Date;
  endDate?: Date;
  winnerVariantId?: string;
  targetAudience?: {
    newVisitors?: boolean;
    returningVisitors?: boolean;
    mobileOnly?: boolean;
    desktopOnly?: boolean;
    serviceArea?: string[];
  };
}

export interface ABTestVariant {
  id: string;
  name: string;
  weight: number;
  changes: Record<string, any>;
  isControl?: boolean;
}

export interface ABTestAssignment {
  testId: string;
  variantId: string;
  assignedAt: number;
}

export interface ABTestMetrics {
  variantId: string;
  impressions: number;
  conversions: number;
  conversionRate: number;
  bounceRate: number;
  avgTimeOnPage: number;
  revenue: number;
  statisticalSignificance?: number;
}

const COOKIE_PREFIX = 'ab_test_';
const COOKIE_EXPIRY_DAYS = 30;
const VISITOR_ID_KEY = 'ab_visitor_id';

class ABTestingManager {
  private static instance: ABTestingManager;
  private tests: Map<string, ABTest> = new Map();
  private assignments: Map<string, ABTestAssignment> = new Map();
  private visitorId: string;

  private constructor() {
    this.visitorId = this.getOrCreateVisitorId();
    this.loadAssignments();
  }

  static getInstance(): ABTestingManager {
    if (!ABTestingManager.instance) {
      ABTestingManager.instance = new ABTestingManager();
    }
    return ABTestingManager.instance;
  }

  private getOrCreateVisitorId(): string {
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);
    if (!visitorId) {
      visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }
    return visitorId;
  }

  private loadAssignments(): void {
    const cookies = document.cookie.split(';');
    cookies.forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name.startsWith(COOKIE_PREFIX)) {
        const testId = name.replace(COOKIE_PREFIX, '');
        try {
          const assignment = JSON.parse(decodeURIComponent(value));
          this.assignments.set(testId, assignment);
        } catch (e) {
          console.error(`Failed to parse A/B test assignment for ${testId}`, e);
        }
      }
    });
  }

  private saveAssignment(testId: string, assignment: ABTestAssignment): void {
    const cookieName = `${COOKIE_PREFIX}${testId}`;
    const cookieValue = encodeURIComponent(JSON.stringify(assignment));
    const expires = new Date();
    expires.setDate(expires.getDate() + COOKIE_EXPIRY_DAYS);
    
    document.cookie = `${cookieName}=${cookieValue}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    this.assignments.set(testId, assignment);
  }

  private hashVisitorId(visitorId: string, testId: string): number {
    let hash = 0;
    const str = `${visitorId}_${testId}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  registerTest(test: ABTest): void {
    this.tests.set(test.id, test);
  }

  private selectVariant(test: ABTest): ABTestVariant {
    const hash = this.hashVisitorId(this.visitorId, test.id);
    const bucket = (hash % 10000) / 10000;

    if (Math.random() > test.trafficAllocation) {
      return test.variants.find(v => v.isControl) || test.variants[0];
    }

    let cumulativeWeight = 0;
    const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0);

    for (const variant of test.variants) {
      cumulativeWeight += variant.weight / totalWeight;
      if (bucket < cumulativeWeight) {
        return variant;
      }
    }

    return test.variants[test.variants.length - 1];
  }

  getVariant(testId: string): ABTestVariant | null {
    const test = this.tests.get(testId);
    if (!test || test.status !== 'active') {
      return null;
    }

    const existingAssignment = this.assignments.get(testId);
    
    if (existingAssignment) {
      const variant = test.variants.find(v => v.id === existingAssignment.variantId);
      if (variant) {
        this.trackImpression(testId, variant.id);
        return variant;
      }
    }

    if (!this.shouldParticipateInTest(test)) {
      return test.variants.find(v => v.isControl) || test.variants[0];
    }

    const variant = this.selectVariant(test);
    const assignment: ABTestAssignment = {
      testId,
      variantId: variant.id,
      assignedAt: Date.now()
    };

    this.saveAssignment(testId, assignment);
    this.trackAssignment(testId, variant.id);
    this.trackImpression(testId, variant.id);

    return variant;
  }

  private shouldParticipateInTest(test: ABTest): boolean {
    if (!test.targetAudience) {
      return true;
    }

    const { newVisitors, returningVisitors, mobileOnly, desktopOnly } = test.targetAudience;

    const isReturning = document.cookie.includes('returning_visitor=true');
    const isMobile = /mobile/i.test(navigator.userAgent);

    if (newVisitors !== undefined && newVisitors !== !isReturning) {
      return false;
    }

    if (returningVisitors !== undefined && returningVisitors !== isReturning) {
      return false;
    }

    if (mobileOnly && !isMobile) {
      return false;
    }

    if (desktopOnly && isMobile) {
      return false;
    }

    return true;
  }

  private trackAssignment(testId: string, variantId: string): void {
    analytics.trackEvent('ab_test_assignment', {
      test_id: testId,
      variant_id: variantId,
      visitor_id: this.visitorId
    });
  }

  private trackImpression(testId: string, variantId: string): void {
    analytics.trackEvent('ab_test_impression', {
      test_id: testId,
      variant_id: variantId,
      visitor_id: this.visitorId
    });
  }

  trackConversion(testId: string, conversionType: string, value?: number): void {
    const assignment = this.assignments.get(testId);
    if (!assignment) {
      return;
    }

    analytics.trackEvent('ab_test_conversion', {
      test_id: testId,
      variant_id: assignment.variantId,
      conversion_type: conversionType,
      conversion_value: value,
      visitor_id: this.visitorId
    });
  }

  trackEngagement(testId: string, action: string, value?: any): void {
    const assignment = this.assignments.get(testId);
    if (!assignment) {
      return;
    }

    analytics.trackEvent('ab_test_engagement', {
      test_id: testId,
      variant_id: assignment.variantId,
      action,
      value,
      visitor_id: this.visitorId
    });
  }

  getActiveTests(): ABTest[] {
    return Array.from(this.tests.values()).filter(test => test.status === 'active');
  }

  getTestAssignments(): Map<string, ABTestAssignment> {
    return new Map(this.assignments);
  }

  clearAssignment(testId: string): void {
    const cookieName = `${COOKIE_PREFIX}${testId}`;
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    this.assignments.delete(testId);
  }

  clearAllAssignments(): void {
    this.assignments.forEach((_, testId) => {
      this.clearAssignment(testId);
    });
  }
}

export const abTestingManager = ABTestingManager.getInstance();

export const predefinedTests: ABTest[] = [
  {
    id: 'booking_cta_text',
    name: 'Booking CTA Text Test',
    description: 'Test different call-to-action text for booking buttons',
    trafficAllocation: 1.0,
    status: 'active',
    variants: [
      {
        id: 'control',
        name: 'Book Now',
        weight: 50,
        isControl: true,
        changes: {
          buttonText: 'Book Now',
          urgencyText: null
        }
      },
      {
        id: 'free_quote',
        name: 'Get Free Quote',
        weight: 50,
        changes: {
          buttonText: 'Get Free Quote',
          urgencyText: 'No obligation'
        }
      }
    ]
  },
  {
    id: 'hero_headline',
    name: 'Hero Headline Test',
    description: 'Test different headline variations on the hero section',
    trafficAllocation: 1.0,
    status: 'active',
    variants: [
      {
        id: 'control',
        name: 'Professional & Reliable',
        weight: 33,
        isControl: true,
        changes: {
          headline: 'Professional Plumbing Services',
          subheadline: 'Reliable & Affordable Solutions for Your Home'
        }
      },
      {
        id: 'emergency_focus',
        name: 'Emergency Focus',
        weight: 33,
        changes: {
          headline: '24/7 Emergency Plumbing',
          subheadline: 'Fast Response When You Need It Most'
        }
      },
      {
        id: 'trust_focus',
        name: 'Trust Focus',
        weight: 34,
        changes: {
          headline: 'Trusted by 5000+ Homeowners',
          subheadline: 'Licensed, Insured & Guaranteed Service'
        }
      }
    ]
  },
  {
    id: 'pricing_display',
    name: 'Pricing Display Format',
    description: 'Test different ways of displaying pricing information',
    trafficAllocation: 1.0,
    status: 'active',
    variants: [
      {
        id: 'control',
        name: 'Standard Pricing',
        weight: 50,
        isControl: true,
        changes: {
          showStartingPrice: true,
          showSavings: false,
          showMonthlyBreakdown: false
        }
      },
      {
        id: 'savings_focus',
        name: 'Savings Focus',
        weight: 50,
        changes: {
          showStartingPrice: true,
          showSavings: true,
          showMonthlyBreakdown: true
        }
      }
    ]
  },
  {
    id: 'urgency_messaging',
    name: 'Urgency Messaging Test',
    description: 'Test different urgency messages and indicators',
    trafficAllocation: 1.0,
    status: 'active',
    variants: [
      {
        id: 'control',
        name: 'No Urgency',
        weight: 33,
        isControl: true,
        changes: {
          showUrgency: false,
          urgencyMessage: null,
          showLimitedSlots: false
        }
      },
      {
        id: 'limited_slots',
        name: 'Limited Slots',
        weight: 33,
        changes: {
          showUrgency: true,
          urgencyMessage: 'Only {slots} appointments left today',
          showLimitedSlots: true
        }
      },
      {
        id: 'time_sensitive',
        name: 'Time Sensitive',
        weight: 34,
        changes: {
          showUrgency: true,
          urgencyMessage: 'Book within {time} for same-day service',
          showLimitedSlots: false
        }
      }
    ]
  },
  {
    id: 'trust_badges',
    name: 'Trust Badges Placement',
    description: 'Test different placements and combinations of trust badges',
    trafficAllocation: 1.0,
    status: 'active',
    variants: [
      {
        id: 'control',
        name: 'Footer Only',
        weight: 33,
        isControl: true,
        changes: {
          headerBadges: false,
          heroBadges: false,
          footerBadges: true,
          floatingBadges: false
        }
      },
      {
        id: 'hero_placement',
        name: 'Hero Section',
        weight: 33,
        changes: {
          headerBadges: false,
          heroBadges: true,
          footerBadges: true,
          floatingBadges: false
        }
      },
      {
        id: 'floating',
        name: 'Floating Badge',
        weight: 34,
        changes: {
          headerBadges: false,
          heroBadges: false,
          footerBadges: true,
          floatingBadges: true
        }
      }
    ]
  }
];