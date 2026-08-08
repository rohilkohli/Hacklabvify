// src/services/ai/GeminiProvider.js
// Concrete Gemini implementation of BaseAIProvider.
// Only this file knows about Gemini API specifics.

import { BaseAIProvider } from './BaseAIProvider.js';
import { AI_CONFIG, getProviderConfig } from '../../config/ai.js';
import { Logger } from '../LoggerService.js';

const CONTEXT = 'GeminiProvider';

export class GeminiProvider extends BaseAIProvider {
  constructor(apiKey) {
    super(getProviderConfig('gemini'));
    this._apiKey = apiKey || '';
  }

  isAvailable() {
    return this.validateApiKey(this._apiKey);
  }

  validateApiKey(key) {
    return typeof key === 'string' && key.trim().length > 20 && key.startsWith('AIza');
  }

  /**
   * Builds the Gemini REST endpoint URL.
   */
  _buildUrl(model) {
    const m = model || this.config.models.default;
    return `${this.config.baseUrl}/${m}:generateContent?key=${this._apiKey}`;
  }

  /**
   * Converts the universal message format to Gemini's `contents` array.
   */
  _buildContents(messages) {
    return messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));
  }

  async chat({ systemPrompt, messages, model, generationConfig = {} }) {
    const url = this._buildUrl(model);

    const body = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: this._buildContents(messages),
      generationConfig: {
        maxOutputTokens: this.config.maxTokens || 8192,
        temperature: this.config.defaultTemperature,
        topP: this.config.defaultTopP,
        ...generationConfig,
      },
    };

    const { maxAttempts, backoffBase, retryableStatuses } = AI_CONFIG.retry;

    let lastError;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (attempt > 0) {
        const wait = backoffBase * Math.pow(2, attempt - 1);
        Logger.debug(`Retry attempt ${attempt} after ${wait}ms`, null, CONTEXT);
        await new Promise((r) => setTimeout(r, wait));
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), AI_CONFIG.timeoutMs);

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const data = await res.json();

        if (!res.ok) {
          const message = data?.error?.message || `API error (${res.status})`;
          const isRetryable = retryableStatuses.includes(res.status);
          Logger.warn(`Gemini API error: ${message}`, { status: res.status }, CONTEXT);
          lastError = { message, status: res.status, retryable: isRetryable };
          if (!isRetryable) break;
          continue;
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trimEnd();
        if (!text) {
          lastError = { message: 'Empty response from model.', status: 200, retryable: false };
          break;
        }

        Logger.debug(`Response received (${text.length} chars)`, null, CONTEXT);
        return text;

      } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          lastError = { message: 'Request timed out after 30 seconds.', status: 0, retryable: true };
        } else {
          lastError = { message: err.message || 'Network error.', status: 0, retryable: true };
        }
        Logger.warn(`Network error on attempt ${attempt}`, err, CONTEXT);
      }
    }

    Logger.error('Gemini request failed after all retries.', lastError, CONTEXT);
    throw new AIProviderError(lastError.message, lastError.status, this.id);
  }
}

/**
 * Normalized error class for all AI provider failures.
 */
export class AIProviderError extends Error {
  constructor(message, status, providerId) {
    super(message);
    this.name = 'AIProviderError';
    this.status = status;
    this.providerId = providerId;
  }
}
