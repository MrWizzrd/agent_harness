/**
 * Memory tools - save_memory, search_memory, read_daily_notes
 */
import { Type } from "@sinclair/typebox";
import type { AgentTool } from "@mariozechner/pi-agent-core";
import type { Memory } from "../core/memory.mjs";

export function createMemoryTools(memory: Memory): AgentTool<any>[] {
	return [
		createSaveMemoryTool(memory),
		createSearchMemoryTool(memory),
		createReadDailyNotesTool(memory),
	];
}

function createSaveMemoryTool(memory: Memory): AgentTool {
	const params = Type.Object({
		content: Type.String({ description: "Content to save to memory" }),
	});

	return {
		name: "save_memory",
		label: "Save Memory",
		description:
			"Save important information to today's daily note for future reference",
		parameters: params,
		execute: async (toolCallId, args) => {
			try {
				await memory.save(args.content);

				return {
					content: [
						{
							type: "text",
							text: `Saved to memory: ${args.content.slice(0, 100)}${args.content.length > 100 ? "..." : ""}`,
						},
					],
					details: { saved: true },
				};
			} catch (error: any) {
				return {
					content: [
						{
							type: "text",
							text: `Failed to save memory: ${error.message}`,
						},
					],
					details: { error: error.message },
				};
			}
		},
	};
}

function createSearchMemoryTool(memory: Memory): AgentTool {
	const params = Type.Object({
		query: Type.String({ description: "Search query" }),
		limit: Type.Optional(
			Type.Number({ description: "Maximum results (default: 10)" })
		),
	});

	return {
		name: "search_memory",
		label: "Search Memory",
		description: "Search across all daily notes using grep",
		parameters: params,
		execute: async (toolCallId, args) => {
			try {
				const results = await memory.search(args.query, args.limit || 10);

				if (results.length === 0) {
					return {
						content: [
							{
								type: "text",
								text: `No results found for: ${args.query}`,
							},
						],
						details: { results: 0 },
					};
				}

				const formatted = results
					.map((r) => `${r.file}:${r.line} - ${r.content}`)
					.join("\n");

				return {
					content: [
						{
							type: "text",
							text: `Found ${results.length} results:\n\n${formatted}`,
						},
					],
					details: { results: results.length },
				};
			} catch (error: any) {
				return {
					content: [
						{
							type: "text",
							text: `Memory search failed: ${error.message}`,
						},
					],
					details: { error: error.message },
				};
			}
		},
	};
}

function createReadDailyNotesTool(memory: Memory): AgentTool {
	const params = Type.Object({
		date: Type.Optional(
			Type.String({
				description: "Date in YYYY-MM-DD format (default: today)",
			})
		),
	});

	return {
		name: "read_daily_notes",
		label: "Read Daily Notes",
		description: "Read a specific day's daily note",
		parameters: params,
		execute: async (toolCallId, args) => {
			try {
				const content = args.date
					? await memory.read(args.date)
					: await memory.readToday();

				if (!content) {
					return {
						content: [
							{
								type: "text",
								text: `No notes found for ${args.date || "today"}`,
							},
						],
						details: { empty: true },
					};
				}

				return {
					content: [{ type: "text", text: content }],
					details: { date: args.date, length: content.length },
				};
			} catch (error: any) {
				return {
					content: [
						{
							type: "text",
							text: `Failed to read daily notes: ${error.message}`,
						},
					],
					details: { error: error.message },
				};
			}
		},
	};
}
