// src/config/ai.js
// AI provider configuration. Changing model or provider requires only editing this file.

export const AI_CONFIG = {
  // Default provider — swappable without changing any UI code
  defaultProvider: 'gemini', // 'gemini' | 'openai' | 'anthropic' | 'local'

  providers: {
    gemini: {
      id: 'gemini',
      name: 'Google Gemini',
      models: {
        default: 'gemini-2.5-flash',
        pro: 'gemini-2.5-pro',
        fast: 'gemini-2.0-flash',
      },
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
      apiKeyEnvVar: 'VITE_GEMINI_API_KEY',
      maxTokens: 8192,
      defaultTemperature: 0.65,
      defaultTopP: 0.95,
    },
    openai: {
      id: 'openai',
      name: 'OpenAI',
      models: {
        default: 'gpt-4o',
        pro: 'gpt-4o',
        fast: 'gpt-4o-mini',
      },
      baseUrl: 'https://api.openai.com/v1',
      apiKeyEnvVar: 'VITE_OPENAI_API_KEY',
      maxTokens: 4096,
      defaultTemperature: 0.65,
      defaultTopP: 0.95,
    },
    anthropic: {
      id: 'anthropic',
      name: 'Anthropic Claude',
      models: {
        default: 'claude-sonnet-4-5',
        pro: 'claude-opus-4-5',
        fast: 'claude-haiku-3-5',
      },
      baseUrl: 'https://api.anthropic.com/v1',
      apiKeyEnvVar: 'VITE_ANTHROPIC_API_KEY',
      maxTokens: 4096,
      defaultTemperature: 0.65,
      defaultTopP: 0.95,
    },
  },

  // Retry policy for all providers
  retry: {
    maxAttempts: 3,
    backoffBase: 1000,      // 1s, 2s, 4s
    retryableStatuses: [429, 500, 503],
  },

  // Request timeout
  timeoutMs: 30_000,

  // Response pipeline
  pipeline: {
    parse: true,
    validate: true,
    format: true,
    cite: false,   // Future: citation engine
  },
};

/**
 * Returns the config for the given provider ID.
 */
export function getProviderConfig(providerId) {
  const config = AI_CONFIG.providers[providerId];
  if (!config) throw new Error(`Unknown AI provider: "${providerId}"`);
  return config;
}

/**
 * Returns the API key for the given provider from env.
 */
export function getProviderApiKey(providerId) {
  const config = getProviderConfig(providerId);
  return import.meta.env[config.apiKeyEnvVar] || '';
}
