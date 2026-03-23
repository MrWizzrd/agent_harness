import express from 'express';
import { runAgentLoop } from '../core/loop.mjs';
import { assembleContext } from '../core/context.mjs';

export async function runWebhook(provider, config) {
  const port = config.trigger?.webhook_port || 3000;
  const app = express();

  app.use(express.json());

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Main webhook endpoint
  app.post('/run', async (req, res) => {
    const { message, task } = req.body;

    if (!message && !task) {
      return res.status(400).json({
        error: 'Missing required field: message or task'
      });
    }

    try {
      const systemPrompt = await assembleContext(config);
      
      const result = await runAgentLoop({
        provider,
        config,
        systemPrompt,
        initialMessage: message || task,
        maxTurns: 30
      });

      res.json({
        success: true,
        response: result.finalResponse,
        tokensUsed: result.totalTokens
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  app.listen(port, () => {
    console.log(`🌐 Webhook server listening on http://localhost:${port}`);
    console.log(`   POST /run with { "message": "your task here" }`);
    console.log(`   GET  /health for status check`);
    console.log('\nPress Ctrl+C to stop.\n');
  });

  // Keep process alive
  await new Promise(() => {});
}
