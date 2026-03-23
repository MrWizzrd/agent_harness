# 🤖 Agent Harness

**Production-ready autonomous AI agent framework with model-agnostic provider support.**

Build and deploy autonomous AI agents in minutes, not days. Agent Harness provides everything you need: multiple LLM providers, built-in tools, memory systems, safety constraints, and flexible trigger modes.

## ✨ Features

- 🔌 **Model-agnostic** - Anthropic Claude, OpenAI GPT, xAI Grok
- 🛠️ **Built-in tools** - Filesystem, shell, HTTP, sub-agent spawning
- 🧠 **Memory system** - Daily notes + keyword search (no vector DB needed)
- 📝 **Context engineering** - Markdown-based identity and knowledge files
- ⚡ **Multiple triggers** - CLI interactive, cron scheduled, webhook server
- 🔒 **Safety first** - Budget limits, command sandboxing, approval gates
- 🎯 **Minimal dependencies** - Clean, readable code you can actually understand

## 🚀 Quick Start (< 2 minutes)

```bash
# 1. Clone and install
git clone https://github.com/yourusername/agent-harness.git
cd agent-harness
npm install

# 2. Set your API key
export ANTHROPIC_API_KEY=sk-ant-...
# or: export OPENAI_API_KEY=sk-...
# or: export XAI_API_KEY=xai-...

# 3. Run your first task
node bin/agent.mjs run "list the files in this directory and summarize what this project does"
```

That's it! 🎉

## 📖 Usage

### Interactive CLI

```bash
node bin/agent.mjs cli
> What files are in this directory?
> Create a new file called notes.txt with today's date
> exit
```

### One-shot tasks

```bash
node bin/agent.mjs run "analyze the code in src/ and suggest improvements"
```

### Scheduled execution (cron)

```yaml
# config.yaml
trigger:
  mode: cron
  cron: "0 9 * * *"  # Every day at 9 AM
```

```bash
node bin/agent.mjs cron
```

### Webhook server

```yaml
# config.yaml
trigger:
  mode: webhook
  webhook_port: 3000
```

```bash
node bin/agent.mjs webhook

# In another terminal:
curl -X POST http://localhost:3000/run \
  -H "Content-Type: application/json" \
  -d '{"message": "check my inbox and summarize urgent emails"}'
```

## 🏗️ Architecture

```
agent-harness/
├── bin/agent.mjs           # CLI entry point
├── src/
│   ├── core/
│   │   ├── loop.mjs        # Agentic loop (think → act → observe)
│   │   ├── context.mjs     # Assemble system prompt from files
│   │   └── memory.mjs      # Daily notes + search
│   ├── providers/
│   │   ├── anthropic.mjs   # Claude integration
│   │   ├── openai.mjs      # GPT integration
│   │   └── xai.mjs         # Grok integration
│   ├── tools/
│   │   ├── filesystem.mjs  # read_file, write_file, edit_file, list_dir
│   │   ├── shell.mjs       # execute (sandboxed)
│   │   ├── http.mjs        # http_request
│   │   └── subagent.mjs    # spawn_subagent
│   ├── triggers/
│   │   ├── cli.mjs         # Interactive REPL
│   │   ├── cron.mjs        # Scheduled execution
│   │   └── webhook.mjs     # HTTP server
│   └── safety/
│       ├── constraints.mjs # Budget tracking
│       └── sandbox.mjs     # Command filtering
├── context/
│   ├── SOUL.md             # Agent identity & purpose
│   ├── TOOLS.md            # Available tools reference
│   └── MEMORY.md           # Long-term curated knowledge
├── memory/                 # Auto-generated daily notes
├── config.yaml             # Configuration
└── examples/               # Example agent configs
    ├── marketing-monitor/
    ├── code-reviewer/
    └── research-agent/
```

## ⚙️ Configuration

### config.yaml

```yaml
# Provider: anthropic, openai, or xai
provider: anthropic
model: claude-sonnet-4-5-20250514

# Context directories
context_dir: ./context
memory_dir: ./memory

# Enabled tools
tools:
  filesystem: true
  shell: true
  http: true
  subagent: true

# Safety constraints
safety:
  max_tokens_per_run: 100000      # Stop after this many tokens
  max_cost_per_day: 10.00         # Daily budget limit
  blocked_commands:               # Commands that will be rejected
    - "rm -rf"
    - "sudo"
    - "shutdown"
  require_approval: []            # Tools requiring manual approval
    # - send_email
    # - execute_trade

# Trigger mode
trigger:
  mode: cli                       # cli | cron | webhook
  # cron: "*/30 * * * *"          # Cron schedule
  # webhook_port: 3000            # Webhook server port
```

### Environment Variables

```bash
# API Keys (required)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
XAI_API_KEY=xai-...

# Optional
AGENT_CONFIG=./config.yaml      # Custom config path
DEBUG=true                      # Enable debug output
```

