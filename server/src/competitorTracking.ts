/**
 * Competitor Tracking Service
 *
 * Tracks competitor rankings, content strategies, and PE activity in the Boston plumbing market.
 * Provides insights to stay ahead of private equity consolidation.
 */

import { db } from '../db';
import {
  competitors,
  seoKeywords,
  competitorKeywordRankings,
  competitorPages,
  peActivityLog,
  type InsertCompetitor,
  type InsertSeoKeyword,
  type InsertCompetitorKeywordRanking,
  type InsertPeActivityLog,
} from '@shared/schema';
import { eq, desc, and, gte, sql } from 'drizzle-orm';
import pino from 'pino';

const logger = pino({ name: 'competitor-tracking' });

// ==============================================
// COMPETITOR MANAGEMENT
// ==============================================

/**
 * Add a new competitor to track
 */
export async function addCompetitor(data: InsertCompetitor) {
  try {
    const [result] = await db.insert(competitors).values(data).returning();
    logger.info({ competitor: data.name }, 'Added new competitor');
    return result;
  } catch (error) {
    logger.error({ error, data }, 'Failed to add competitor');
    throw error;
  }
}

/**
 * Get all active competitors
 */
export async function getCompetitors(options?: { priorityOnly?: boolean; type?: string }) {
  // Build the where conditions
  const conditions = [eq(competitors.isActive, true)];

  if (options?.priorityOnly) {
    conditions.push(eq(competitors.isPriority, true));
  }

  if (options?.type) {
    conditions.push(eq(competitors.type, options.type));
  }

  return db.select()
    .from(competitors)
    .where(and(...conditions))
    .orderBy(desc(competitors.isPriority), competitors.name);
}

/**
 * Initialize with known competitors from the South Shore market
 * Updated Jan 2026 with PE-backed threats and local competitors
 */
