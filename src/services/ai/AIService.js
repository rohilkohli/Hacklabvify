// src/services/ai/AIService.js
// Central AI orchestration service. The ONLY entry point for all AI calls in the application.
// Features, components, and hooks must NEVER call fetch() or AI providers directly.

import { getActiveProvider } from './AIProviderFactory.js';
import { AIProviderError } from './GeminiProvider.js';
import { Logger } from '../LoggerService.js';

const CONTEXT = 'AIService';

/**
 * @typedef {object} ChatParams
 * @property {string} systemPrompt - The system instruction.
 * @property {Array<{role: string, content: string}>} messages - Conversation history.
 * @property {string} [overrideLastMessage] - Override the last message's content.
 * @property {object} [generationConfig] - Provider-specific generation config.
 * @property {string} [model] - Model override.
 */

/**
 * @typedef {object} AIResponse
 * @property {boolean} success
 * @property {string} [text] - The AI response text (if success).
 * @property {string} [error] - User-facing error message (if !success).
 * @property {string} [errorCode] - Machine-readable error code.
 * @property {number} [latencyMs] - Response latency in milliseconds.
 * @property {string} [providerId] - Which provider handled the request.
 */

/**
 * Sends a chat message through the active AI provider.
 * Returns a normalized AIResponse — never throws.
 *
 * @param {ChatParams} params
 * @returns {Promise<AIResponse>}
 */
export async function sendChatMessage({ systemPrompt, messages, overrideLastMessage, generationConfig, model }) {
  const provider = getActiveProvider();
  const start = performance.now();

  Logger.debug(`Sending to ${provider.name}`, { messageCount: messages.length }, CONTEXT);

  // Build the conversation to send
  let messagesToSend = messages;
  if (overrideLastMessage && messages.length > 0) {
    messagesToSend = [
      ...messages.slice(0, -1),
      { ...messages[messages.length - 1], content: overrideLastMessage },
    ];
  }

  try {
    const text = await provider.chat({
      systemPrompt,
      messages: messagesToSend,
      model,
      generationConfig,
    });

    const latencyMs = Math.round(performance.now() - start);
    Logger.info(`AI response received in ${latencyMs}ms`, null, CONTEXT);

    return {
      success: true,
      text,
      latencyMs,
      providerId: provider.id,
    };
  } catch (err) {
    const latencyMs = Math.round(performance.now() - start);
    Logger.error('AI request failed', err, CONTEXT);

    return {
      success: false,
      error: humanizeError(err),
      errorCode: err instanceof AIProviderError ? `API_${err.status}` : 'NETWORK_ERROR',
      latencyMs,
      providerId: provider.id,
    };
  }
}

/**
 * Converts technical errors into user-friendly messages.
 */
function humanizeError(err) {
  if (err instanceof AIProviderError) {
    if (err.status === 429) return '⚠️ Rate limit reached. Please wait a moment and try again.';
    if (err.status === 401 || err.status === 403) return '⚠️ Invalid API key. Check your settings.';
    if (err.status === 0) return '⚠️ Request timed out. Check your connection and try again.';
    if (err.status >= 500) return '⚠️ AI service is temporarily unavailable. Please try again shortly.';
    return `⚠️ ${err.message}`;
  }
  return '⚠️ Connection error. Please check your network and try again.';
}
