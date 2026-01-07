// Seed runner for database initialization
import { seedServiceAreaZipcodes } from './serviceAreaZipcodes';
import { seedPromotions } from './promotions';

async function runAllSeeds() {
  console.log('=== Starting database seeds ===\n');
  
  try {
    await seedServiceAreaZipcodes();
    await seedPromotions();
    console.log('\n=== All seeds completed successfully ===');
  } catch (error) {
    console.error('\n=== Seed error ===');
    console.error(error);
    process.exit(1);
  }
  
  process.exit(0);
}

runAllSeeds();
