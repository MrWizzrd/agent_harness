import fs from 'fs/promises';
import YAML from 'yaml';

export async function loadConfig(configPath = './config.yaml') {
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    const config = YAML.parse(content);
    
    // Interpolate environment variables
    const interpolated = JSON.parse(
      JSON.stringify(config).replace(
        /\$\{([^}]+)\}/g,
        (_, key) => process.env[key] || ''
      )
    );
    
    return interpolated;
  } catch (error) {
    throw new Error(`Failed to load config from ${configPath}: ${error.message}`);
  }
}

export function getDefaultConfig() {
  return {
    provider: 'anthropic',
    model: 'claude-sonnet-4-5-20250514',
    context_dir: './context',
    memory_dir: './memory',
    tools: {
      filesystem: true,
      shell: false,
      http: false,
      subagent: false
    },
    safety: {
      max_tokens_per_run: 100000,
      max_cost_per_day: 10.0,
      blocked_commands: ['rm -rf', 'sudo', 'shutdown'],
      require_approval: []
    },
    trigger: {
      mode: 'cli'
    }
  };
}
