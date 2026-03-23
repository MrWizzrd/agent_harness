#!/usr/bin/env node

// Verification script - tests structure without API calls

import { loadConfig, getDefaultConfig } from './src/config.mjs';
import { getEnabledTools } from './src/tools/index.mjs';
import { assembleContext } from './src/core/context.mjs';

console.log('🧪 Testing Agent Harness Structure...\n');

try {
  // Test 1: Config loading
  console.log('✓ Config module loads');
  const defaultConfig = getDefaultConfig();
  console.log('✓ Default config generated');
  console.log(`  Provider: ${defaultConfig.provider}`);
  console.log(`  Model: ${defaultConfig.model}`);

  // Test 2: Tool registry
  const tools = getEnabledTools(defaultConfig);
  console.log(`\n✓ Tool registry works (${tools.length} tools available)`);
  tools.forEach(t => console.log(`  - ${t.name}`));

  // Test 3: Context assembly
  const context = await assembleContext(defaultConfig);
  console.log(`\n✓ Context assembly works (${context.length} chars)`);
  
  // Test 4: Provider imports
  const { createProvider } = await import('./src/providers/index.mjs');
  console.log('\n✓ Provider factory loads');

  console.log('\n✅ All structural tests passed!');
  console.log('\nTo run with a real API:');
  console.log('  export ANTHROPIC_API_KEY=sk-ant-...');
  console.log('  node bin/agent.mjs run "list files in context directory"');

} catch (error) {
  console.error('\n❌ Test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
