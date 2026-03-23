# Contributing to Agent Harness

Thank you for your interest in contributing! 

## Development Setup

```bash
git clone https://github.com/yourusername/agent-harness.git
cd agent-harness
npm install
node test-structure.mjs  # Verify setup
```

## Code Style

- **ESM only** - Use `import/export`, not `require`
- **Minimal dependencies** - Think hard before adding new packages
- **Readable code** - Clarity over cleverness
- **Async/await** - Use modern async patterns
- **Error handling** - Always handle errors gracefully

## Architecture Principles

1. **Keep the core loop simple** - Maximum 100 lines for the main agentic loop
2. **Provider abstraction** - All LLMs should expose the same interface
3. **Tool composition** - Tools should be independent and composable
4. **Safety first** - Security and budget constraints are first-class concerns
5. **Documentation** - If it's not documented, it doesn't exist

## Adding a New Tool

1. Create `src/tools/yourtool.mjs`
2. Export an object with schema and execute function
3. Register in `src/tools/index.mjs`
4. Add tests
5. Document in README

Example:

```javascript
export const yourTools = {
  tool_name: {
    schema: {
      name: 'tool_name',
      description: 'What this tool does',
      parameters: {
        type: 'object',
        properties: {
          param: { type: 'string', description: 'Parameter description' }
        },
        required: ['param']
      }
    },
    async execute(args, context) {
      // Your implementation
      return { success: true, result: 'done' };
    }
  }
};
```

## Adding a New Provider

1. Create `src/providers/yourprovider.mjs`
2. Implement the standard interface:
   ```javascript
   async complete(systemPrompt, messages, tools) {
     // Call your API
     return {
       content: 'response text',
       toolCalls: [...],
       stopReason: 'end_turn',
       usage: { inputTokens: 100, outputTokens: 50 }
     };
   }
   ```
3. Register in `src/providers/index.mjs`
4. Update README

## Testing

Before submitting:

```bash
# Structural tests
node test-structure.mjs

# Real API test (requires key)
export ANTHROPIC_API_KEY=...
node bin/agent.mjs run "list files in context directory"
```

## Pull Request Process

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit with clear messages
6. Push to your fork
7. Open a Pull Request

## Questions?

Open an issue! We're happy to help.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
