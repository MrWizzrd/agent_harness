import OpenAI from 'openai';

export class XAIProvider {
  constructor(apiKey, model = 'grok-beta') {
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.x.ai/v1'
    });
    this.model = model;
  }

  async complete(systemPrompt, messages, tools = []) {
    const openaiTools = tools.map(t => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters
      }
    }));

    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: chatMessages,
      tools: openaiTools.length > 0 ? openaiTools : undefined
    });

    const choice = response.choices[0];
    const toolCalls = choice.message.tool_calls?.map(tc => ({
      id: tc.id,
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments)
    })) || [];

    return {
      content: choice.message.content || '',
      toolCalls,
      stopReason: choice.finish_reason,
      usage: {
        inputTokens: response.usage.prompt_tokens,
        outputTokens: response.usage.completion_tokens
      }
    };
  }
}
