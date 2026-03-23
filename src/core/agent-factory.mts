/**
 * Agent factory - creates configured agents using pi-agent-core
 */
import { Agent } from "@mariozechner/pi-agent-core";
import { streamSimple, type Model } from "@mariozechner/pi-ai";
import type { AgentTool } from "@mariozechner/pi-agent-core";
import { ContextLoader } from "./context.mjs";

export interface AgentConfig {
	name: string;
	description: string;
	model: Model<any>;
	tools: AgentTool<any>[];
	contextDir: string;
	thinkingLevel?: "off" | "minimal" | "low" | "medium" | "high";
}

export class AgentFactory {
	/**
	 * Create an agent from configuration
	 */
	static async create(config: AgentConfig): Promise<Agent> {
		// Load context files
		const contextLoader = new ContextLoader(config.contextDir);
		const context = await contextLoader.load();

		// Create agent with Pi agent-core
		const agent = new Agent({
			initialState: {
				systemPrompt: context.systemPrompt,
				model: config.model,
				tools: config.tools,
				thinkingLevel: config.thinkingLevel || "off",
				messages: [],
				isStreaming: false,
				streamMessage: null,
				pendingToolCalls: new Set(),
			},
			streamFn: streamSimple,
		});

		return agent;
	}

	/**
	 * Create an agent with custom stream function
	 */
	static async createWithStream(
		config: AgentConfig,
		streamFn: typeof streamSimple
	): Promise<Agent> {
		const contextLoader = new ContextLoader(config.contextDir);
		const context = await contextLoader.load();

		const agent = new Agent({
			initialState: {
				systemPrompt: context.systemPrompt,
				model: config.model,
				tools: config.tools,
				thinkingLevel: config.thinkingLevel || "off",
				messages: [],
				isStreaming: false,
				streamMessage: null,
				pendingToolCalls: new Set(),
			},
			streamFn,
		});

		return agent;
	}
}
