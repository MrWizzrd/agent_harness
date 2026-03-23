/**
 * Agent Harness v2 - Main exports
 */

// Core modules
export { ActivityLog, type ActivityEntry } from "./core/activity-log.mjs";
export {
	Memory,
	type SearchResult,
} from "./core/memory.mjs";
export {
	ContextLoader,
	type AgentContext,
} from "./core/context.mjs";
export {
	AgentFactory,
	type AgentConfig,
} from "./core/agent-factory.mjs";
export {
	Scheduler,
	type ScheduledAgent,
} from "./core/scheduler.mjs";

// Tools
export {
	ToolRegistry,
	type ToolRegistryConfig,
} from "./tools/index.mjs";
export { createFilesystemTools } from "./tools/filesystem.mjs";
export { createShellTool } from "./tools/shell.mjs";
export { createHttpTool } from "./tools/http.mjs";
export { createMemoryTools } from "./tools/memory-tools.mjs";
export { createJiraTools } from "./tools/jira.mjs";
export { createSlackTools } from "./tools/slack.mjs";
export { createGitHubTools } from "./tools/github.mjs";

// Re-export Pi types for convenience
export type { Agent, AgentTool, AgentEvent } from "@mariozechner/pi-agent-core";
export type { Model } from "@mariozechner/pi-ai";
