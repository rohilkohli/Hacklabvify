// src/services/LoggerService.js
// Centralized logging service. All console.log calls in the app should route through here.
// In production, logs can be sent to a remote service (e.g., Sentry, Datadog, LogRocket).

import { ENV } from '../config/app.js';

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

// In production, suppress debug and info logs
const MIN_LEVEL = ENV.isProd ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;

// Remote logging hook — replace with Sentry.captureException, etc.
const remoteHandlers = [];

function formatMessage(level, context, message, data) {
  const ts = new Date().toISOString();
  return `[${ts}] [${level}]${context ? ` [${context}]` : ''} ${message}`;
}

export const Logger = {
  /**
   * Registers a remote log handler.
   * @param {(level: string, context: string, message: string, data?: any) => void} handler
   */
  registerRemoteHandler(handler) {
    remoteHandlers.push(handler);
  },

  debug(message, data, context = '') {
    if (LOG_LEVELS.DEBUG < MIN_LEVEL) return;
    console.debug(formatMessage('DEBUG', context, message), data !== undefined ? data : '');
  },

  info(message, data, context = '') {
    if (LOG_LEVELS.INFO < MIN_LEVEL) return;
    console.info(formatMessage('INFO', context, message), data !== undefined ? data : '');
  },

  warn(message, data, context = '') {
    if (LOG_LEVELS.WARN < MIN_LEVEL) return;
    console.warn(formatMessage('WARN', context, message), data !== undefined ? data : '');
    remoteHandlers.forEach((h) => h('WARN', context, message, data));
  },

  error(message, error, context = '') {
    console.error(formatMessage('ERROR', context, message), error || '');
    remoteHandlers.forEach((h) => h('ERROR', context, message, error));
  },

  /**
   * Measures and logs execution time of an async function.
   */
  async time(label, fn, context = '') {
    const start = performance.now();
    try {
      const result = await fn();
      const ms = (performance.now() - start).toFixed(1);
      Logger.debug(`${label} completed in ${ms}ms`, null, context);
      return result;
    } catch (err) {
      const ms = (performance.now() - start).toFixed(1);
      Logger.error(`${label} failed after ${ms}ms`, err, context);
      throw err;
    }
  },
};
