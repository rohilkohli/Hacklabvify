// src/services/ai/OpenAIProvider.js
// OpenAI adapter — production-ready stub.
// Activate by setting FEATURE_FLAGS.multiProvider = true and VITE_OPENAI_API_KEY.

import { BaseAIProvider } from './BaseAIProvider.js';
import { getProviderConfig } from '../../config/ai.js';
import { AIProviderError } from './GeminiProvider.js';

export class OpenAIProvider extends BaseAIProvider {
  constructor(apiKey) {
    super(getProviderConfig('openai'));
    this._apiKey = apiKey || '';
  }

  isAvailable() {
    return typeof this._apiKey === 'string' && this._apiKey.startsWith('sk-') && this._apiKey.length > 20;
  }

  validateApiKey(key) {
    return typeof key === 'string' && key.startsWith('sk-') && key.length > 20;
  }

  async chat({ systemPrompt, messages, model, generationConfig = {} }) {
    if (!this.isAvailable()) {
      throw new AIProviderError('OpenAI API key not configured.', 401, this.id);
    }

    const openAIMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    ];

    const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this._apiKey}`,
      },
      body: JSON.stringify({
        model: model || this.config.models.default,
        messages: openAIMessages,
        max_tokens: generationConfig.maxOutputTokens || this.config.maxTokens,
        temperature: generationConfig.temperature || this.config.defaultTemperature,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new AIProviderError(data?.error?.message || 'OpenAI error', res.status, this.id);

    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new AIProviderError('Empty response from OpenAI.', 200, this.id);

    return text;
  }
}