export async function seedCompetitors() {
  const knownCompetitors: InsertCompetitor[] = [
    // ========================================
    // PE-BACKED COMPETITORS (CRITICAL THREATS)
    // ========================================
    {
      name: 'Sila Services (Boston Standard)',
      domain: 'boston.sila.com',
      website: 'https://boston.sila.com',
      city: 'Mattapan',
      type: 'pe_backed',
      peOwner: 'Goldman Sachs Alternatives',
      yearEstablished: 2008,
      offersPlumbing: true,
      offersHeating: true,
      offersCooling: true,
      offersElectrical: true,
      offersEmergency: true,
      isPriority: true,
      notes: 'CRITICAL: Goldman Sachs PE owned. Acquired Boston Standard & New England Ductless Jan 2022. 13 brands across Northeast. Owns Wildcat Plumbing (Weymouth).',
    },
    {
      name: 'GEM Plumbing & Heating',
      domain: 'askgem.com',
      website: 'https://askgem.com',
      city: 'Lincoln',
      state: 'RI',
      type: 'pe_backed',
      peOwner: 'HomeX / New Mountain Capital',
      yearEstablished: 1949,
      offersPlumbing: true,
      offersHeating: true,
      offersCooling: true,
      offersElectrical: true,
      offersEmergency: true,
      isPriority: true,
      notes: 'CRITICAL: 700 employees, 500 trucks. MA locations: Plymouth, Taunton, Walpole, Falmouth, Harwich, Yarmouth, Bellingham, Fall River. Expanding into South Shore.',
    },
    {
      name: 'Wildcat Plumbing',
      domain: 'wildcatplumbingservices.com',
      website: 'https://www.wildcatplumbingservices.com',
      phone: '833-620-3192',
      address: '100 Old Country Way',
      city: 'Weymouth',
      type: 'pe_backed',
      peOwner: 'Sila Group / Goldman Sachs',
      offersPlumbing: true,
      offersDrainCleaning: true,
      offersEmergency: true,
      isPriority: true,
      notes: 'Part of Sila Group. Direct South Shore competitor in Weymouth. 15+ years experience.',
    },
    {
      name: 'Full Swing Plumbing (fka Pilgrim)',
      domain: 'callfullswing.com',
      website: 'https://callfullswing.com',
      address: '77 Accord Park Dr D14',
      city: 'Norwell',
      type: 'pe_backed',
      yearEstablished: 2015,
      offersPlumbing: true,
      offersHeating: true,
      offersCooling: true,
      offersEmergency: true,
      isPriority: true,
      notes: 'Rebranded from Pilgrim Plumbing. Suspected PE investment. Norwell = South Shore territory.',
    },

    // ========================================
    // DIRECT LOCAL THREATS (SAME TERRITORY)
    // ========================================
    {
      name: 'Trust 1 Services',
      domain: 'trust1services.com',
      website: 'https://www.trust1services.com',
      phone: '617-420-1358',
      address: '11-17 Newbury St, Ste 2',
      city: 'Quincy',
      type: 'local',
      yearEstablished: 2018,
      offersPlumbing: true,
      offersHeating: true,
      offersCooling: true,
      offersEmergency: true,
      isPriority: true,
      notes: 'DIRECT COMPETITOR IN QUINCY! Also Hanover location. 900+ 5-star reviews. Aggressive marketing. Serves Weymouth, Braintree, Hingham, Hull, Cohasset.',
    },
    {
      name: 'Gouthro Plumbing & Heating',
      domain: 'gouthroplumbing.com',
      website: 'http://gouthroplumbing.com',
      phone: '781-878-9113',
      address: '500 Washington St',
      city: 'Abington',
      type: 'local',
      yearEstablished: 1970,
      offersPlumbing: true,
      offersHeating: true,
      offersEmergency: true,
      isPriority: true,
      notes: 'DIRECT COMPETITOR IN ABINGTON! 55+ years. Family-owned. Same Google Maps territory.',
    },
    {
      name: 'Aspinwall Plumbing, Heating & Air',
      domain: 'aspinwallplumbing.com',
      website: 'https://www.aspinwallplumbing.com',
      phone: '617-539-7672',
      city: 'Quincy',
      type: 'local',
      yearEstablished: 1972,
      offersPlumbing: true,
      offersHeating: true,
      offersCooling: true,
      offersDrainCleaning: true,
      offersEmergency: true,
      isPriority: true,
      notes: '50+ years in business, family-owned, aggressive SEO. Main local competitor.',
    },
    {
      name: 'Quincy Plumbing and Heating',
      domain: 'quincyplumbingandheating.com',
      website: 'https://www.quincyplumbingandheating.com',
      phone: '617-471-1785',
      city: 'Quincy',
      type: 'local',
      yearEstablished: 1978,
      offersPlumbing: true,
      offersHeating: true,
      offersDrainCleaning: true,
      isPriority: true,
      notes: '47+ years in business. Strong local brand.',
    },
    {
      name: 'Green Energy Mechanical Inc',
      domain: 'greenenergymech.com',
      website: 'https://greenenergymech.com',
      phone: '781-531-8608',
      city: 'Quincy',
      type: 'local',
      yearEstablished: 2008,
      offersPlumbing: true,
      offersHeating: true,
      offersCooling: true,
      offersElectrical: true,
      offersEmergency: true,
      isPriority: true,
      notes: 'BBB A+ rated. Aggressive title tags (#1 in...). 400+ reviews claimed.',
    },
    {
      name: 'Compass Plumbing & Heating',
      domain: 'compassplumbinginc.com',
      website: 'https://compassplumbinginc.com',
      phone: '508-238-3479',
      city: 'West Bridgewater',
      type: 'local',
      yearEstablished: 1994,
      offersPlumbing: true,
      offersHeating: true,
      offersEmergency: true,
      isPriority: false,
      notes: 'Serves South Shore since 1994. Small family business. Boston to South Shore coverage.',
    },

    // ========================================
    // REGIONAL PLAYERS
    // ========================================
    {
      name: 'Yellow Dog Plumbing',
      domain: 'callyellowdog.com',
      website: 'https://callyellowdog.com',
      phone: '781-222-0869',
      address: '19 Kearney Rd',
      city: 'Needham',
      type: 'local',
      offersPlumbing: true,
      offersHeating: true,
      offersCooling: true,
      offersEmergency: true,
      isPriority: false,
      notes: 'Newton/Needham area. Family-owned. Serves Milton. Less threat - more northwest focused.',
    },
    {
      name: 'Coastal Heating & Air Conditioning',
      domain: 'coastalahr.com',
      website: 'https://coastalahr.com',
      phone: '617-770-0636',
      address: '653 Washington Street',
      city: 'Quincy',
      type: 'local',
      offersHeating: true,
      offersCooling: true,
      isPriority: false,
      notes: 'HVAC focused, not plumbing. Carrier Elite dealer.',
    },
    {
      name: 'Casper Plumbing & Heating',
      domain: 'casperphdc.com',
      website: 'https://www.casperphdc.com',
      phone: '617-823-8539',
      city: 'Quincy',
      type: 'local',
      offersPlumbing: true,
      offersHeating: true,
      offersEmergency: true,
      isPriority: false,
      notes: '24/7 service. Gas line specialists.',
    },

    // ========================================
    // NATIONAL CHAINS
    // ========================================
    {
      name: 'Roto-Rooter',
      domain: 'rotorooter.com',
      website: 'https://www.rotorooter.com/quincyma/',
      phone: '617-479-8028',
      city: 'Quincy',
      type: 'national',
      yearEstablished: 1935,
      offersPlumbing: true,
      offersDrainCleaning: true,
      offersEmergency: true,
      isPriority: true,
      notes: 'National brand. Strong SEO authority. 24/7 emergency.',
    },
    {
      name: 'RooterMan',
      domain: 'rooterman.com',
      website: 'https://www.rooterman.com/boston/',
      city: 'Boston',
      type: 'regional',
      offersPlumbing: true,
      offersDrainCleaning: true,
      offersEmergency: true,
      isPriority: false,
      notes: '50+ years. Franchise model.',
    },
  ];

  for (const competitor of knownCompetitors) {
    try {
      await db.insert(competitors)
        .values(competitor)
        .onConflictDoNothing({ target: competitors.domain });
    } catch (error) {
      logger.debug({ domain: competitor.domain }, 'Competitor already exists');
    }
  }

  logger.info({ count: knownCompetitors.length }, 'Seeded competitors');
  return knownCompetitors.length;
}

