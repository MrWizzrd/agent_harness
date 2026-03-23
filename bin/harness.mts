#!/usr/bin/env tsx
/**
 * Agent Harness v2 CLI
 */
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";
import { parse as parseYaml } from "yaml";
import { getModel } from "@mariozechner/pi-ai";
import { Memory } from "../src/core/memory.mjs";
import { ActivityLog } from "../src/core/activity-log.mjs";
import { Scheduler } from "../src/core/scheduler.mjs";
import { AgentFactory } from "../src/core/agent-factory.mjs";
import { ToolRegistry } from "../src/tools/index.mjs";
import { createJiraWatcherAgent } from "../src/agents/jira-watcher.mjs";
import chalk from "chalk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

// Parse CLI arguments
const args = process.argv.slice(2);
const command = args[0];

async function loadConfig() {
	const configPath = path.join(PROJECT_ROOT, "config.yaml");
	try {
		const configContent = await fs.readFile(configPath, "utf-8");
		
		// Replace environment variables
		const interpolated = configContent.replace(/\$\{(\w+)\}/g, (_, envVar) => {
			return process.env[envVar] || "";
		});

		return parseYaml(interpolated);
	} catch (error: any) {
		console.error(chalk.red("Failed to load config.yaml:"), error.message);
		process.exit(1);
	}
}

async function startCommand() {
	console.log(chalk.bold.cyan("🚀 Agent Harness v2 - Starting...\n"));

	const config = await loadConfig();

	// Initialize memory
	const memory = new Memory(path.join(PROJECT_ROOT, config.workspace.memory_dir));

	// Initialize activity log
	const activityLog = new ActivityLog(config.activity.log_path);

	// Initialize tool registry
	const toolRegistry = new ToolRegistry({
		jiraUrl: config.credentials.jira?.url,
		jiraEmail: config.credentials.jira?.email,
		jiraToken: config.credentials.jira?.token,
		slackToken: config.credentials.slack?.token,
		githubToken: config.credentials.github?.token,
		workspaceDir: path.resolve(PROJECT_ROOT, config.workspace.dir),
		memory,
	});

	// Initialize scheduler
	const scheduler = new Scheduler();

	// Get model
	const model = getModel(config.model.provider, config.model.id);

	// Register agents
	for (const [agentName, agentConfig] of Object.entries(config.agents)) {
		const agentConf = agentConfig as any;
		
		if (!agentConf.enabled) {
			console.log(chalk.dim(`⏸️  ${agentName}: disabled`));
			continue;
		}

		// Get tools for this agent
		const tools = toolRegistry.getByNames(agentConf.tools);

		// Create agent based on name
		let agentDefinition;
		if (agentName === "jira-watcher") {
			agentDefinition = createJiraWatcherAgent({
				name: agentName,
				model,
				jiraTools: toolRegistry.getByNames([
					"jira_search",
					"jira_get_ticket",
					"jira_create_ticket",
					"jira_update_ticket",
					"jira_add_comment",
					"jira_transition",
				]),
				memoryTools: toolRegistry.getByNames(["save_memory", "search_memory"]),
				projectRoot: PROJECT_ROOT,
			});
		} else {
			console.log(chalk.yellow(`⚠️  ${agentName}: not implemented yet`));
			continue;
		}

		// Create agent instance
		const agent = await AgentFactory.create(agentDefinition);

		// Subscribe to events
		agent.subscribe((event) => {
			if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
				process.stdout.write(event.assistantMessageEvent.delta);
			}
			if (event.type === "tool_execution_start") {
				console.log(chalk.dim(`\n[${event.toolName}]`));
			}
			if (event.type === "agent_end") {
				console.log("\n");
			}
		});

		// Register with scheduler
		scheduler.register(agentName, agent, agentConf.schedule);

		console.log(
			chalk.green(`✅ ${agentName}: scheduled (${agentConf.schedule})`)
		);
	}

	console.log(chalk.bold.green("\n✨ All agents started!\n"));

	// Keep process alive
	process.on("SIGINT", () => {
		console.log(chalk.yellow("\n\n👋 Shutting down..."));
		scheduler.stop();
		process.exit(0);
	});
}

