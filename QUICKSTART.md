# 🚀 Quick Start Guide

Get an autonomous AI agent running in **under 2 minutes**.

## Step 1: Clone & Install (30 seconds)

```bash
git clone https://github.com/yourusername/agent-harness.git
cd agent-harness
npm install
```

## Step 2: Set API Key (10 seconds)

Choose one provider and set its API key:

```bash
# Anthropic Claude (recommended)
export ANTHROPIC_API_KEY=sk-ant-your-key-here

# OR OpenAI GPT
export OPENAI_API_KEY=sk-your-key-here

# OR xAI Grok
export XAI_API_KEY=xai-your-key-here
```

## Step 3: Run Your First Task (10 seconds)

```bash
node bin/agent.mjs run "list the files in the context directory and tell me what each one is for"
```

**That's it!** 🎉

---

## What Just Happened?

The agent:
1. Loaded its identity from `context/SOUL.md`
2. Assembled a system prompt with available tools
3. Called the LLM with your task
4. Used the `list_dir` tool to see files
5. Used the `read_file` tool to read them
6. Summarized what it found

All automatically.

---

## Try More Examples

### Interactive Mode

```bash
node bin/agent.mjs cli
```

Then type commands:
- `What files are in this project?`
- `Create a file called test.txt with today's date`
- `Search memory for mentions of "agent"`
- `exit` (to quit)

### One-Shot Tasks

```bash
# Analyze code
node bin/agent.mjs run "read src/core/loop.mjs and explain how it works"

# Create files
node bin/agent.mjs run "create a TODO.md file with 3 example tasks"

# Research
node bin/agent.mjs run "what tools are available and when should I use each?"
```

### Memory System

```bash
# Save something
node bin/agent.mjs run "save to memory: the user prefers concise responses"

# Search memory
node bin/agent.mjs run "search memory for user preferences"
```

---

## Customize Your Agent

### 1. Edit `context/SOUL.md`

This defines who your agent is:

```markdown
# Agent Identity

You are a helpful coding assistant specializing in Python and JavaScript.

## Your Purpose
Help developers write clean, tested, production-ready code.
```

### 2. Edit `config.yaml`

Enable/disable tools and set safety limits:

```yaml
tools:
  filesystem: true
  shell: true      # ⚠️ Be careful!
  http: true
  subagent: true

safety:
  max_tokens_per_run: 100000
  max_cost_per_day: 5.00
  blocked_commands:
    - "rm -rf"
    - "sudo"
```

### 3. Add Knowledge to `context/MEMORY.md`

Add facts the agent should always know:

```markdown
## User Preferences
- Prefers Python over JavaScript
- Uses pytest for testing
- Code style: Black formatting

## Important Context
- Project structure: /src for code, /tests for tests
- CI runs on every commit
```

---

## Run as Scheduled Task

Edit `config.yaml`:

```yaml
trigger:
  mode: cron
  cron: "0 9 * * *"  # Every day at 9 AM
```

Then:

```bash
node bin/agent.mjs cron
# Runs in background, executing the agent's task daily
```

---

## Run as Webhook Server

Edit `config.yaml`:

```yaml
trigger:
  mode: webhook
  webhook_port: 3000
```

Then:

```bash
node bin/agent.mjs webhook
```

In another terminal:

```bash
curl -X POST http://localhost:3000/run \
  -H "Content-Type: application/json" \
  -d '{"message": "check the latest files in /tmp"}'
```

---

## Safety Tips

### Start Conservative

```yaml
tools:
  filesystem: true
  shell: false      # Disable until you trust it
  http: false
  subagent: false

safety:
  max_cost_per_day: 1.00  # Start with low budget
```

### Test in a Safe Directory

```bash
mkdir ~/agent-test
cd ~/agent-test
cp -r ~/agent-harness/context .
cp ~/agent-harness/config.yaml .
# Now run agent in this isolated directory
```

### Review Logs

The agent doesn't hide what it's doing. You'll see:
- Every tool call
- Every argument
- Every result

If something looks wrong, **Ctrl+C** to stop it.

---

## Common Issues

### "Error: 401 authentication error"

Your API key isn't set or is invalid.

```bash
# Make sure it's exported
echo $ANTHROPIC_API_KEY

# If empty, export it
export ANTHROPIC_API_KEY=sk-ant-...
```

### "Error: Tool not found"

That tool is disabled in `config.yaml`.

```yaml
tools:
  shell: true  # Enable the tool you need
```

### "Error: Daily budget exceeded"

You've hit your cost limit.

```yaml
safety:
  max_cost_per_day: 20.00  # Increase if needed
```

Or delete `state.json` to reset daily costs (do this carefully!).

---

## Next Steps

- **Read [README.md](README.md)** - Full documentation
- **Read [ARCHITECTURE.md](ARCHITECTURE.md)** - How it works
- **Try [examples/](examples/)** - Pre-built agent configs
- **Customize context/** - Make it yours

---

## Example Use Cases

### Code Review Agent

```bash
node bin/agent.mjs run "review the code in src/core/loop.mjs for bugs and improvements"
```

### Research Assistant

```bash
node bin/agent.mjs run "research autonomous agents and save key findings to memory"
```

### File Organizer

```bash
node bin/agent.mjs run "organize the files in this directory by creating logical subdirectories"
```

### Daily Standup

```yaml
# config.yaml
trigger:
  mode: cron
  cron: "0 9 * * 1-5"  # Weekdays at 9 AM
```

```markdown
# context/SOUL.md
Every morning, check:
1. Yesterday's memory notes
2. Any new files created
3. Summarize progress
4. Save summary to memory
```

---

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/agent-harness/issues)
- **Docs**: [README.md](README.md)
- **Examples**: [examples/](examples/)

---

**You're ready to build autonomous agents!** 🤖✨

Start simple, experiment, and scale up as you learn what works.
