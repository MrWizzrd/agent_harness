/**
 * Context loader - reads SOUL.md, TOOLS.md, MEMORY.md
 * Assembles system prompt from context files
 */
import * as fs from "fs/promises";
import * as path from "path";

export interface AgentContext {
	soul: string;
	tools: string;
	memory: string;
	systemPrompt: string;
}

export class ContextLoader {
	private contextDir: string;

	constructor(contextDir: string) {
		this.contextDir = contextDir;
	}

	/**
	 * Load agent context files
	 */
	async load(): Promise<AgentContext> {
		const soul = await this.readFile("SOUL.md");
		const tools = await this.readFile("TOOLS.md");
		const memory = await this.readFile("MEMORY.md");

		// Assemble system prompt from context files
		const systemPrompt = this.assembleSystemPrompt(soul, tools, memory);

		return { soul, tools, memory, systemPrompt };
	}

	/**
	 * Read a context file, return empty string if not found
	 */
	private async readFile(filename: string): Promise<string> {
		try {
			const filePath = path.join(this.contextDir, filename);
			return await fs.readFile(filePath, "utf-8");
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === "ENOENT") {
				return "";
			}
			throw error;
		}
	}

	/**
	 * Assemble system prompt from context files
	 */
	private assembleSystemPrompt(
		soul: string,
		tools: string,
		memory: string
	): string {
		const parts: string[] = [];

		if (soul) {
			parts.push("# Agent Identity\n\n" + soul);
		}

		if (tools) {
			parts.push("# Available Tools\n\n" + tools);
		}

		if (memory) {
			parts.push("# Memory\n\n" + memory);
		}

		return parts.join("\n\n---\n\n");
	}

	/**
	 * Save context files
	 */
	async save(context: Partial<AgentContext>): Promise<void> {
		await fs.mkdir(this.contextDir, { recursive: true });

		if (context.soul !== undefined) {
			await fs.writeFile(
				path.join(this.contextDir, "SOUL.md"),
				context.soul,
				"utf-8"
			);
		}

		if (context.tools !== undefined) {
			await fs.writeFile(
				path.join(this.contextDir, "TOOLS.md"),
				context.tools,
				"utf-8"
			);
		}

		if (context.memory !== undefined) {
			await fs.writeFile(
				path.join(this.contextDir, "MEMORY.md"),
				context.memory,
				"utf-8"
			);
		}
	}
}
