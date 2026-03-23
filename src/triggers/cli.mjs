import readline from 'readline';
import { runAgentLoop } from '../core/loop.mjs';
import { assembleContext } from '../core/context.mjs';

export async function runCLI(provider, config) {
  const systemPrompt = await assembleContext(config);
  
  console.log('🤖 Agent Harness CLI');
  console.log('Type your message and press Enter. Type "exit" to quit.\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();
    
    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
      console.log('Goodbye!');
      rl.close();
      process.exit(0);
    }

    if (!input) {
      rl.prompt();
      return;
    }

    try {
      console.log('');
      const result = await runAgentLoop({
        provider,
        config,
        systemPrompt,
        initialMessage: input,
        maxTurns: 50,
        onToolCall: (name, args) => {
          console.log(`🔧 Tool: ${name}(${JSON.stringify(args).slice(0, 100)}...)`);
        },
        onResponse: (content) => {
          console.log(`\n${content}\n`);
        }
      });

      console.log(`\n💭 Tokens used: ${result.totalTokens}`);
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }

    console.log('');
    rl.prompt();
  });

  rl.on('close', () => {
    console.log('Goodbye!');
    process.exit(0);
  });
}
