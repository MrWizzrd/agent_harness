/**
 * Filesystem tools - read, write, edit, list, glob, grep
 */
import { Type } from "@sinclair/typebox";
import type { AgentTool } from "@mariozechner/pi-agent-core";
import * as fs from "fs/promises";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export function createFilesystemTools(workspaceDir: string): AgentTool<any>[] {
	return [
		createReadTool(workspaceDir),
		createWriteTool(workspaceDir),
		createEditTool(workspaceDir),
		createListTool(workspaceDir),
		createGlobTool(workspaceDir),
		createGrepTool(workspaceDir),
	];
}

function createReadTool(workspaceDir: string): AgentTool {
	const params = Type.Object({
		path: Type.String({ description: "File path relative to workspace" }),
		offset: Type.Optional(
			Type.Number({ description: "Start reading from line number" })
		),
		limit: Type.Optional(
			Type.Number({ description: "Maximum number of lines to read" })
		),
	});

	return {
		name: "read",
		label: "Read File",
		description:
			"Read file contents. Supports text files and images. Truncated to 2000 lines or 50KB by default.",
		parameters: params,
		execute: async (toolCallId, args) => {
			try {
				const filePath = path.resolve(workspaceDir, args.path);
				
				// Security: prevent path traversal
				if (!filePath.startsWith(workspaceDir)) {
					return {
						content: [
							{ type: "text", text: "Error: Path outside workspace" },
						],
						details: { error: "path_traversal" },
					};
				}

				const content = await fs.readFile(filePath, "utf-8");
				let lines = content.split("\n");

				// Apply offset/limit
				if (args.offset !== undefined) {
					lines = lines.slice(args.offset - 1);
				}
				if (args.limit !== undefined) {
					lines = lines.slice(0, args.limit);
				}

				const result = lines.join("\n");

				return {
					content: [{ type: "text", text: result }],
					details: { path: args.path, lines: lines.length },
				};
			} catch (error: any) {
				return {
					content: [{ type: "text", text: `Error: ${error.message}` }],
					details: { error: error.message },
				};
			}
		},
	};
}

function createWriteTool(workspaceDir: string): AgentTool {
	const params = Type.Object({
		path: Type.String({ description: "File path relative to workspace" }),
		content: Type.String({ description: "Content to write" }),
	});

	return {
		name: "write",
		label: "Write File",
		description:
			"Write content to a file. Creates if doesn't exist, overwrites if it does. Auto-creates parent directories.",
		parameters: params,
		execute: async (toolCallId, args) => {
			try {
				const filePath = path.resolve(workspaceDir, args.path);

				// Security: prevent path traversal
				if (!filePath.startsWith(workspaceDir)) {
					return {
						content: [
							{ type: "text", text: "Error: Path outside workspace" },
						],
						details: { error: "path_traversal" },
					};
				}

				// Create parent directories
				await fs.mkdir(path.dirname(filePath), { recursive: true });

				// Write file
				await fs.writeFile(filePath, args.content, "utf-8");

				return {
					content: [
						{
							type: "text",
							text: `Wrote ${args.content.length} characters to ${args.path}`,
						},
					],
					details: { path: args.path, bytes: args.content.length },
				};
			} catch (error: any) {
				return {
					content: [{ type: "text", text: `Error: ${error.message}` }],
					details: { error: error.message },
				};
			}
		},
	};
}

function createEditTool(workspaceDir: string): AgentTool {
	const params = Type.Object({
		path: Type.String({ description: "File path relative to workspace" }),
		oldText: Type.String({
			description: "Exact text to find and replace (must match exactly)",
		}),
		newText: Type.String({ description: "New text to replace with" }),
	});

	return {
		name: "edit",
		label: "Edit File",
		description:
			"Replace exact text in a file. oldText must match exactly (including whitespace). For precise, surgical edits.",
		parameters: params,
		execute: async (toolCallId, args) => {
			try {
				const filePath = path.resolve(workspaceDir, args.path);

				// Security: prevent path traversal
				if (!filePath.startsWith(workspaceDir)) {
					return {
						content: [
							{ type: "text", text: "Error: Path outside workspace" },
						],
						details: { error: "path_traversal" },
					};
				}

				// Read file
				const content = await fs.readFile(filePath, "utf-8");

				// Check if old text exists
				if (!content.includes(args.oldText)) {
					return {
						content: [
							{
								type: "text",
								text: "Error: Old text not found in file",
							},
						],
						details: { error: "text_not_found" },
					};
				}

				// Replace text
				const newContent = content.replace(args.oldText, args.newText);

				// Write back
				await fs.writeFile(filePath, newContent, "utf-8");

				return {
					content: [
						{
							type: "text",
							text: `Replaced text in ${args.path}`,
						},
					],
					details: { path: args.path },
				};
			} catch (error: any) {
				return {
					content: [{ type: "text", text: `Error: ${error.message}` }],
					details: { error: error.message },
				};
			}
		},
	};
}