async function statusCommand() {
	console.log(chalk.bold.cyan("📊 Agent Status\n"));

	const config = await loadConfig();

	for (const [agentName, agentConfig] of Object.entries(config.agents)) {
		const agentConf = agentConfig as any;
		const status = agentConf.enabled
			? chalk.green("✅ enabled")
			: chalk.dim("⏸️  disabled");
		const schedule = agentConf.enabled ? chalk.dim(`(${agentConf.schedule})`) : "";
		console.log(`${agentName}: ${status} ${schedule}`);
	}

	console.log();
}

async function runCommand(agentName: string) {
	if (!agentName) {
		console.error(chalk.red("Error: Agent name required"));
		console.log(chalk.dim("Usage: harness run <agent-name>"));
		process.exit(1);
	}

	console.log(chalk.bold.cyan(`🏃 Running ${agentName}...\n`));

	const config = await loadConfig();
	const agentConf = config.agents[agentName];

	if (!agentConf) {
		console.error(chalk.red(`Error: Agent '${agentName}' not found`));
		process.exit(1);
	}

	// Initialize memory
	const memory = new Memory(path.join(PROJECT_ROOT, config.workspace.memory_dir));

	// Initialize tool registry
	const toolRegistry = new ToolRegistry({
		jiraUrl: config.credentials.jira?.url,
		jiraEmail: config.credentials.jira?.email,
		jiraToken: config.credentials.jira?.token,
		slackToken: config.credentials.slack?.token,
		githubToken: config.credentials.github?.token,
		workspaceDir: path.resolve(PROJECT_ROOT, config.workspace.dir),
		memory,
	});

	// Get model
	const model = getModel(config.model.provider, config.model.id);

	// Create agent
	let agentDefinition;
	if (agentName === "jira-watcher") {
		agentDefinition = createJiraWatcherAgent({
			name: agentName,
			model,
			jiraTools: toolRegistry.getByNames([
				"jira_search",
				"jira_get_ticket",
				"jira_create_ticket",
				"jira_update_ticket",
				"jira_add_comment",
				"jira_transition",
			]),
			memoryTools: toolRegistry.getByNames(["save_memory", "search_memory"]),
			projectRoot: PROJECT_ROOT,
		});
	} else {
		console.error(chalk.red(`Error: Agent '${agentName}' not implemented yet`));
		process.exit(1);
	}

	const agent = await AgentFactory.create(agentDefinition);

	// Subscribe to events
	agent.subscribe((event) => {
		if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
			process.stdout.write(event.assistantMessageEvent.delta);
		}
		if (event.type === "tool_execution_start") {
			console.log(chalk.dim(`\n[${event.toolName}]`));
		}
	});

	// Run agent (trigger with empty prompt to use default behavior)
	await agent.prompt(
		"Check for new tickets assigned to you and update their status."
	);

	console.log(chalk.green("\n✅ Done!\n"));
}

function helpCommand() {
	console.log(chalk.bold.cyan("Agent Harness v2\n"));
	console.log("Usage: harness <command> [options]\n");
	console.log("Commands:");
	console.log("  start           Start all enabled agents on their schedules");
	console.log("  run <agent>     Run a specific agent once");
	console.log("  status          Show agent status");
	console.log("  dashboard       Show TUI dashboard (not implemented)");
	console.log("  test            Run tests (not implemented)");
	console.log("  --help          Show this help message\n");
}

// Main
async function main() {
	try {
		switch (command) {
			case "start":
				await startCommand();
				break;
			case "status":
				await statusCommand();
				break;
			case "run":
				await runCommand(args[1]);
				break;
			case "--help":
			case "-h":
			case "help":
				helpCommand();
				break;
			default:
				console.error(chalk.red(`Unknown command: ${command}\n`));
				helpCommand();
				process.exit(1);
		}
	} catch (error: any) {
		console.error(chalk.red("\n❌ Error:"), error.message);
		if (error.stack) {
			console.error(chalk.dim(error.stack));
		}
		process.exit(1);
	}
}

main();
