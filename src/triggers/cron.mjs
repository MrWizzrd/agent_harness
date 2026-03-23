import cron from 'node-cron';
import { runAgentLoop } from '../core/loop.mjs';
import { assembleContext } from '../core/context.mjs';

export async function runCron(provider, config) {
  const cronSchedule = config.trigger?.cron;
  
  if (!cronSchedule) {
    throw new Error('No cron schedule specified in config.trigger.cron');
  }

  if (!cron.validate(cronSchedule)) {
    throw new Error(`Invalid cron schedule: ${cronSchedule}`);
  }

  console.log(`🕐 Starting cron agent with schedule: ${cronSchedule}`);
  console.log('Press Ctrl+C to stop.\n');

  cron.schedule(cronSchedule, async () => {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] Running scheduled task...`);

    try {
      const systemPrompt = await assembleContext(config);
      
      const result = await runAgentLoop({
        provider,
        config,
        systemPrompt,
        initialMessage: 'Execute your scheduled task.',
        maxTurns: 30,
        onToolCall: (name, args) => {
          console.log(`  🔧 ${name}`);
        }
      });

      console.log(`  ✓ Complete (${result.totalTokens} tokens)`);
      if (result.finalResponse) {
        console.log(`  Response: ${result.finalResponse.slice(0, 200)}...`);
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
    }
  });

  // Keep process alive
  await new Promise(() => {});
}
