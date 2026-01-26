/**
 * Landing Page Registry
 *
 * Central configuration for all landing pages with tracking metadata.
 * Used for analytics, deployment tracking, and A/B test management.
 */

export interface LandingPageEntry {
  // Page identification
  id: string;
  name: string;
  path: string;

  // Deployment info
  status: 'active' | 'draft' | 'paused' | 'archived';
  deployedAt?: string; // ISO date
  lastUpdated: string;

  // Traffic sources
  sources: {
    type: 'google-ads' | 'meta-ads' | 'organic' | 'direct' | 'email' | 'referral';
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    adAccount?: string;
    monthlyBudget?: number;
  }[];

  // Conversion tracking
  conversionGoal: string;
  primaryCTA: string;
  expectedConversionRate?: number; // baseline %

  // A/B testing
  abTest?: {
    testId: string;
    variant: 'A' | 'B' | 'C';
    startDate: string;
    endDate?: string;
  };

  // Target audience
  targetAudience: string;
  targetLocations: string[];
  targetKeywords: string[];

  // Notes
  notes?: string;
}

export const LANDING_PAGES: LandingPageEntry[] = [
  // ============================================
  // EMERGENCY/URGENT SERVICE LANDING PAGES
  // ============================================
  {
    id: 'emergency-plumbing',
    name: 'Emergency Plumbing Landing',
    path: '/landing/emergency',
    status: 'active',
    deployedAt: '2024-06-01',
    lastUpdated: '2026-01-26',
    sources: [
      {
        type: 'google-ads',
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'emergency-plumbing',
        adAccount: 'JBP-Emergency',
        monthlyBudget: 500,
      },
      {
        type: 'organic',
        utmSource: 'google',
        utmMedium: 'organic',
      },
    ],
    conversionGoal: 'emergency-booking',
    primaryCTA: 'GET EMERGENCY HELP',
    expectedConversionRate: 8,
    targetAudience: 'Homeowners with urgent plumbing issues',
    targetLocations: ['Quincy', 'Braintree', 'Weymouth', 'Milton'],
    targetKeywords: ['emergency plumber', '24/7 plumbing', 'burst pipe', 'plumber near me'],
    abTest: {
      testId: 'emergency-hero-2026q1',
      variant: 'A',
      startDate: '2026-01-01',
    },
  },
  {
    id: 'emergency-plumbing-service',
    name: 'Emergency Service Page',
    path: '/service/emergency-plumbing-landing',
    status: 'active',
    deployedAt: '2024-08-15',
    lastUpdated: '2026-01-26',
    sources: [
      {
        type: 'google-ads',
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'emergency-service',
      },
    ],
    conversionGoal: 'emergency-service-booking',
    primaryCTA: 'Book Emergency Service',
    expectedConversionRate: 6,
    targetAudience: 'Urgent service seekers',
    targetLocations: ['South Shore MA'],
    targetKeywords: ['emergency plumber quincy', 'plumbing emergency'],
  },

  // ============================================
  // SERVICE-SPECIFIC LANDING PAGES
  // ============================================
  {
    id: 'drain-cleaning',
    name: 'Drain Cleaning Landing',
    path: '/landing/drain-cleaning',
    status: 'active',
    deployedAt: '2024-07-01',
    lastUpdated: '2026-01-26',
    sources: [
      {
        type: 'google-ads',
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'drain-cleaning',
        monthlyBudget: 300,
      },
    ],
    conversionGoal: 'drain-cleaning-booking',
    primaryCTA: 'Schedule Drain Service',
    expectedConversionRate: 5,
    targetAudience: 'Homeowners with slow/clogged drains',
    targetLocations: ['Quincy', 'Weymouth', 'Braintree'],
    targetKeywords: ['drain cleaning', 'clogged drain', 'slow drain', 'drain service'],
  },
  {
    id: 'drain-cleaning-service',
    name: 'Drain Cleaning Service Page',
    path: '/service/drain-cleaning-landing',
    status: 'active',
    deployedAt: '2024-08-15',
    lastUpdated: '2026-01-26',
    sources: [
      {
        type: 'google-ads',
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'drain-service',
      },
      {
        type: 'organic',
      },
    ],
    conversionGoal: 'drain-service-booking',
    primaryCTA: 'Get Drain Cleaned',
    targetAudience: 'Property owners needing drain services',
    targetLocations: ['South Shore MA'],
    targetKeywords: ['drain cleaning quincy', 'clogged drain service'],
  },
  {
    id: 'water-heater',
    name: 'Water Heater Landing',
    path: '/service/water-heater-landing',
    status: 'active',
    deployedAt: '2024-09-01',
    lastUpdated: '2026-01-26',
    sources: [
      {
        type: 'google-ads',
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'water-heater',
        monthlyBudget: 400,
      },
    ],
    conversionGoal: 'water-heater-booking',
    primaryCTA: 'Schedule Installation',
    expectedConversionRate: 4,
    targetAudience: 'Homeowners needing water heater service',
    targetLocations: ['Quincy', 'Weymouth', 'Braintree', 'Plymouth'],
    targetKeywords: ['water heater repair', 'water heater installation', 'tankless water heater', 'no hot water'],
  },
  {
    id: 'sewer-line',
    name: 'Sewer Line Landing',
    path: '/service/sewer-line-landing',
    status: 'active',
    deployedAt: '2024-10-01',
    lastUpdated: '2026-01-26',
    sources: [
      {
        type: 'google-ads',
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'sewer-line',
        monthlyBudget: 350,
      },
    ],
    conversionGoal: 'sewer-booking',
    primaryCTA: 'Get Free Inspection',
    expectedConversionRate: 3,
    targetAudience: 'Homeowners with sewer issues',
    targetLocations: ['South Shore MA'],
    targetKeywords: ['sewer line repair', 'sewer backup', 'sewer replacement'],
  },
  {
    id: 'pipe-repair',
    name: 'Pipe Repair Landing',
    path: '/service/pipe-repair-landing',
    status: 'active',
    deployedAt: '2024-10-15',
    lastUpdated: '2026-01-26',
    sources: [
      {
        type: 'google-ads',
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'pipe-repair',
      },
    ],
    conversionGoal: 'pipe-repair-booking',
    primaryCTA: 'Schedule Repair',
    targetAudience: 'Homeowners with pipe issues',
    targetLocations: ['South Shore MA'],
    targetKeywords: ['pipe repair', 'leaking pipe', 'pipe replacement'],
  },

  // ============================================
  // SEASONAL/PROMOTIONAL LANDING PAGES
  // ============================================
  {
    id: 'winter-prep',
    name: 'Winter Prep Landing',
    path: '/landing/winter-prep',
    status: 'active',
    deployedAt: '2025-10-15',
    lastUpdated: '2026-01-26',
    sources: [
      {
        type: 'google-ads',
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'winter-prep-2026',
        monthlyBudget: 250,
      },
      {
        type: 'email',
        utmSource: 'email',
        utmMedium: 'newsletter',
        utmCampaign: 'winter-prep-blast',
      },
    ],
    conversionGoal: 'winter-prep-booking',
    primaryCTA: 'Schedule Winterization',
    expectedConversionRate: 6,
    targetAudience: 'Homeowners preparing for winter',
    targetLocations: ['South Shore MA'],
    targetKeywords: ['winterize pipes', 'frozen pipe prevention', 'winter plumbing'],
    notes: 'Seasonal page - activate Oct-Feb',
  },

  // ============================================
  // LOCATION-SPECIFIC LANDING PAGES
  // ============================================
  {
    id: 'gables-condo',
    name: 'Gables Condo Landing',
    path: '/landing/gables-condo',
    status: 'active',
    deployedAt: '2025-11-01',
    lastUpdated: '2026-01-26',
    sources: [
      {
        type: 'direct',
        utmSource: 'direct',
        utmMedium: 'flyer',
        utmCampaign: 'gables-condo',
      },
      {
        type: 'referral',
        utmSource: 'referral',
        utmMedium: 'property-manager',
      },
    ],
    conversionGoal: 'gables-booking',
    primaryCTA: 'Schedule Service',
    expectedConversionRate: 10,
    targetAudience: 'Gables Condo residents',
    targetLocations: ['Quincy - Marina Bay'],
    targetKeywords: ['gables condo plumber', 'marina bay plumbing'],
    notes: 'Partnership with property management',
  },
];

/**
 * Get landing page by path
 */
export function getLandingPageByPath(path: string): LandingPageEntry | undefined {
  return LANDING_PAGES.find(page => page.path === path);
}

/**
 * Get landing page by ID
 */
export function getLandingPageById(id: string): LandingPageEntry | undefined {
  return LANDING_PAGES.find(page => page.id === id);
}

/**
 * Get all active landing pages
 */
export function getActiveLandingPages(): LandingPageEntry[] {
  return LANDING_PAGES.filter(page => page.status === 'active');
}

/**
 * Get landing pages with A/B tests
 */
export function getABTestingPages(): LandingPageEntry[] {
  return LANDING_PAGES.filter(page => page.abTest);
}

/**
 * Get total monthly budget across all landing pages
 */
export function getTotalMonthlyBudget(): number {
  return LANDING_PAGES.reduce((total, page) => {
    const pageBudget = page.sources.reduce((sum, source) =>
      sum + (source.monthlyBudget || 0), 0);
    return total + pageBudget;
  }, 0);
}
