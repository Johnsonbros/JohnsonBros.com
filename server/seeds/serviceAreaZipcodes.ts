// Service Area Zip Codes for Norfolk, Suffolk, and Plymouth Counties, Massachusetts
// Run this seed to populate the service_area_zipcodes table

import { db } from '../db';
import { serviceAreaZipcodes } from '@shared/schema';

const NORFOLK_COUNTY_ZIPS = [
  { zip: "02021", city: "Canton" },
  { zip: "02025", city: "Cohasset" },
  { zip: "02026", city: "Dedham" },
  { zip: "02027", city: "Dedham" },
  { zip: "02030", city: "Dover" },
  { zip: "02032", city: "East Walpole" },
  { zip: "02035", city: "Foxborough" },
  { zip: "02038", city: "Franklin" },
  { zip: "02043", city: "Hingham" },
  { zip: "02045", city: "Hull" },
  { zip: "02047", city: "Humarock" },
  { zip: "02050", city: "Marshfield" },
  { zip: "02052", city: "Medfield" },
  { zip: "02053", city: "Medway" },
  { zip: "02054", city: "Millis" },
  { zip: "02056", city: "Norfolk" },
  { zip: "02061", city: "Norwell" },
  { zip: "02062", city: "Norwood" },
  { zip: "02066", city: "Scituate" },
  { zip: "02067", city: "Sharon" },
  { zip: "02070", city: "Sheldonville" },
  { zip: "02071", city: "South Walpole" },
  { zip: "02072", city: "Stoughton" },
  { zip: "02081", city: "Walpole" },
  { zip: "02090", city: "Westwood" },
  { zip: "02093", city: "Wrentham" },
  { zip: "02169", city: "Quincy" },
  { zip: "02170", city: "Quincy" },
  { zip: "02171", city: "Quincy" },
  { zip: "02184", city: "Braintree" },
  { zip: "02185", city: "Braintree" },
  { zip: "02186", city: "Milton" },
  { zip: "02187", city: "Milton Village" },
  { zip: "02188", city: "Weymouth" },
  { zip: "02189", city: "Weymouth" },
  { zip: "02190", city: "Weymouth" },
  { zip: "02191", city: "North Weymouth" },
  { zip: "02269", city: "Quincy" },
  { zip: "02368", city: "Randolph" },
  { zip: "02375", city: "South Easton" },
  { zip: "02382", city: "Whitman" },
  { zip: "02445", city: "Brookline" },
  { zip: "02446", city: "Brookline" },
  { zip: "02447", city: "Brookline Village" },
  { zip: "02457", city: "Babson Park" },
  { zip: "02459", city: "Newton Center" },
  { zip: "02460", city: "Newtonville" },
  { zip: "02461", city: "Newton Highlands" },
  { zip: "02462", city: "Newton Lower Falls" },
  { zip: "02464", city: "Newton Upper Falls" },
  { zip: "02465", city: "West Newton" },
  { zip: "02466", city: "Auburndale" },
  { zip: "02467", city: "Chestnut Hill" },
  { zip: "02468", city: "Waban" },
  { zip: "02481", city: "Wellesley Hills" },
  { zip: "02482", city: "Wellesley" },
  { zip: "02492", city: "Needham" },
  { zip: "02494", city: "Needham Heights" },
];

const SUFFOLK_COUNTY_ZIPS = [
  { zip: "02108", city: "Boston" },
  { zip: "02109", city: "Boston" },
  { zip: "02110", city: "Boston" },
  { zip: "02111", city: "Boston" },
  { zip: "02113", city: "Boston" },
  { zip: "02114", city: "Boston" },
  { zip: "02115", city: "Boston" },
  { zip: "02116", city: "Boston" },
  { zip: "02117", city: "Boston" },
  { zip: "02118", city: "Boston" },
  { zip: "02119", city: "Roxbury" },
  { zip: "02120", city: "Roxbury Crossing" },
  { zip: "02121", city: "Dorchester" },
  { zip: "02122", city: "Dorchester" },
  { zip: "02124", city: "Dorchester" },
  { zip: "02125", city: "Dorchester" },
  { zip: "02126", city: "Mattapan" },
  { zip: "02127", city: "South Boston" },
  { zip: "02128", city: "East Boston" },
  { zip: "02129", city: "Charlestown" },
  { zip: "02130", city: "Jamaica Plain" },
  { zip: "02131", city: "Roslindale" },
  { zip: "02132", city: "West Roxbury" },
  { zip: "02133", city: "Boston" },
  { zip: "02134", city: "Allston" },
  { zip: "02135", city: "Brighton" },
  { zip: "02136", city: "Hyde Park" },
  { zip: "02137", city: "Readville" },
  { zip: "02150", city: "Chelsea" },
  { zip: "02151", city: "Revere" },
  { zip: "02152", city: "Winthrop" },
  { zip: "02163", city: "Boston" },
  { zip: "02199", city: "Boston" },
  { zip: "02201", city: "Boston" },
  { zip: "02203", city: "Boston" },
  { zip: "02204", city: "Boston" },
  { zip: "02205", city: "Boston" },
  { zip: "02206", city: "Boston" },
  { zip: "02210", city: "Boston" },
  { zip: "02211", city: "Boston" },
  { zip: "02212", city: "Boston" },
  { zip: "02215", city: "Boston" },
  { zip: "02217", city: "Boston" },
  { zip: "02222", city: "Boston" },
  { zip: "02228", city: "East Boston" },
  { zip: "02241", city: "Boston" },
  { zip: "02266", city: "Boston" },
  { zip: "02283", city: "Boston" },
  { zip: "02284", city: "Boston" },
  { zip: "02293", city: "Boston" },
  { zip: "02297", city: "Boston" },
  { zip: "02298", city: "Boston" },
];

