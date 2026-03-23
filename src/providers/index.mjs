import { AnthropicProvider } from './anthropic.mjs';
import { OpenAIProvider } from './openai.mjs';
import { XAIProvider } from './xai.mjs';

export function createProvider(config) {
  const provider = config.provider.toLowerCase();
  const model = config.model;

  switch (provider) {
    case 'anthropic':
      return new AnthropicProvider(
        process.env.ANTHROPIC_API_KEY,
        model
      );
    case 'openai':
      return new OpenAIProvider(
        process.env.OPENAI_API_KEY,
        model
      );
    case 'xai':
      return new XAIProvider(
        process.env.XAI_API_KEY,
        model
      );
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
