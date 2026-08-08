// src/services/gemini.service.js
// All Gemini API communication. No React. No UI dependencies.
// Handles retry, timeout, and structured error normalization.

import { GEMINI_MODEL, getGeminiUrl } from '../config/constants.js';

const DEFAULT_CONFIG = {
  maxOutputTokens: 2048,
  temperature: 0.65,
  topP: 0.95,
};

const TIMEOUT_MS = 30_000;
const RETRYABLE_STATUS = new Set([429, 500, 503]);
const MAX_RETRIES = 2;

/**
 * Normalized error thrown by callGemini.
 */
export class GeminiError extends Error {
  constructor(message, status, retryable = false) {
    super(message);
    this.name = 'GeminiError';
    this.status = status;
    this.retryable = retryable;
  }
}

/**
 * Waits for a given number of milliseconds.
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Makes a single attempt to the Gemini API.
 */
async function attempt({ apiKey, systemPrompt, history, config, model }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const url = getGeminiUrl(apiKey, model || GEMINI_MODEL);

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: history,
    generationConfig: { ...DEFAULT_CONFIG, ...config },
  };

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
      const errMsg = data?.error?.message || `API error (${res.status})`;
      throw new GeminiError(errMsg, res.status, RETRYABLE_STATUS.has(res.status));
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trimEnd();
    if (!text) {
      throw new GeminiError('Empty response from model.', 200, false);
    }

    return text;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new GeminiError('Request timed out after 30 seconds.', 0, true);
    }
    if (err instanceof GeminiError) throw err;
    throw new GeminiError(err.message || 'Network error.', 0, true);
  }
}

/**
 * Calls the Gemini API with automatic retry on retryable errors.
 *
 * @param {object} params
 * @param {string} params.apiKey - The Gemini API key to use.
 * @param {string} params.systemPrompt - The system instruction text.
 * @param {Array<{role: string, content: string}>} params.messages - Chat history.
 * @param {string} [params.overridePrompt] - Optional text to override the last user message.
 * @param {object} [params.config] - Optional generation config overrides.
 * @param {string} [params.model] - Optional model override.
 * @returns {Promise<string>} The AI response text.
 * @throws {GeminiError} On unrecoverable failure.
 */
export async function callGemini({ apiKey, systemPrompt, messages, overridePrompt, config, model }) {
  // Build the conversation history for the API
  const history = messages.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));

  // If an override prompt is provided, replace the last message's text
  if (overridePrompt && history.length > 0) {
    history[history.length - 1].parts = [{ text: overridePrompt }];
  }

  let lastError;
  for (let attempt_num = 0; attempt_num <= MAX_RETRIES; attempt_num++) {
    try {
      return await attempt({ apiKey, systemPrompt, history, config, model });
    } catch (err) {
      lastError = err;
      if (!err.retryable || attempt_num === MAX_RETRIES) break;
      // Exponential backoff: 1s, 2s
      await delay(1000 * (attempt_num + 1));
    }
  }

  throw lastError;
}
