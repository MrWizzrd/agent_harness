/**
 * Cron scheduler for multiple agents
 * Manages scheduled agent runs based on cron expressions
 */
import type { Agent } from "@mariozechner/pi-agent-core";

export interface ScheduledAgent {
	name: string;
	agent: Agent;
	schedule: string; // cron expression or "webhook"
	lastRun?: Date;
	nextRun?: Date;
}

export class Scheduler {
	private agents: Map<string, ScheduledAgent> = new Map();
	private intervals: Map<string, NodeJS.Timeout> = new Map();

	/**
	 * Register an agent with schedule
	 */
	register(name: string, agent: Agent, schedule: string): void {
		this.agents.set(name, {
			name,
			agent,
			schedule,
		});

		if (schedule !== "webhook") {
			this.scheduleAgent(name, schedule);
		}
	}

	/**
	 * Unregister an agent
	 */
	unregister(name: string): void {
		const interval = this.intervals.get(name);
		if (interval) {
			clearInterval(interval);
			this.intervals.delete(name);
		}
		this.agents.delete(name);
	}

	/**
	 * Schedule an agent based on cron expression
	 * For simplicity, this implementation supports basic intervals
	 * In production, use a proper cron library like node-cron
	 */
	private scheduleAgent(name: string, schedule: string): void {
		// Parse simple schedule formats: "5m", "1h", "30s"
		const intervalMs = this.parseSchedule(schedule);

		if (intervalMs > 0) {
			const interval = setInterval(() => {
				this.runAgent(name);
			}, intervalMs);

			this.intervals.set(name, interval);
		}
	}

	/**
	 * Parse schedule string to milliseconds
	 * Supports: "30s", "5m", "1h"
	 */
	private parseSchedule(schedule: string): number {
		const match = schedule.match(/^(\d+)([smh])$/);
		if (!match) {
			console.warn(`Invalid schedule format: ${schedule}`);
			return 0;
		}

		const value = parseInt(match[1], 10);
		const unit = match[2];

		switch (unit) {
			case "s":
				return value * 1000;
			case "m":
				return value * 60 * 1000;
			case "h":
				return value * 60 * 60 * 1000;
			default:
				return 0;
		}
	}

	/**
	 * Run a specific agent
	 */
	async runAgent(name: string): Promise<void> {
		const scheduled = this.agents.get(name);
		if (!scheduled) {
			throw new Error(`Agent not found: ${name}`);
		}

		const { agent } = scheduled;

		// Update last run timestamp
		scheduled.lastRun = new Date();

		try {
			// Trigger agent (subclass should handle prompting)
			await agent.continue();
		} catch (error) {
			console.error(`Agent ${name} failed:`, error);
		}
	}

	/**
	 * Get all registered agents
	 */
	list(): ScheduledAgent[] {
		return Array.from(this.agents.values());
	}

	/**
	 * Get agent by name
	 */
	get(name: string): ScheduledAgent | undefined {
		return this.agents.get(name);
	}

	/**
	 * Stop all scheduled agents
	 */
	stop(): void {
		for (const interval of this.intervals.values()) {
			clearInterval(interval);
		}
		this.intervals.clear();
	}
}
