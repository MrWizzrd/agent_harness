import Anthropic from '@anthropic-ai/sdk';

export class AnthropicProvider {
  constructor(apiKey, model = 'claude-sonnet-4-5-20250514') {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async complete(systemPrompt, messages, tools = []) {
    const anthropicTools = tools.map(t => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters
    }));

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: messages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      })),
      tools: anthropicTools.length > 0 ? anthropicTools : undefined
    });

    const toolCalls = response.content
      .filter(block => block.type === 'tool_use')
      .map(block => ({
        id: block.id,
        name: block.name,
        arguments: block.input
      }));

    const textContent = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    return {
      content: textContent,
      toolCalls,
      stopReason: response.stop_reason,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens
      }
    };
  }
}
