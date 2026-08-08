// src/services/ai/AIProviderFactory.js
// Resolves the correct AI provider based on config and available API keys.
// The application never instantiates providers directly — always uses this factory.

import { AI_CONFIG, getProviderApiKey } from '../../config/ai.js';
import { FEATURE_FLAGS } from '../../config/app.js';
import { GeminiProvider } from './GeminiProvider.js';
import { OpenAIProvider } from './OpenAIProvider.js';
import { Logger } from '../LoggerService.js';

const CONTEXT = 'AIProviderFactory';

// Provider registry — add new providers here only
const PROVIDER_REGISTRY = {
  gemini: (apiKey) => new GeminiProvider(apiKey),
  openai: (apiKey) => new OpenAIProvider(apiKey),
};

let _activeProvider = null;
let _customApiKey = '';

/**
 * Sets a custom API key override (from user settings).
 * This key takes priority over environment variables.
 */
export function setCustomApiKey(key) {
  _customApiKey = key || '';
  _activeProvider = null; // Invalidate cached provider
}

/**
 * Returns the active AI provider instance.
 * Provider selection order:
 * 1. Custom API key provider (if set by user)
 * 2. Default provider from AI_CONFIG
 * 3. Any available fallback
 */
export function getActiveProvider() {
  if (_activeProvider) return _activeProvider;

  const defaultId = AI_CONFIG.defaultProvider;

  // Try custom key first (user-provided in settings)
  if (_customApiKey.trim()) {
    // Auto-detect provider from key prefix
    const detectedId = detectProviderFromKey(_customApiKey);
    const factory = PROVIDER_REGISTRY[detectedId || defaultId];
    if (factory) {
      const provider = factory(_customApiKey);
      if (provider.isAvailable()) {
        _activeProvider = provider;
        Logger.info(`Using custom key with provider: ${provider.name}`, null, CONTEXT);
        return _activeProvider;
      }
    }
  }

  // Use default provider with env key
  const defaultKey = getProviderApiKey(defaultId);
  const defaultFactory = PROVIDER_REGISTRY[defaultId];
  if (defaultFactory && defaultKey) {
    _activeProvider = defaultFactory(defaultKey);
    Logger.info(`Using default provider: ${AI_CONFIG.providers[defaultId].name}`, null, CONTEXT);
    return _activeProvider;
  }

  // Fallback: first available provider
  for (const [id, factory] of Object.entries(PROVIDER_REGISTRY)) {
    if (id === defaultId) continue;
    const key = getProviderApiKey(id);
    if (key) {
      const p = factory(key);
      if (p.isAvailable()) {
        _activeProvider = p;
        Logger.warn(`Falling back to provider: ${p.name}`, null, CONTEXT);
        return _activeProvider;
      }
    }
  }

  // No provider available — return Gemini with empty key (will fail gracefully at request time)
  Logger.error('No AI provider is configured. Check your API key settings.', null, CONTEXT);
  _activeProvider = PROVIDER_REGISTRY.gemini('');
  return _activeProvider;
}

/**
 * Detects provider from API key prefix.
 */
function detectProviderFromKey(key) {
  if (key.startsWith('AIza')) return 'gemini';
  if (key.startsWith('sk-')) return 'openai';
  if (key.startsWith('sk-ant-')) return 'anthropic';
  return null;
}

/**
 * Returns the display name of the currently active provider.
 */
export function getActiveProviderName() {
  return getActiveProvider()?.name || 'Unknown';
}
