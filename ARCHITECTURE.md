# Architecture Deep Dive

## The Agentic Loop

The core of Agent Harness is a clean, readable agentic loop in `src/core/loop.mjs`:

```
1. Load context (identity, tools, memories)
2. Send prompt to LLM with available tools
3. Receive response (text + tool calls)
4. Execute tool calls in parallel
5. Feed results back to LLM
6. Repeat until completion or token limit
```

### Why This Design?

- **Simplicity** - The entire loop is <100 lines
- **Transparency** - Every step is visible and debuggable
- **Safety** - Budget checks on every iteration
- **Flexibility** - Easy to extend or modify

## Provider Abstraction

All LLM providers implement a standard interface:

```javascript
async complete(systemPrompt, messages, tools) {
  // Call provider's API
  return {
    content: 'response text',          // Plain text response
    toolCalls: [                       // Structured tool calls
      { id, name, arguments }
    ],
    stopReason: 'end_turn',            // Why generation stopped
    usage: {                           // Token usage
      inputTokens: 1000,
      outputTokens: 500
    }
  };
}
```

This abstraction lets you swap providers without changing any other code.

### Supported Providers

- **Anthropic** - Claude 3.5/4 via Messages API
- **OpenAI** - GPT-4o, o1, o3 via Chat Completions
- **xAI** - Grok via OpenAI-compatible endpoint

Adding new providers is straightforward - just implement the interface.

## Tool System

Tools are composable, self-describing functions:

```javascript
{
  schema: {
    name: 'tool_name',
    description: 'What this tool does',
    parameters: {
      // JSON Schema for arguments
    }
  },
  async execute(args, context) {
    // Implementation
    return { success: true, ... };
  }
}
```

The tool registry automatically:
1. Discovers available tools based on config
2. Builds JSON schemas for the LLM
3. Routes tool calls to implementations
4. Handles errors gracefully

### Tool Categories

- **Filesystem** - Safe file operations with path validation
- **Shell** - Sandboxed command execution with blocklist
- **HTTP** - Generic API client for external services
- **Memory** - File-based storage and search
- **Sub-agents** - Isolated sub-tasks with budget limits

## Context Engineering

Agent identity and knowledge come from markdown files:

```
context/
├── SOUL.md      # Who the agent is
├── TOOLS.md     # What tools/APIs are available
└── MEMORY.md    # Long-term curated knowledge
```

On startup, the system:
1. Reads all .md files from `context/`
2. Loads recent daily memory notes
3. Assembles everything into a system prompt
4. Includes current date/time

This makes agent identity **version-controlled**, **reviewable**, and **portable**.

## Memory Architecture

Two-layer memory system:

### Layer 1: Daily Notes
- File: `memory/YYYY-MM-DD.md`
- Auto-created on first write each day
- Timestamped entries
- Chronological log of everything

### Layer 2: Curated Memory
- File: `context/MEMORY.md`
- Hand-curated important knowledge
- Lessons learned, preferences, key facts
- Part of system prompt

### Search
- Simple grep-based keyword search
- Searches last 30 days of daily notes
- Returns context: 2 lines before/after match
- No vector database needed

**Why no vector DB?**
- Simpler to deploy (no dependencies)
- Faster for small/medium datasets
- More transparent (can inspect files)
- Easier to version control
- "Good enough" for most use cases

## Safety System

### Budget Tracking
- Estimate costs per token (provider-specific rates)
- Track daily spend in `state.json`
- Enforce `max_cost_per_day` limit
- Prevent runaway costs

### Command Sandboxing
- Configurable blocklist of dangerous patterns
- Applied before execution, not after
- Includes common destructive commands by default
- Can be customized per agent

### Approval Gates
- Mark specific tools as requiring approval
- Future: webhook for human-in-the-loop
- Currently: logged for audit

### Token Limits
- `max_tokens_per_run` prevents infinite loops
- Checked on each iteration
- Separate limits for sub-agents

## Trigger Modes

### CLI (Interactive)
- Best for: Development, exploration, ad-hoc tasks
- Uses readline for input
- Real-time feedback
- No persistence between sessions

### Cron (Scheduled)
- Best for: Monitoring, recurring tasks, reports
- Uses node-cron for scheduling
- Runs in background
- Logs output

