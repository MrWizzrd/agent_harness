import { getEnabledTools, executeTool } from '../tools/index.mjs';
import { saveMemory } from './memory.mjs';

export async function runAgentLoop({
  provider,
  config,
  systemPrompt,
  initialMessage,
  maxTurns = 50,
  onThinking = null,
  onToolCall = null,
  onResponse = null
}) {
  const messages = [];
  const tools = getEnabledTools(config);
  const toolSchemas = tools.map(t => ({
    name: t.name,
    description: t.description,
    parameters: t.parameters
  }));

  let totalTokens = { input: 0, output: 0 };
  let finalResponse = '';

  // Add initial message
  if (initialMessage) {
    messages.push({ role: 'user', content: initialMessage });
  }

  for (let turn = 0; turn < maxTurns; turn++) {
    // Check token budget
    if (config.safety?.max_tokens_per_run) {
      const total = totalTokens.input + totalTokens.output;
      if (total > config.safety.max_tokens_per_run) {
        throw new Error(`Token budget exceeded: ${total} > ${config.safety.max_tokens_per_run}`);
      }
    }

    // Call the model
    const response = await provider.complete(systemPrompt, messages, toolSchemas);
    
    totalTokens.input += response.usage.inputTokens;
    totalTokens.output += response.usage.outputTokens;

    // If there's text content, add it to messages
    if (response.content) {
      finalResponse = response.content;
      if (onResponse) {
        onResponse(response.content);
      }
    }

    // If no tool calls, we're done
    if (!response.toolCalls || response.toolCalls.length === 0) {
      if (response.content) {
        messages.push({ role: 'assistant', content: response.content });
      }
      break;
    }

    // Build assistant message with tool calls
    const assistantMessage = {
      role: 'assistant',
      content: response.content || '',
      toolCalls: response.toolCalls
    };
    messages.push(assistantMessage);

    // Execute tool calls
    const toolResults = [];
    for (const toolCall of response.toolCalls) {
      if (onToolCall) {
        onToolCall(toolCall.name, toolCall.arguments);
      }

      try {
        const result = await executeTool(
          toolCall.name,
          toolCall.arguments,
          tools,
          { provider, config }
        );
        toolResults.push({
          toolCallId: toolCall.id,
          name: toolCall.name,
          result
        });
      } catch (error) {
        toolResults.push({
          toolCallId: toolCall.id,
          name: toolCall.name,
          result: { success: false, error: error.message }
        });
      }
    }

    // Add tool results to messages
    const toolMessage = {
      role: 'user',
      content: JSON.stringify(toolResults, null, 2)
    };
    messages.push(toolMessage);
  }

  return {
    finalResponse,
    totalTokens: totalTokens.input + totalTokens.output,
    messages
  };
}
