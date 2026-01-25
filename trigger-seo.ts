
import { runFullSeoPipeline } from './server/lib/seo-agent/pipeline/orchestrator';
import { Logger } from './server/src/logger';

async function main() {
  try {
    Logger.info('Manual SEO Pipeline Trigger started');
    await runFullSeoPipeline();
    Logger.info('Manual SEO Pipeline Trigger completed');
    process.exit(0);
  } catch (error) {
    Logger.error('Manual SEO Pipeline Trigger failed', error);
    process.exit(1);
  }
}

main();