const PLYMOUTH_COUNTY_ZIPS = [
  { zip: "02018", city: "Accord" },
  { zip: "02020", city: "Brant Rock" },
  { zip: "02040", city: "Green Harbor" },
  { zip: "02041", city: "Green Harbor" },
  { zip: "02044", city: "Hingham" },
  { zip: "02048", city: "Mansfield" },
  { zip: "02050", city: "Marshfield" },
  { zip: "02051", city: "Marshfield Hills" },
  { zip: "02055", city: "Minot" },
  { zip: "02059", city: "North Pembroke" },
  { zip: "02060", city: "North Scituate" },
  { zip: "02061", city: "Norwell" },
  { zip: "02065", city: "Ocean Bluff" },
  { zip: "02066", city: "Scituate" },
  { zip: "02330", city: "Carver" },
  { zip: "02331", city: "Duxbury" },
  { zip: "02332", city: "Duxbury" },
  { zip: "02333", city: "East Bridgewater" },
  { zip: "02337", city: "Elmwood" },
  { zip: "02338", city: "Halifax" },
  { zip: "02339", city: "Hanover" },
  { zip: "02340", city: "Hanover" },
  { zip: "02341", city: "Hanson" },
  { zip: "02343", city: "Holbrook" },
  { zip: "02344", city: "Middleborough" },
  { zip: "02345", city: "Manomet" },
  { zip: "02346", city: "Middleborough" },
  { zip: "02347", city: "Lakeville" },
  { zip: "02349", city: "Middleborough" },
  { zip: "02350", city: "Monponsett" },
  { zip: "02351", city: "Abington" },
  { zip: "02355", city: "North Carver" },
  { zip: "02356", city: "North Easton" },
  { zip: "02357", city: "North Easton" },
  { zip: "02358", city: "North Pembroke" },
  { zip: "02359", city: "Pembroke" },
  { zip: "02360", city: "Plymouth" },
  { zip: "02361", city: "Plymouth" },
  { zip: "02362", city: "Plymouth" },
  { zip: "02364", city: "Kingston" },
  { zip: "02366", city: "South Carver" },
  { zip: "02367", city: "Plympton" },
  { zip: "02368", city: "Randolph" },
  { zip: "02370", city: "Rockland" },
  { zip: "02375", city: "South Easton" },
  { zip: "02379", city: "West Bridgewater" },
  { zip: "02381", city: "White Horse Beach" },
  { zip: "02382", city: "Whitman" },
];

export async function seedServiceAreaZipcodes() {
  console.log('Seeding service area zip codes...');
  
  const allZips = [
    ...NORFOLK_COUNTY_ZIPS.map(z => ({ ...z, county: "Norfolk" })),
    ...SUFFOLK_COUNTY_ZIPS.map(z => ({ ...z, county: "Suffolk" })),
    ...PLYMOUTH_COUNTY_ZIPS.map(z => ({ ...z, county: "Plymouth" })),
  ];

  let inserted = 0;
  let skipped = 0;

  for (const zipData of allZips) {
    try {
      await db.insert(serviceAreaZipcodes).values({
        zipCode: zipData.zip,
        city: zipData.city,
        county: zipData.county,
        state: "MA",
        isActive: true,
      }).onConflictDoNothing();
      inserted++;
    } catch (err: any) {
      if (err.code === '23505') {
        skipped++;
      } else {
        console.error(`Failed to insert zip ${zipData.zip}:`, err.message);
      }
    }
  }

  console.log(`Service area zip codes seeded: ${inserted} inserted, ${skipped} skipped (already exist)`);
  console.log(`Total coverage: ${allZips.length} zip codes across Norfolk, Suffolk, and Plymouth counties`);
}

// Export the raw data for reference
export const SERVICE_AREA_DATA = {
  norfolk: NORFOLK_COUNTY_ZIPS,
  suffolk: SUFFOLK_COUNTY_ZIPS,
  plymouth: PLYMOUTH_COUNTY_ZIPS,
};