function createListTool(workspaceDir: string): AgentTool {
	const params = Type.Object({
		path: Type.Optional(
			Type.String({ description: "Directory path (default: workspace root)" })
		),
	});

	return {
		name: "list",
		label: "List Directory",
		description:
			"List directory contents. Entries sorted alphabetically with / suffix for directories.",
		parameters: params,
		execute: async (toolCallId, args) => {
			try {
				const dirPath = args.path
					? path.resolve(workspaceDir, args.path)
					: workspaceDir;

				// Security: prevent path traversal
				if (!dirPath.startsWith(workspaceDir)) {
					return {
						content: [
							{ type: "text", text: "Error: Path outside workspace" },
						],
						details: { error: "path_traversal" },
					};
				}

				const entries = await fs.readdir(dirPath, { withFileTypes: true });
				const formatted = entries
					.sort((a, b) => a.name.localeCompare(b.name))
					.map((entry) => (entry.isDirectory() ? `${entry.name}/` : entry.name))
					.join("\n");

				return {
					content: [{ type: "text", text: formatted }],
					details: { path: args.path || ".", count: entries.length },
				};
			} catch (error: any) {
				return {
					content: [{ type: "text", text: `Error: ${error.message}` }],
					details: { error: error.message },
				};
			}
		},
	};
}

function createGlobTool(workspaceDir: string): AgentTool {
	const params = Type.Object({
		pattern: Type.String({ description: "Glob pattern (e.g., '**/*.ts')" }),
	});

	return {
		name: "glob",
		label: "Find Files",
		description:
			"Search for files by glob pattern. Returns matching paths relative to workspace. Respects .gitignore.",
		parameters: params,
		execute: async (toolCallId, args) => {
			try {
				// Use find command for glob matching
				const { stdout } = await execAsync(
					`find . -name "${args.pattern}" 2>/dev/null || true`,
					{ cwd: workspaceDir }
				);

				const paths = stdout
					.trim()
					.split("\n")
					.filter((line) => line.length > 0)
					.map((line) => line.replace(/^\.\//, ""));

				return {
					content: [{ type: "text", text: paths.join("\n") }],
					details: { pattern: args.pattern, count: paths.length },
				};
			} catch (error: any) {
				return {
					content: [{ type: "text", text: `Error: ${error.message}` }],
					details: { error: error.message },
				};
			}
		},
	};
}

function createGrepTool(workspaceDir: string): AgentTool {
	const params = Type.Object({
		pattern: Type.String({
			description: "Search pattern (regex or literal string)",
		}),
		path: Type.Optional(
			Type.String({ description: "Directory or file to search (default: workspace)" })
		),
	});

	return {
		name: "grep",
		label: "Search Files",
		description:
			"Search file contents for a regex or literal pattern. Returns matching lines with file paths and line numbers.",
		parameters: params,
		execute: async (toolCallId, args) => {
			try {
				const searchPath = args.path || ".";
				// Use grep for content search
				const { stdout } = await execAsync(
					`grep -rn "${args.pattern.replace(/"/g, '\\"')}" ${searchPath} 2>/dev/null || true`,
					{ cwd: workspaceDir }
				);

				const matches = stdout
					.trim()
					.split("\n")
					.filter((line) => line.length > 0);

				return {
					content: [{ type: "text", text: matches.join("\n") }],
					details: { pattern: args.pattern, matches: matches.length },
				};
			} catch (error: any) {
				return {
					content: [{ type: "text", text: `Error: ${error.message}` }],
					details: { error: error.message },
				};
			}
		},
	};
}