## 🧠 Context Engineering

Agent Harness uses markdown files to define agent identity and knowledge:

### context/SOUL.md

Define who your agent is, what it does, and how it behaves.

```markdown
# Agent Identity

You are a helpful research assistant.

## Your Purpose
...
```

### context/TOOLS.md

Document available APIs, accounts, and tool-specific notes.

```markdown
# Available Tools

## External APIs
- Weather API: https://api.weather.com (key: $WEATHER_KEY)
...
```

### context/MEMORY.md

Curated long-term knowledge, preferences, and lessons learned.

```markdown
# Long-Term Memory

## Lessons Learned
- Always verify file paths before editing
...
```

The agent automatically loads all .md files from `context/` on startup.

## 💾 Memory System

Agent Harness maintains two layers of memory:

1. **Daily notes** (`memory/YYYY-MM-DD.md`) - Auto-generated chronological logs
2. **Long-term memory** (`context/MEMORY.md`) - Curated knowledge

The agent can:
- `save_memory(content)` - Append to today's notes
- `search_memory(query)` - Grep-based keyword search across past notes

No vector database needed. Simple, fast, and transparent.

## 🔧 Available Tools

### Filesystem
- `read_file(path)` - Read file contents
- `write_file(path, content)` - Create or overwrite
- `edit_file(path, old_text, new_text)` - Precise edits
- `list_dir(path)` - List directory contents

### Shell
- `execute(command, cwd?)` - Run shell commands (sandboxed)

### HTTP
- `http_request(url, method, headers?, body?)` - Make API calls

### Memory
- `save_memory(content)` - Save to daily notes
- `search_memory(query)` - Search past notes

### Sub-agents
- `spawn_subagent(task, context?)` - Create isolated sub-agent for complex subtasks

## 🔒 Safety

### Command Blocklist

Prevent dangerous commands:

```yaml
safety:
  blocked_commands:
    - "rm -rf"
    - "sudo"
    - "shutdown"
```

### Budget Limits

Track costs and enforce daily limits:

```yaml
safety:
  max_tokens_per_run: 100000
  max_cost_per_day: 10.00
```

Costs are estimated and tracked in `state.json`.

### Approval Gates

Require manual approval for sensitive tools:

```yaml
safety:
  require_approval:
    - send_email
    - execute_trade
```

## 📚 Examples

### Marketing Monitor Agent

Runs twice daily (9 AM, 5 PM) to check metrics and alert on changes.

```bash
cd examples/marketing-monitor
export ANTHROPIC_API_KEY=...
node ../../bin/agent.mjs cron
```

### Code Review Agent

Webhook-triggered code reviewer for pull requests.

```bash
cd examples/code-reviewer
export OPENAI_API_KEY=...
node ../../bin/agent.mjs webhook

# Trigger via webhook
curl -X POST http://localhost:3000/run \
  -d '{"message": "Review the changes in src/api/users.js"}'
```

### Research Agent

Interactive research assistant with sub-agent support.

```bash
cd examples/research-agent
export ANTHROPIC_API_KEY=...
node ../../bin/agent.mjs cli
> Research the history of autonomous agents and write a summary
```

## 🛠️ Development

### Project Structure

- **100-line agentic loop** - Clean, readable core in `src/core/loop.mjs`
- **Normalized providers** - All LLMs expose the same interface
- **Composable tools** - Mix and match capabilities
- **ESM only** - Modern JavaScript, no transpilation needed

### Extending

#### Add a new tool

```javascript
// src/tools/custom.mjs
export const customTools = {
  my_tool: {
    schema: {
      name: 'my_tool',
      description: 'Does something useful',
      parameters: {
        type: 'object',
        properties: { /* ... */ },
        required: []
      }
    },
    async execute(args, context) {
      // Implementation
      return { success: true, result: 'done' };
    }
  }
};
```

#### Add a new provider

```javascript
// src/providers/custom.mjs
export class CustomProvider {
  async complete(systemPrompt, messages, tools) {
    // Call your API
    return {
      content: 'response text',
      toolCalls: [],
      stopReason: 'end_turn',
      usage: { inputTokens: 100, outputTokens: 50 }
    };
  }
}
```

## 🤝 Contributing

Contributions welcome! This project aims to stay:

- **Simple** - Minimal dependencies, readable code
- **Practical** - Real-world use cases over theoretical purity
- **Safe** - Security and safety as first-class concerns

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

Inspired by the autonomous agent patterns from:
- Anthropic's Claude
- OpenAI's function calling
- The broader agentic AI community

Built with ❤️ for developers who want to ship agents, not wrestle with frameworks.

---

**Get started in under 2 minutes. Build autonomous agents that actually work.**

```bash
git clone https://github.com/yourusername/agent-harness.git
cd agent-harness
npm install
export ANTHROPIC_API_KEY=sk-ant-...
node bin/agent.mjs run "your first task here"
```
# agent_harness
