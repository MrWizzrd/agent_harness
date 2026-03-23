/**
 * Jira Watcher Agent
 * Monitors Jira for new tickets, picks up assigned work, creates tickets
 */
import type { Model } from "@mariozechner/pi-ai";
import type { AgentTool } from "@mariozechner/pi-agent-core";
import type { AgentConfig } from "../core/agent-factory.mjs";
import * as path from "path";

export interface JiraWatcherConfig {
	name: string;
	model: Model<any>;
	jiraTools: AgentTool<any>[];
	memoryTools: AgentTool<any>[];
	projectRoot: string;
}

export function createJiraWatcherAgent(config: JiraWatcherConfig): AgentConfig {
	return {
		name: config.name,
		description:
			"Monitors Jira for assigned tickets, picks up new work, creates tickets when needed",
		model: config.model,
		tools: [...config.jiraTools, ...config.memoryTools],
		contextDir: path.join(config.projectRoot, "agents", "jira-watcher"),
		thinkingLevel: "off",
	};
}
