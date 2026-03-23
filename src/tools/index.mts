/**
 * Tool registry - exports all available tools
 */
export * from "./jira.mjs";
export * from "./slack.mjs";
export * from "./github.mjs";
export * from "./filesystem.mjs";
export * from "./shell.mjs";
export * from "./http.mjs";
export * from "./memory-tools.mjs";

import type { AgentTool } from "@mariozechner/pi-agent-core";
import { createJiraTools } from "./jira.mjs";
import { createSlackTools } from "./slack.mjs";
import { createGitHubTools } from "./github.mjs";
import { createFilesystemTools } from "./filesystem.mjs";
import { createShellTool } from "./shell.mjs";
import { createHttpTool } from "./http.mjs";
import { createMemoryTools } from "./memory-tools.mjs";
import type { Memory } from "../core/memory.mjs";

export interface ToolRegistryConfig {
	jiraUrl?: string;
	jiraEmail?: string;
	jiraToken?: string;
	slackToken?: string;
	githubToken?: string;
	workspaceDir?: string;
	memory?: Memory;
}

export class ToolRegistry {
	private tools: Map<string, AgentTool<any>> = new Map();

	constructor(config: ToolRegistryConfig = {}) {
		this.registerTools(config);
	}

	private registerTools(config: ToolRegistryConfig): void {
		const workspaceDir = config.workspaceDir || process.cwd();

		// Register filesystem tools
		const filesystemTools = createFilesystemTools(workspaceDir);
		for (const tool of filesystemTools) {
			this.tools.set(tool.name, tool);
		}

		// Register shell tool
		const shellTool = createShellTool(workspaceDir);
		this.tools.set(shellTool.name, shellTool);

		// Register HTTP tool
		const httpTool = createHttpTool();
		this.tools.set(httpTool.name, httpTool);

		// Register memory tools if memory instance provided
		if (config.memory) {
			const memoryTools = createMemoryTools(config.memory);
			for (const tool of memoryTools) {
				this.tools.set(tool.name, tool);
			}
		}

		// Register Jira tools if credentials provided
		if (config.jiraUrl && config.jiraEmail && config.jiraToken) {
			const jiraTools = createJiraTools(
				config.jiraUrl,
				config.jiraEmail,
				config.jiraToken
			);
			for (const tool of jiraTools) {
				this.tools.set(tool.name, tool);
			}
		}

		// Register Slack tools if token provided
		if (config.slackToken) {
			const slackTools = createSlackTools(config.slackToken);
			for (const tool of slackTools) {
				this.tools.set(tool.name, tool);
			}
		}

		// Register GitHub tools if token provided
		if (config.githubToken) {
			const githubTools = createGitHubTools(config.githubToken);
			for (const tool of githubTools) {
				this.tools.set(tool.name, tool);
			}
		}
	}

	/**
	 * Get tool by name
	 */
	get(name: string): AgentTool<any> | undefined {
		return this.tools.get(name);
	}

	/**
	 * Get tools by names
	 */
	getByNames(names: string[]): AgentTool<any>[] {
		return names
			.map((name) => this.tools.get(name))
			.filter((tool): tool is AgentTool<any> => tool !== undefined);
	}

	/**
	 * Get all tools
	 */
	getAll(): AgentTool<any>[] {
		return Array.from(this.tools.values());
	}

	/**
	 * List tool names
	 */
	listNames(): string[] {
		return Array.from(this.tools.keys());
	}
}
