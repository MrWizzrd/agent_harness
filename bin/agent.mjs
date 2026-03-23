#!/usr/bin/env node

import { loadConfig, getDefaultConfig } from '../src/config.mjs';
import { createProvider } from '../src/providers/index.mjs';
import { runCLI } from '../src/triggers/cli.mjs';
import { runCron } from '../src/triggers/cron.mjs';
import { runWebhook } from '../src/triggers/webhook.mjs';
import { runAgentLoop } from '../src/core/loop.mjs';
import { assembleContext } from '../src/core/context.mjs';

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  try {
    // Load config
    const configPath = process.env.AGENT_CONFIG || './config.yaml';
    let config;
    try {
      config = await loadConfig(configPath);
    } catch (error) {
      console.warn(`⚠️  Could not load config from ${configPath}, using defaults`);
      config = getDefaultConfig();
    }

    // Create provider
    const provider = createProvider(config);

    // Handle commands
    if (command === 'run' && args[1]) {
      // One-shot run with a specific task
      const task = args.slice(1).join(' ');
      const systemPrompt = await assembleContext(config);
      
      console.log(`🤖 Running task: ${task}\n`);
      
      const result = await runAgentLoop({
        provider,
        config,
        systemPrompt,
        initialMessage: task,
        maxTurns: 50,
        onToolCall: (name, args) => {
          console.log(`🔧 ${name}`);
        },
        onResponse: (content) => {
          console.log(`\n${content}\n`);
        }
      });

      console.log(`\n✓ Complete (${result.totalTokens} tokens)\n`);
      process.exit(0);
    } else if (command === 'cli' || command === 'interactive' || !command) {
      // Interactive CLI mode
      await runCLI(provider, config);
    } else if (command === 'cron') {
      // Cron mode
      await runCron(provider, config);
    } else if (command === 'webhook' || command === 'server') {
      // Webhook server mode
      await runWebhook(provider, config);
    } else if (command === 'help' || command === '--help' || command === '-h') {
      showHelp();
    } else {
      console.error(`Unknown command: ${command}\n`);
      showHelp();
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🤖 Agent Harness - Autonomous AI Agent Framework

USAGE:
  agent-harness [command] [options]

COMMANDS:
  run <task>           Run a one-shot task
  cli                  Start interactive CLI mode (default)
  cron                 Run as scheduled cron job
  webhook              Start webhook server
  help                 Show this help message

EXAMPLES:
  agent-harness run "summarize the files in this directory"
  agent-harness cli
  agent-harness cron
  agent-harness webhook

ENVIRONMENT:
  AGENT_CONFIG         Path to config.yaml (default: ./config.yaml)
  ANTHROPIC_API_KEY    Anthropic API key
  OPENAI_API_KEY       OpenAI API key
  XAI_API_KEY          xAI API key
  DEBUG                Enable debug output

See README.md for full documentation.
`);
}

main();
