/**
 * Activity logger - writes JSONL log of agent actions
 * Used by both TUI and web dashboards
 */
import * as fs from "fs/promises";
import * as path from "path";

export interface ActivityEntry {
	timestamp: string;
	agent: string;
	action: string;
	status: "success" | "error" | "running";
	tokens?: number;
	duration?: number; // milliseconds
	error?: string;
}

export class ActivityLog {
	private logPath: string;

	constructor(logPath: string) {
		this.logPath = logPath;
	}

	async log(entry: ActivityEntry): Promise<void> {
		try {
			const logLine = JSON.stringify(entry) + "\n";
			await fs.appendFile(this.logPath, logLine, "utf-8");
		} catch (error) {
			console.error("Failed to write activity log:", error);
		}
	}

	async read(limit?: number): Promise<ActivityEntry[]> {
		try {
			const content = await fs.readFile(this.logPath, "utf-8");
			const lines = content
				.trim()
				.split("\n")
				.filter((line) => line.length > 0);

			const entries = lines.map((line) => JSON.parse(line) as ActivityEntry);

			if (limit && limit > 0) {
				return entries.slice(-limit);
			}

			return entries;
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === "ENOENT") {
				return [];
			}
			throw error;
		}
	}

	async clear(): Promise<void> {
		try {
			await fs.unlink(this.logPath);
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
				throw error;
			}
		}
	}
}
