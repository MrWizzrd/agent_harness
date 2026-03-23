import { filesystemTools } from './filesystem.mjs';
import { shellTools } from './shell.mjs';
import { httpTools } from './http.mjs';
import { subagentTools } from './subagent.mjs';
import { memoryTools } from '../core/memory.mjs';

export function getEnabledTools(config) {
  const tools = [];
  const toolContext = { config };

  // Filesystem tools
  if (config.tools?.filesystem) {
    Object.values(filesystemTools).forEach(tool => {
      tools.push({
        ...tool.schema,
        execute: (args) => tool.execute(args, toolContext)
      });
    });
  }

  // Shell tools
  if (config.tools?.shell) {
    Object.values(shellTools).forEach(tool => {
      tools.push({
        ...tool.schema,
        execute: (args) => tool.execute(args, toolContext)
      });
    });
  }

  // HTTP tools
  if (config.tools?.http) {
    Object.values(httpTools).forEach(tool => {
      tools.push({
        ...tool.schema,
        execute: (args) => tool.execute(args, toolContext)
      });
    });
  }

  // Subagent tools
  if (config.tools?.subagent) {
    Object.values(subagentTools).forEach(tool => {
      tools.push({
        ...tool.schema,
        execute: (args, context) => tool.execute(args, { ...toolContext, ...context })
      });
    });
  }

  // Memory tools (always enabled)
  Object.values(memoryTools).forEach(tool => {
    tools.push({
      ...tool.schema,
      execute: (args) => tool.execute(args, toolContext)
    });
  });

  return tools;
}

export function executeTool(toolName, args, tools, additionalContext = {}) {
  const tool = tools.find(t => t.name === toolName);
  if (!tool) {
    throw new Error(`Tool not found: ${toolName}`);
  }
  return tool.execute(args, additionalContext);
}
