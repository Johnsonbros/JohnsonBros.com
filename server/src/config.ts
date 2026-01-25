import fs from 'fs';
import path from 'path';
import { parse } from 'yaml';

export interface BookingWindow {
  id: string;
  label: string;
  start_hour: number;
  end_hour: number;
  arrival_window: number;
}

export interface CapacityConfig {
  thresholds: {
    same_day_fee_waived: number;
    limited_same_day: number;
  };
  tech_map: {
    nate: string;
    nick: string;
    jahz: string;
  };
  geos: string[];
  express_zones?: {
    tier1?: string[];
    tier2?: string[];
    tier3?: string[];
  };
  service_area?: {
    norfolk_county?: string[];
    suffolk_county?: string[];
    plymouth_county?: string[];
  };
  ads_rules: {
    brand_min_daily: number;
    discovery_min_daily: number;
    same_day_boost_pct: number;
    limited_same_day_boost_pct: number;
    next_day_cut_pct: number;
    never_pause_brand: boolean;
  };
  colors: {
    primary_navy: string;
    secondary_silver: string;
    background_white: string;
    accent_red: string;
  };
  ui_copy: {
    [key: string]: {
      headline: string;
      subhead: string;
      cta: string;
      badge: string;
      urgent: boolean;
    };
  };
  fee_waive: {
    promo_tag: string;
    discount_amount: number;
    utm_source: string;
    utm_campaign: string;
  };
  booking_windows?: BookingWindow[];
}

let cachedConfig: CapacityConfig | null = null;
let lastModified: number = 0;

export function loadConfig(): CapacityConfig {
  const configPath = path.join(process.cwd(), 'config', 'capacity.yml');
  
  try {
    const stats = fs.statSync(configPath);
    
    // Hot-reload if file has changed
    if (stats.mtimeMs > lastModified || !cachedConfig) {
      const yamlContent = fs.readFileSync(configPath, 'utf8');
      cachedConfig = parse(yamlContent) as CapacityConfig;
      lastModified = stats.mtimeMs;
      console.log('[Config] Loaded capacity configuration');
    }
    
    return cachedConfig!;
  } catch (error) {
    console.error('[Config] Failed to load capacity.yml:', error);
    
    // Return default config if file doesn't exist
    return {
      thresholds: {
        same_day_fee_waived: 0.35,
        limited_same_day: 0.10,
      },
      tech_map: {
        nate: 'pro_19f45ddb23864f13ba5ffb20710e77e8',
        nick: 'pro_784bb427ee27422f892b2db87dbdaf03',
        jahz: 'pro_b0a7d40a10dc4477908cc808f62054ff',
      },
      geos: ['02170', '02169', '02171', '02351', '02184'],
      ads_rules: {
        brand_min_daily: 50,
        discovery_min_daily: 25,
        same_day_boost_pct: 50,
        limited_same_day_boost_pct: 25,
        next_day_cut_pct: 30,
        never_pause_brand: true,
      },
      colors: {
        primary_navy: '#0b2a6f',
        secondary_silver: '#c0c7d1',
        background_white: '#ffffff',
        accent_red: '#d32f2f',
      },
      ui_copy: {
        SAME_DAY_FEE_WAIVED: {
          headline: 'Same-Day Service Available!',
          subhead: "Book now and we'll waive the emergency fee",
          cta: 'Book Same-Day Service',
          badge: 'Fee Waived',
          urgent: true,
        },
        LIMITED_SAME_DAY: {
          headline: 'Limited Same-Day Availability',
          subhead: 'We have a few spots left today',
          cta: 'Check Availability',
          badge: 'Today',
          urgent: false,
        },
        NEXT_DAY: {
          headline: 'Schedule for Tomorrow',
          subhead: 'Fast, reliable service at your convenience',
          cta: 'Book for Tomorrow',
          badge: 'Next Day',
          urgent: false,
        },
        EMERGENCY_ONLY: {
          headline: 'Weekend Emergency Service',
          subhead: 'Available for urgent plumbing issues',
          cta: 'Call for Emergency Service',
          badge: 'Emergency',
          urgent: true,
        },
      },
      fee_waive: {
        promo_tag: 'FEEWAIVED_SAMEDAY',
        discount_amount: 99,
        utm_source: 'site',
        utm_campaign: 'capacity',
      },
    };
  }
}

// Handle SIGHUP for config reload
if (process.platform !== 'win32') {
  process.on('SIGHUP', () => {
    console.log('[Config] Received SIGHUP, reloading configuration...');
    cachedConfig = null;
    loadConfig();
  });
}