### Webhook (Server)
- Best for: Integration with other systems
- Express server with POST /run endpoint
- Returns JSON response
- Stateless (one request = one agent run)

## Data Flow

```
User Input
    ↓
Load Config
    ↓
Assemble Context (SOUL + TOOLS + MEMORY + recent notes)
    ↓
Create Provider (Anthropic/OpenAI/xAI)
    ↓
╔═══════════════════════════════════════╗
║         AGENTIC LOOP                  ║
║                                       ║
║  1. Call LLM with context + tools     ║
║           ↓                           ║
║  2. Parse response                    ║
║           ↓                           ║
║  3. Execute tool calls                ║
║           ↓                           ║
║  4. Check budgets                     ║
║           ↓                           ║
║  5. Return to step 1 (if tools called)║
║                                       ║
╚═══════════════════════════════════════╝
    ↓
Return Final Response
    ↓
Update State (costs, memories)
```

## Design Principles

1. **Simplicity over features** - Do one thing well
2. **Transparency over magic** - Code you can read and understand
3. **Files over databases** - When possible, use the filesystem
4. **Safety over convenience** - Make the secure path the easy path
5. **Composition over inheritance** - Mix and match capabilities

## Performance Characteristics

- **Startup time**: ~50ms (load config + context)
- **Memory footprint**: ~30MB base + LLM SDK
- **Disk usage**: Minimal (config + text files)
- **Network**: Only LLM API calls
- **Scalability**: Limited by LLM rate limits, not framework

## Extension Points

### Easy to Add
- New tools (just implement schema + execute)
- New providers (implement complete() interface)
- New trigger modes (follow CLI/cron/webhook pattern)
- Custom context files (just add .md files)

### Harder to Change
- Core loop structure (intentionally simple)
- Message format (tied to LLM APIs)
- Tool calling protocol (standardized)

## Security Considerations

### Threat Model
- **Malicious prompts** - Command injection via user input
- **Runaway costs** - Infinite loops or expensive operations
- **Data exfiltration** - Agent accessing/sending sensitive data
- **Resource exhaustion** - Filling disk, using all CPU

### Mitigations
- ✅ Command blocklist (prevents `rm -rf`, `sudo`, etc.)
- ✅ Budget limits (cost and token caps)
- ✅ Timeout on shell commands (30s default)
- ✅ Path validation (prevent directory traversal)
- ⚠️ Network isolation (not implemented - use firewall)
- ⚠️ Sandboxing (basic - consider Docker for production)

### Production Recommendations
- Run in Docker container
- Use restrictive filesystem permissions
- Set aggressive budget limits
- Monitor logs for suspicious activity
- Use approval gates for sensitive operations
- Regularly review memory files for leaked secrets

## Future Enhancements

Possible directions (PRs welcome!):

- [ ] Vector-based memory (optional plugin)
- [ ] Multi-agent coordination
- [ ] Web UI for management
- [ ] Approval webhook for human-in-loop
- [ ] Telemetry and observability
- [ ] Built-in testing framework
- [ ] Docker/Kubernetes deployment
- [ ] Streaming responses
- [ ] Cost optimization (caching, compression)
- [ ] More providers (Gemini, Claude API, local models)

## Comparison to Other Frameworks

| Feature | Agent Harness | LangChain | AutoGPT |
|---------|---------------|-----------|---------|
| **Complexity** | Low | High | High |
| **Dependencies** | 4 | 50+ | 100+ |
| **Core loop** | 100 lines | 1000+ | 5000+ |
| **Docs quality** | High | Medium | Low |
| **Customization** | Easy | Hard | Very hard |
| **Production-ready** | Yes | Maybe | No |

**When to use Agent Harness:**
- You want to understand how it works
- You need production reliability
- You prefer files over databases
- You want minimal dependencies

**When to use something else:**
- You need built-in RAG/vector search
- You want a visual UI builder
- You need 50+ pre-built integrations
- You prefer abstraction over control

---

**Agent Harness is optimized for clarity, safety, and production deployment.**

If you need to modify it, you'll understand how. If it breaks, you'll know why. If it works, you'll know how to extend it.

That's the goal.
