import { runAgentLoop } from '../core/loop.mjs';

export const subagentTools = {
  spawn_subagent: {
    schema: {
      name: 'spawn_subagent',
      description: 'Spawn a sub-agent to handle a specific isolated task',
      parameters: {
        type: 'object',
        properties: {
          task: {
            type: 'string',
            description: 'The specific task for the sub-agent to complete'
          },
          context: {
            type: 'string',
            description: 'Additional context for the sub-agent (optional)'
          }
        },
        required: ['task']
      }
    },
    async execute({ task, context }, { config, provider }) {
      try {
        // Create isolated context for sub-agent
        const subagentPrompt = `You are a focused sub-agent. Your ONLY task is:

${task}

${context ? `Additional context:\n${context}` : ''}

Complete this task efficiently and return the result. Do not deviate from the task.`;

        // Run sub-agent with limited scope (no shell, no subagent spawning)
        const subagentConfig = {
          ...config,
          tools: {
            filesystem: config.tools?.filesystem || false,
            http: config.tools?.http || false,
            shell: false,
            subagent: false
          },
          safety: {
            ...config.safety,
            max_tokens_per_run: 20000 // Limit sub-agent token usage
          }
        };

        const result = await runAgentLoop({
          provider,
          config: subagentConfig,
          systemPrompt: subagentPrompt,
          initialMessage: task,
          maxTurns: 10
        });

        return {
          success: true,
          result: result.finalResponse,
          tokensUsed: result.totalTokens
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }
  }
};