// ==============================================
// KEYWORD MANAGEMENT
// ==============================================

/**
 * Add a keyword to track
 */
export async function addKeyword(data: InsertSeoKeyword) {
  try {
    const [result] = await db.insert(seoKeywords).values(data).returning();
    logger.info({ keyword: data.keyword }, 'Added new keyword');
    return result;
  } catch (error) {
    logger.error({ error, data }, 'Failed to add keyword');
    throw error;
  }
}

/**
 * Get all active keywords
 */
export async function getKeywords(options?: { category?: string; primaryOnly?: boolean }) {
  let conditions = [eq(seoKeywords.isActive, true)];

  if (options?.category) {
    conditions.push(eq(seoKeywords.category, options.category));
  }

  if (options?.primaryOnly) {
    conditions.push(eq(seoKeywords.isPrimary, true));
  }

  return db.select()
    .from(seoKeywords)
    .where(and(...conditions))
    .orderBy(desc(seoKeywords.isPrimary), seoKeywords.keyword);
}

/**
 * Seed with target keywords for the South Shore plumbing market
 * Focus: Quincy (HQ), Abington (Google Maps), and all South Shore towns
 */
export async function seedKeywords() {
  const targetKeywords: InsertSeoKeyword[] = [
    // ==============================================
    // QUINCY (PRIMARY - HQ Location)
    // ==============================================
    { keyword: 'plumber quincy ma', category: 'plumbing', intent: 'transactional', isPrimary: true, targetUrl: '/' },
    { keyword: 'emergency plumber quincy ma', category: 'emergency', intent: 'transactional', isPrimary: true, targetUrl: '/services/emergency-plumbing' },
    { keyword: 'drain cleaning quincy ma', category: 'drain', intent: 'transactional', isPrimary: true, targetUrl: '/services/drain-cleaning' },
    { keyword: 'water heater installation quincy ma', category: 'heating', intent: 'transactional', isPrimary: true, targetUrl: '/services/water-heater' },
    { keyword: 'toilet repair quincy ma', category: 'plumbing', intent: 'transactional', isPrimary: true, targetUrl: '/services/general-plumbing' },
    { keyword: '24 hour plumber quincy ma', category: 'emergency', intent: 'transactional', isPrimary: true, targetUrl: '/services/emergency-plumbing' },
    { keyword: 'tankless water heater quincy ma', category: 'heating', intent: 'transactional', isPrimary: false, targetUrl: '/services/water-heater' },
    { keyword: 'furnace repair quincy ma', category: 'heating', intent: 'transactional', isPrimary: false, targetUrl: '/services/heating' },
    { keyword: 'boiler repair quincy ma', category: 'heating', intent: 'transactional', isPrimary: false, targetUrl: '/services/heating' },
    { keyword: 'viessmann boiler repair quincy', category: 'heating', intent: 'transactional', isPrimary: false, targetUrl: '/heating/viessmann-boiler-repair-quincy-ma-reliable-heating-services' },
    { keyword: 'clogged drain quincy ma', category: 'drain', intent: 'transactional', isPrimary: false, targetUrl: '/services/drain-cleaning' },
    { keyword: 'sewer line repair quincy ma', category: 'drain', intent: 'transactional', isPrimary: false, targetUrl: '/services/drain-cleaning' },
    { keyword: 'garbage disposal repair quincy ma', category: 'plumbing', intent: 'transactional', isPrimary: false, targetUrl: '/services/general-plumbing' },
    { keyword: 'new construction plumber quincy ma', category: 'plumbing', intent: 'transactional', isPrimary: false, targetUrl: '/services/new-construction' },
    { keyword: 'emergency drain cleaning quincy', category: 'emergency', intent: 'transactional', isPrimary: false, targetUrl: '/services/emergency-plumbing' },
    { keyword: 'burst pipe repair quincy ma', category: 'emergency', intent: 'transactional', isPrimary: false, targetUrl: '/services/emergency-plumbing' },
    { keyword: 'frozen pipes quincy ma', category: 'emergency', intent: 'transactional', isPrimary: false, targetUrl: '/services/emergency-plumbing' },
    // Quincy neighborhoods
    { keyword: 'plumber wollaston ma', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/quincy', notes: 'Quincy neighborhood' },
    { keyword: 'plumber quincy center', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/quincy', notes: 'Quincy neighborhood' },
    { keyword: 'plumber north quincy', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/quincy', notes: 'Quincy neighborhood' },
    { keyword: 'plumber squantum ma', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/quincy', notes: 'Quincy neighborhood' },
    { keyword: 'plumber houghs neck', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/quincy', notes: 'Quincy neighborhood' },

    // ==============================================
    // ABINGTON (SECONDARY - Google Maps Location)
    // ==============================================
    { keyword: 'plumber abington ma', category: 'location', intent: 'transactional', isPrimary: true, targetUrl: '/service-areas/abington' },
    { keyword: 'emergency plumber abington ma', category: 'location', intent: 'transactional', isPrimary: true, targetUrl: '/service-areas/abington' },
    { keyword: 'drain cleaning abington ma', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/abington' },
    { keyword: 'water heater abington ma', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/abington' },

    // ==============================================
    // SOUTH SHORE TOWNS (Priority Expansion)
    // ==============================================
    // Weymouth
    { keyword: 'plumber weymouth ma', category: 'location', intent: 'transactional', isPrimary: true, targetUrl: '/service-areas/weymouth' },
    { keyword: 'emergency plumber weymouth ma', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/weymouth' },
    { keyword: 'drain cleaning weymouth ma', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/weymouth' },
    { keyword: 'plumber south weymouth', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/weymouth', notes: 'Weymouth neighborhood' },
    { keyword: 'plumber east weymouth', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/weymouth', notes: 'Weymouth neighborhood' },

    // Braintree
    { keyword: 'plumber braintree ma', category: 'location', intent: 'transactional', isPrimary: true, targetUrl: '/service-areas/braintree' },
    { keyword: 'emergency plumber braintree ma', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/braintree' },
    { keyword: 'drain cleaning braintree ma', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/braintree' },
    { keyword: 'plumber south braintree', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/braintree', notes: 'Braintree neighborhood' },

    // Rockland
    { keyword: 'plumber rockland ma', category: 'location', intent: 'transactional', isPrimary: true, targetUrl: '/service-areas/rockland' },
    { keyword: 'emergency plumber rockland ma', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/rockland' },
    { keyword: 'drain cleaning rockland ma', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/rockland' },

    // Hanover
    { keyword: 'plumber hanover ma', category: 'location', intent: 'transactional', isPrimary: true, targetUrl: '/service-areas/hanover' },
    { keyword: 'emergency plumber hanover ma', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/hanover' },

    // Holbrook
    { keyword: 'plumber holbrook ma', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/holbrook' },
    { keyword: 'drain cleaning holbrook ma', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/holbrook' },

    // Randolph
    { keyword: 'plumber randolph ma', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/randolph' },
    { keyword: 'emergency plumber randolph ma', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/randolph' },

    // Milton
    { keyword: 'plumber milton ma', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/milton' },
    { keyword: 'drain cleaning milton ma', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/milton' },

    // Hull
    { keyword: 'plumber hull ma', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/hull' },
    { keyword: 'emergency plumber hull ma', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/hull' },

    // Hingham
    { keyword: 'plumber hingham ma', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/hingham' },
    { keyword: 'drain cleaning hingham ma', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/hingham' },

    // Cohasset
    { keyword: 'plumber cohasset ma', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/cohasset' },

    // Scituate
    { keyword: 'plumber scituate ma', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/scituate' },

    // Marshfield
    { keyword: 'plumber marshfield ma', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/marshfield' },

    // Norwell
    { keyword: 'plumber norwell ma', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/norwell' },

    // Pembroke
    { keyword: 'plumber pembroke ma', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/pembroke' },

    // Duxbury
    { keyword: 'plumber duxbury ma', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/duxbury' },

    // Kingston
    { keyword: 'plumber kingston ma', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/kingston' },

    // Plymouth
    { keyword: 'plumber plymouth ma', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/plymouth' },

    // Canton
    { keyword: 'plumber canton ma', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/canton' },

    // Stoughton
    { keyword: 'plumber stoughton ma', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/stoughton' },

    // Whitman
    { keyword: 'plumber whitman ma', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/whitman' },

    // East Bridgewater
    { keyword: 'plumber east bridgewater ma', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/east-bridgewater' },

    // West Bridgewater
    { keyword: 'plumber west bridgewater ma', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/west-bridgewater' },

    // Bridgewater
    { keyword: 'plumber bridgewater ma', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/service-areas/bridgewater' },

    // ==============================================
    // SOUTH SHORE REGIONAL
    // ==============================================
    { keyword: 'plumber south shore ma', category: 'location', intent: 'transactional', isPrimary: true, targetUrl: '/service-areas' },
    { keyword: 'emergency plumber south shore', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/services/emergency-plumbing' },
    { keyword: 'drain cleaning south shore ma', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/services/drain-cleaning' },
    { keyword: 'best plumber south shore', category: 'location', intent: 'transactional', isPrimary: false, targetUrl: '/' },

    // ==============================================
    // INFORMATIONAL (Blog Content Opportunities)
    // ==============================================
    { keyword: 'how to unclog a drain', category: 'drain', intent: 'informational', isPrimary: false, notes: 'Blog content opportunity' },
    { keyword: 'water heater maintenance tips', category: 'heating', intent: 'informational', isPrimary: false, notes: 'Blog content opportunity' },
    { keyword: 'signs you need a new water heater', category: 'heating', intent: 'informational', isPrimary: false, notes: 'Blog content opportunity' },
    { keyword: 'how to prevent frozen pipes massachusetts', category: 'emergency', intent: 'informational', isPrimary: false, notes: 'Blog - seasonal content' },
    { keyword: 'when to call emergency plumber', category: 'emergency', intent: 'informational', isPrimary: false, notes: 'Blog content opportunity' },
    { keyword: 'tankless vs tank water heater', category: 'heating', intent: 'informational', isPrimary: false, notes: 'Blog content opportunity' },
  ];

  for (const keyword of targetKeywords) {
    try {
      await db.insert(seoKeywords)
        .values(keyword)
        .onConflictDoNothing({ target: seoKeywords.keyword });
    } catch (error) {
      logger.debug({ keyword: keyword.keyword }, 'Keyword already exists');
    }
  }

  logger.info({ count: targetKeywords.length }, 'Seeded keywords');
  return targetKeywords.length;
}

// ==============================================
// RANKING TRACKING
// ==============================================

/**
 * Record a ranking check result
 */
export async function recordRanking(data: InsertCompetitorKeywordRanking) {
  try {
    const [result] = await db.insert(competitorKeywordRankings).values(data).returning();
    return result;
  } catch (error) {
    logger.error({ error, data }, 'Failed to record ranking');
    throw error;
  }
}

/**
 * Get latest rankings for a keyword
 */
export async function getLatestRankings(keywordId: number, limit = 10) {
  return db.select({
    id: competitorKeywordRankings.id,
    domain: competitorKeywordRankings.domain,
    position: competitorKeywordRankings.position,
    url: competitorKeywordRankings.url,
    snippet: competitorKeywordRankings.snippet,
    checkDate: competitorKeywordRankings.checkDate,
  })
  .from(competitorKeywordRankings)
  .where(eq(competitorKeywordRankings.keywordId, keywordId))
  .orderBy(desc(competitorKeywordRankings.checkDate))
  .limit(limit);
}

/**
 * Get ranking trends for our domain
 */
export async function getOurRankingTrends(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return db.select({
    keyword: seoKeywords.keyword,
    category: seoKeywords.category,
    position: competitorKeywordRankings.position,
    url: competitorKeywordRankings.url,
    checkDate: competitorKeywordRankings.checkDate,
  })
  .from(competitorKeywordRankings)
  .innerJoin(seoKeywords, eq(competitorKeywordRankings.keywordId, seoKeywords.id))
  .where(and(
    eq(competitorKeywordRankings.domain, 'thejohnsonbros.com'),
    gte(competitorKeywordRankings.checkDate, since)
  ))
  .orderBy(seoKeywords.keyword, desc(competitorKeywordRankings.checkDate));
}

/**
 * Get competitor comparison for a keyword
 */
export async function getKeywordComparison(keywordId: number) {
  // Get the most recent ranking for each domain
  const latestRankings = await db.select({
    domain: competitorKeywordRankings.domain,
    position: competitorKeywordRankings.position,
    url: competitorKeywordRankings.url,
    snippet: competitorKeywordRankings.snippet,
    checkDate: sql<Date>`MAX(${competitorKeywordRankings.checkDate})`.as('check_date'),
  })
  .from(competitorKeywordRankings)
  .where(eq(competitorKeywordRankings.keywordId, keywordId))
  .groupBy(competitorKeywordRankings.domain, competitorKeywordRankings.position, competitorKeywordRankings.url, competitorKeywordRankings.snippet)
  .orderBy(competitorKeywordRankings.position);

  return latestRankings;
}

// ==============================================
// PE ACTIVITY TRACKING
// ==============================================

/**
 * Log PE activity
 */
export async function logPeActivity(data: InsertPeActivityLog) {
  try {
    const [result] = await db.insert(peActivityLog).values(data).returning();
    logger.info({ peCompany: data.peCompany, activity: data.activityType }, 'Logged PE activity');
    return result;
  } catch (error) {
    logger.error({ error, data }, 'Failed to log PE activity');
    throw error;
  }
}

/**
 * Get recent PE activity
 */
export async function getRecentPeActivity(days = 90) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return db.select()
    .from(peActivityLog)
    .where(gte(peActivityLog.createdAt, since))
    .orderBy(desc(peActivityLog.createdAt));
}

/**
 * Seed known PE companies and their activity
 * Updated Jan 2026 with Sila (Goldman Sachs) and GEM (New Mountain Capital)
 */
export async function seedPeActivity() {
  const knownActivity: InsertPeActivityLog[] = [
    // ========================================
    // CRITICAL - ALREADY IN OUR TERRITORY
    // ========================================
    {
      peCompany: 'Goldman Sachs Alternatives (Sila Group)',
      activityType: 'acquisition',
      targetCompany: 'Boston Standard Company + New England Ductless',
      targetLocation: 'Mattapan, MA / Milton, MA',
      announcementDate: new Date('2022-01-01'),
      summary: 'Goldman Sachs PE acquired Sila Services. Sila owns Boston Standard, New England Ductless, Wildcat Plumbing (Weymouth). 13 brands across Northeast.',
      threatLevel: 'critical',
      sourceUrl: 'https://www.prnewswire.com/news-releases/sila-acquires-boston-standard-company-and-new-england-ductless-301468738.html',
      notes: 'CRITICAL: Goldman Sachs money. Already operating in South Shore via Wildcat Plumbing (Weymouth). Aggressive expansion.',
    },
    {
      peCompany: 'New Mountain Capital (HomeX/GEM)',
      activityType: 'expansion',
      targetCompany: 'GEM Plumbing & Heating',
      targetLocation: 'Plymouth, Taunton, Walpole, Fall River, Cape Cod',
      summary: 'GEM has 700 employees, 500 trucks. Massachusetts locations expanding toward South Shore. Rhode Island headquarters.',
      threatLevel: 'critical',
      sourceUrl: 'https://askgem.com',
      notes: 'CRITICAL: Massive scale. MA locations already in Plymouth, Taunton, Walpole = encircling South Shore. Watch for Quincy/Braintree expansion.',
    },
    {
      peCompany: 'Unknown PE (Full Swing/Pilgrim)',
      activityType: 'acquisition',
      targetCompany: 'Pilgrim Plumbing → Full Swing Plumbing',
      targetLocation: 'Norwell, MA',
      announcementDate: new Date('2024-01-01'),
      summary: 'Pilgrim Plumbing rebranded to Full Swing. Suspected PE investment based on rebrand pattern.',
      threatLevel: 'high',
      notes: 'Norwell is South Shore. Rebrand + "MVP for comfort" messaging = PE playbook.',
    },

    // ========================================
    // HIGH THREAT - NEARBY ACTIVITY
    // ========================================
    {
      peCompany: 'Heritage Holding',
      activityType: 'acquisition',
      targetCompany: 'Winchester Mechanical',
      targetLocation: 'Boston area',
      announcementDate: new Date('2024-08-01'),
      summary: 'Boston-based PE firm acquired Winchester Mechanical in Aug 2024.',
      threatLevel: 'high',
      notes: 'LOCAL PE FIRM actively acquiring in Boston market. Could target South Shore.',
    },

    // ========================================
    // MEDIUM THREAT - NOT YET IN BOSTON
    // ========================================
    {
      peCompany: 'Wrench Group',
      activityType: 'expansion',
      targetLocation: 'Multiple US markets (25 brands, 14 states)',
      summary: 'Operating 25 brands across 27 markets, 7,300+ employees. NOT in Boston yet.',
      threatLevel: 'medium',
      notes: 'Watch for Boston market entry. Would be major threat.',
    },
    {
      peCompany: 'Apex Service Partners (Alpine)',
      activityType: 'expansion',
      targetLocation: 'Coast-to-coast network',
      summary: '80+ brands, 8,000+ technicians. Alpine-backed. NOT confirmed in Boston.',
      threatLevel: 'medium',
      notes: 'Aggressive acquirer. Watch for Northeast expansion.',
    },
    {
      peCompany: 'Redwood Services (OMERS)',
      activityType: 'funding',
      summary: 'OMERS Private Equity backed. 60+ locations. $500M revenue target. Zero to $400M in 4 years.',
      threatLevel: 'medium',
      notes: 'Fast growing. Watch for Northeast entry.',
    },
    {
      peCompany: 'Investcorp',
      activityType: 'acquisition',
      targetCompany: 'BCTS',
      announcementDate: new Date('2024-11-01'),
      summary: 'Acquired BCTS (HVAC/Plumbing leader) for $1.2B+ fund.',
      threatLevel: 'medium',
      notes: 'Large fund, could expand to Boston.',
    },
  ];

  for (const activity of knownActivity) {
    try {
      await db.insert(peActivityLog).values(activity);
    } catch (error) {
      logger.debug({ company: activity.peCompany }, 'PE activity may already exist');
    }
  }

  logger.info({ count: knownActivity.length }, 'Seeded PE activity');
  return knownActivity.length;
}

// ==============================================
// DASHBOARD DATA
// ==============================================

/**
 * Get competitive dashboard summary
 */
export async function getCompetitiveDashboard() {
  const [
    competitorList,
    keywordList,
    recentPeActivity,
  ] = await Promise.all([
    getCompetitors({ priorityOnly: true }),
    getKeywords({ primaryOnly: true }),
    getRecentPeActivity(90),
  ]);

  // Get our latest rankings for primary keywords
  const ourRankings: Array<{
    keyword: string;
    position: number | null;
    url: string | null;
  }> = [];

  for (const kw of keywordList) {
    const rankings = await db.select({
      position: competitorKeywordRankings.position,
      url: competitorKeywordRankings.url,
    })
    .from(competitorKeywordRankings)
    .where(and(
      eq(competitorKeywordRankings.keywordId, kw.id),
      eq(competitorKeywordRankings.domain, 'thejohnsonbros.com')
    ))
    .orderBy(desc(competitorKeywordRankings.checkDate))
    .limit(1);

    ourRankings.push({
      keyword: kw.keyword,
      position: rankings[0]?.position ?? null,
      url: rankings[0]?.url ?? null,
    });
  }

  return {
    competitors: {
      total: competitorList.length,
      priority: competitorList.filter(c => c.isPriority).length,
      byType: {
        local: competitorList.filter(c => c.type === 'local').length,
        regional: competitorList.filter(c => c.type === 'regional').length,
        national: competitorList.filter(c => c.type === 'national').length,
        pe_backed: competitorList.filter(c => c.type === 'pe_backed').length,
      },
      list: competitorList,
    },
    keywords: {
      total: keywordList.length,
      rankings: ourRankings,
      ranking1to3: ourRankings.filter(r => r.position && r.position <= 3).length,
      ranking4to10: ourRankings.filter(r => r.position && r.position > 3 && r.position <= 10).length,
      notRanking: ourRankings.filter(r => !r.position || r.position > 10).length,
    },
    peActivity: {
      total: recentPeActivity.length,
      highThreat: recentPeActivity.filter(a => a.threatLevel === 'high' || a.threatLevel === 'critical').length,
      recent: recentPeActivity.slice(0, 5),
    },
  };
}

/**
 * Initialize the competitor tracking system
 */
export async function initializeCompetitorTracking() {
  logger.info('Initializing competitor tracking system...');

  const [competitorCount, keywordCount, peCount] = await Promise.all([
    seedCompetitors(),
    seedKeywords(),
    seedPeActivity(),
  ]);

  logger.info({
    competitors: competitorCount,
    keywords: keywordCount,
    peActivity: peCount,
  }, 'Competitor tracking system initialized');

  return { competitors: competitorCount, keywords: keywordCount, peActivity: peCount };
}
