/**
 * File-based memory system
 * - Daily notes in YYYY-MM-DD.md format
 * - Grep-based search across history
 */
import * as fs from "fs/promises";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export class Memory {
	private memoryDir: string;

	constructor(memoryDir: string) {
		this.memoryDir = memoryDir;
	}

	/**
	 * Get today's daily note path
	 */
	private getTodayPath(): string {
		const today = new Date().toISOString().split("T")[0];
		return path.join(this.memoryDir, `${today}.md`);
	}

	/**
	 * Save a memory to today's daily note
	 */
	async save(content: string): Promise<void> {
		const filePath = this.getTodayPath();
		const timestamp = new Date().toISOString();
		const entry = `\n## ${timestamp}\n\n${content}\n`;

		await fs.mkdir(this.memoryDir, { recursive: true });
		await fs.appendFile(filePath, entry, "utf-8");
	}

	/**
	 * Read today's daily note
	 */
	async readToday(): Promise<string> {
		try {
			const filePath = this.getTodayPath();
			return await fs.readFile(filePath, "utf-8");
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === "ENOENT") {
				return "";
			}
			throw error;
		}
	}

	/**
	 * Read a specific date's note
	 */
	async read(date: string): Promise<string> {
		try {
			const filePath = path.join(this.memoryDir, `${date}.md`);
			return await fs.readFile(filePath, "utf-8");
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === "ENOENT") {
				return "";
			}
			throw error;
		}
	}

	/**
	 * Search memory using grep
	 */
	async search(query: string, limit: number = 10): Promise<SearchResult[]> {
		try {
			await fs.access(this.memoryDir);
		} catch {
			return [];
		}

		try {
			// Use grep to search all .md files
			const { stdout } = await execAsync(
				`grep -r -n -i "${query.replace(/"/g, '\\"')}" ${this.memoryDir} || true`
			);

			if (!stdout.trim()) {
				return [];
			}

			const results: SearchResult[] = [];
			const lines = stdout.trim().split("\n");

			for (const line of lines.slice(0, limit)) {
				const match = line.match(/^(.+):(\d+):(.+)$/);
				if (match) {
					const [, filePath, lineNum, content] = match;
					results.push({
						file: path.relative(this.memoryDir, filePath),
						line: parseInt(lineNum, 10),
						content: content.trim(),
					});
				}
			}

			return results;
		} catch (error) {
			console.error("Memory search failed:", error);
			return [];
		}
	}

	/**
	 * List all daily notes
	 */
	async list(): Promise<string[]> {
		try {
			const files = await fs.readdir(this.memoryDir);
			return files
				.filter((file) => file.endsWith(".md"))
				.map((file) => file.replace(".md", ""))
				.sort()
				.reverse();
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === "ENOENT") {
				return [];
			}
			throw error;
		}
	}
}

export interface SearchResult {
	file: string;
	line: number;
	content: string;
}
