/**
 * Shell tool - sandboxed command execution
 */
import { Type } from "@sinclair/typebox";
import type { AgentTool } from "@mariozechner/pi-agent-core";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export function createShellTool(workspaceDir: string): AgentTool {
	const params = Type.Object({
		command: Type.String({ description: "Shell command to execute" }),
		timeout: Type.Optional(
			Type.Number({ description: "Timeout in seconds (default: 30)" })
		),
	});

	return {
		name: "shell",
		label: "Execute Shell Command",
		description:
			"Execute a shell command in the workspace directory. Returns stdout and stderr, truncated to last 2000 lines or 50KB.",
		parameters: params,
		execute: async (toolCallId, args, signal) => {
			try {
				const timeoutMs = (args.timeout || 30) * 1000;

				const { stdout, stderr } = await execAsync(args.command, {
					cwd: workspaceDir,
					timeout: timeoutMs,
					maxBuffer: 50 * 1024, // 50KB
					signal,
				});

				// Combine stdout and stderr
				let output = "";
				if (stdout) output += `STDOUT:\n${stdout}\n`;
				if (stderr) output += `STDERR:\n${stderr}`;

				// Truncate to last 2000 lines
				const lines = output.split("\n");
				if (lines.length > 2000) {
					output =
						`... (truncated ${lines.length - 2000} lines) ...\n` +
						lines.slice(-2000).join("\n");
				}

				return {
					content: [{ type: "text", text: output || "(no output)" }],
					details: {
						command: args.command,
						exitCode: 0,
					},
				};
			} catch (error: any) {
				// Handle execution errors
				let errorText = `Error executing command: ${error.message}`;

				if (error.stdout || error.stderr) {
					let output = "";
					if (error.stdout) output += `STDOUT:\n${error.stdout}\n`;
					if (error.stderr) output += `STDERR:\n${error.stderr}`;
					errorText = output || errorText;
				}

				return {
					content: [{ type: "text", text: errorText }],
					details: {
						command: args.command,
						exitCode: error.code || 1,
						error: error.message,
					},
				};
			}
		},
	};
}
