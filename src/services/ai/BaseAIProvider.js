// src/services/ai/BaseAIProvider.js
// Abstract interface that every AI provider must implement.
// This contract ensures that swapping Gemini for OpenAI requires
// only creating a new adapter — no UI or feature code changes.

export class BaseAIProvider {
  constructor(config) {
    if (new.target === BaseAIProvider) {
      throw new Error('BaseAIProvider is abstract — instantiate a concrete provider like GeminiProvider.');
    }
    this.config = config;
    this.id = config.id;
    this.name = config.name;
  }

  /**
   * Sends a chat request to the AI model.
   *
   * @param {object} params
   * @param {string} params.systemPrompt - The system instruction.
   * @param {Array<{role: 'user'|'assistant', content: string}>} params.messages - Conversation history.
   * @param {string} [params.model] - Model override.
   * @param {object} [params.generationConfig] - Temperature, maxTokens, etc.
   * @returns {Promise<string>} The AI response text.
   */
  // eslint-disable-next-line no-unused-vars
  async chat({ systemPrompt, messages, model, generationConfig }) {
    throw new Error(`${this.constructor.name} must implement chat()`);
  }

  /**
   * Returns true if this provider is configured and ready.
   * @returns {boolean}
   */
  isAvailable() {
    throw new Error(`${this.constructor.name} must implement isAvailable()`);
  }

  /**
   * Returns the default model name for this provider.
   * @returns {string}
   */
  getDefaultModel() {
    return this.config.models?.default || 'unknown';
  }

  /**
   * Validates that an API key exists and looks structurally correct.
   * Override in concrete providers for provider-specific validation.
   * @param {string} key
   * @returns {boolean}
   */
  // eslint-disable-next-line no-unused-vars
  validateApiKey(key) {
    return typeof key === 'string' && key.trim().length > 10;
  }
}
