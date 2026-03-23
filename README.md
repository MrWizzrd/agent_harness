# Agent Harness v2

Production-ready autonomous agent platform for work automation. Built on the [Pi runtime](https://github.com/badlogic/pi-mono) with work-environment integrations and quality controls.

## Features

- 🤖 **Pre-configured agents** for Jira, Slack, GitHub workflows
- 🔧 **Extensible tool system** with TypeBox schemas
- 📅 **Cron scheduler** for autonomous operation
- 💾 **File-based memory** with grep search
- 📊 **Activity logging** (JSONL) for dashboards
- 🎨 **Terminal UI** with Pi TUI components
- 🔒 **Sandboxed execution** with allowlist/blocklist
- ✅ **Comprehensive tests** with Node.js test runner

## Quick Start

### Installation

```bash
npm install
```

### Configuration

1. Copy `.env.example` to `.env` and fill in your API credentials:

```bash
cp .env.example .env
```

2. Edit `config.yaml` to configure your agents:

```yaml
model:
  provider: "anthropic"
  id: "claude-sonnet-4-5"

agents:
  jira-watcher:
    enabled: true
    schedule: "5m"  # Run every 5 minutes
```

### Running

```bash
# Start all enabled agents
npm start

# Run a specific agent once
npx tsx bin/harness.mts run jira-watcher

# Show agent status
npx tsx bin/harness.mts status
```

## Architecture

```
┌─────────────────────────────────────────┐
│ CLI / Dashboard (bin/, src/tui/)       │
├────────────────────┬────────────────────┤
│ Agent Definitions  │ Tool Registry      │
│ (src/agents/)      │ (src/tools/)       │
├────────────────────┴────────────────────┤
│ Core                                     │
│ Context, Memory, Scheduler, Activity    │
├─────────────────────────────────────────┤
│ Pi Agent Core                           │
│ Agent loop, tool execution, events      │
├─────────────────────────────────────────┤
│ Pi AI                                    │
│ Multi-provider LLM streaming            │
└─────────────────────────────────────────┘
```

## Core Concepts

### Agents

Agents are autonomous workers that run on schedules. Each agent has:

- **SOUL.md** - Agent identity and behavior instructions
- **TOOLS.md** - Tool-specific guidance (optional)
- **MEMORY.md** - Long-term memory (optional)
- **Schedule** - Cron expression or "webhook"
- **Tools** - Subset of available tools

Pre-configured agents:

| Agent | Purpose | Tools |
|-------|---------|-------|
| `jira-watcher` | Monitor Jira, pick up tickets | Jira API |
| `slack-reader` | Read channels, answer questions | Slack API |
| `git-monitor` | Watch PRs, review code | GitHub API |
| `doc-keeper` | Update docs when code changes | Filesystem |
| `standup-writer` | Generate daily standup | Memory, Jira, GitHub |
| `priority-engine` | Analyze inputs, recommend priorities | All tools |

### Tools

Tools use TypeBox schemas for type-safe parameter definitions:

```typescript
import { Type } from "@sinclair/typebox";
import type { AgentTool } from "@mariozechner/pi-agent-core";

const params = Type.Object({
  city: Type.String({ description: "City name" }),
});

const tool: AgentTool<typeof params> = {
  name: "get_weather",
  label: "Weather",
  description: "Get current weather for a city",
  parameters: params,
  execute: async (toolCallId, params, signal, onUpdate) => {
    return {
      content: [{ type: "text", text: `Weather for ${params.city}` }],
      details: { city: params.city },
    };
  },
};
```

**Built-in tools:**

| Category | Tools |
|----------|-------|
| **Jira** | `jira_search`, `jira_get_ticket`, `jira_create_ticket`, `jira_update_ticket`, `jira_add_comment`, `jira_transition` |
| **Slack** | `slack_read_channel`, `slack_post_message`, `slack_search`, `slack_get_thread` |
| **GitHub** | `github_list_prs`, `github_get_pr`, `github_create_review`, `github_list_commits`, `github_get_ci_status` |
| **Filesystem** | `read`, `write`, `edit`, `list`, `glob`, `grep` |
| **Shell** | `shell` (sandboxed command execution) |
| **HTTP** | `http_request` (generic HTTP) |
| **Memory** | `save_memory`, `search_memory`, `read_daily_notes` |

### Memory

File-based memory system with two layers:

1. **Daily notes** (`memory/YYYY-MM-DD.md`) - Raw chronological logs
2. **Grep search** - Fast search across all notes

```typescript
import { Memory } from "./src/core/memory.mjs";

const memory = new Memory("./memory");

// Save to today's note
await memory.save("Important decision: use TypeBox for schemas");

// Search across all notes
const results = await memory.search("TypeBox", 10);
```

### Activity Log

Every agent action writes to `data/activity.jsonl`:

```json
{"timestamp":"2026-03-23T15:30:00Z","agent":"jira-watcher","action":"Picked up TKT-445","status":"success","tokens":1200,"duration":4500}
```

This feeds both TUI and web dashboards.

### Scheduler

Manages multiple agents with cron schedules:

```typescript
import { Scheduler } from "./src/core/scheduler.mjs";

const scheduler = new Scheduler();

scheduler.register("jira-watcher", agent, "5m");  // Every 5 minutes
scheduler.register("slack-reader", agent, "30m"); // Every 30 minutes
```

## Configuration Reference

### config.yaml

```yaml
# Model configuration
model:
  provider: "anthropic"  # or "openai", "google", "groq", etc.
  id: "claude-sonnet-4-5"

# API credentials (use environment variables)
credentials:
  jira:
    url: ${JIRA_URL}
    email: ${JIRA_EMAIL}
    token: ${JIRA_TOKEN}
  slack:
    token: ${SLACK_TOKEN}
  github:
    token: ${GITHUB_TOKEN}

# Agent configurations
agents:
  jira-watcher:
    enabled: true
    schedule: "5m"  # "30s", "5m", "1h", or "webhook"
    tools:
      - jira_search
      - jira_get_ticket
      - save_memory

# Workspace settings
workspace:
  dir: "."
  memory_dir: "./memory"

# Activity log
activity:
  log_path: "./data/activity.jsonl"
  max_entries: 10000

# Safety constraints
safety:
  max_tokens_per_run: 50000
  max_tool_calls_per_run: 20
  command_allowlist:
    - "ls"
    - "cat"
    - "grep"
  command_blocklist:
    - "rm"
    - "sudo"
```

## Creating Custom Agents

1. **Define agent behavior** in `agents/<name>/SOUL.md`:

```markdown
# My Custom Agent

You are a helpful agent that does X, Y, Z.

## Your Role
- Monitor for condition A
- Perform action B when triggered
- Report results to stakeholders

## Guidelines
- Be proactive
- Communicate clearly
```

2. **Create agent definition** in `src/agents/<name>.mts`:

```typescript
import type { AgentConfig } from "../core/agent-factory.mjs";

export function createMyAgent(config: MyAgentConfig): AgentConfig {
  return {
    name: config.name,
    description: "My custom agent",
    model: config.model,
    tools: [...config.tools],
    contextDir: path.join(config.projectRoot, "agents", "my-agent"),
    thinkingLevel: "off",
  };
}
```

3. **Register in CLI** (`bin/harness.mts`):

```typescript
if (agentName === "my-agent") {
  agentDefinition = createMyAgent({ ... });
}
```

4. **Add to config.yaml**:

```yaml
agents:
  my-agent:
    enabled: true
    schedule: "15m"
    tools:
      - read
      - write
      - http_request
```

## Development

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Lint

```bash
npx tsc --noEmit
```

## Testing

Tests use Node.js built-in test runner:

```bash
# Run all tests
npm test

# Run specific test file
node --test tests/core/memory.test.mts
```

Mock external APIs in tests:

```typescript
import { test } from "node:test";
import assert from "node:assert";

test("jira_search returns results", async () => {
  // Mock fetch
  global.fetch = async () => ({
    ok: true,
    json: async () => ({ issues: [] }),
  });

  // Test tool
  const result = await tool.execute("id", { jql: "test" });
  assert.strictEqual(result.details.total, 0);
});
```

## Deployment

### Systemd Service

Create `/etc/systemd/system/agent-harness.service`:

```ini
[Unit]
Description=Agent Harness v2
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/agent-harness-v2
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable agent-harness
sudo systemctl start agent-harness
sudo systemctl status agent-harness
```

### Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .

CMD ["npm", "start"]
```

```bash
docker build -t agent-harness-v2 .
docker run -d --env-file .env agent-harness-v2
```

## Troubleshooting

### Agent not running

Check config.yaml:
```yaml
agents:
  my-agent:
    enabled: true  # Must be true
```

### Tool not found

Ensure tool is registered in config.yaml and credentials are set:
```bash
export JIRA_TOKEN=your_token
```

### Permission errors

Check file permissions on workspace and memory directories:
```bash
chmod -R 755 ./memory ./data
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass: `npm test`
5. Run type check: `npm run build`
6. Submit a pull request

## License

MIT

## Credits

Built on [Pi runtime](https://github.com/badlogic/pi-mono) by @badlogicgames.

Inspired by [OpenClaw](https://github.com/openclaw/openclaw) and the AI agent patterns documented in [this guide](https://gist.github.com/dabit3/e97dbfe71298b1df4d36542aceb5f158).
