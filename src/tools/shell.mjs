import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const shellTools = {
  execute: {
    schema: {
      name: 'execute',
      description: 'Execute a shell command (subject to safety constraints)',
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'Shell command to execute'
          },
          cwd: {
            type: 'string',
            description: 'Working directory (optional)'
          }
        },
        required: ['command']
      }
    },
    async execute({ command, cwd }, { config }) {
      // Check blocked commands
      const blocked = config.safety?.blocked_commands || [];
      for (const pattern of blocked) {
        if (command.includes(pattern)) {
          return {
            success: false,
            error: `Command blocked by safety constraint: contains "${pattern}"`
          };
        }
      }

      try {
        const { stdout, stderr } = await execAsync(command, {
          cwd: cwd || process.cwd(),
          timeout: 30000, // 30 second timeout
          maxBuffer: 1024 * 1024 // 1MB max output
        });
        return {
          success: true,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          stdout: error.stdout?.trim(),
          stderr: error.stderr?.trim()
        };
      }
    }
  }
};
