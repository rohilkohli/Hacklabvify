// src/config/app.js
// Central application configuration. No hardcoded values anywhere else.

export const APP_CONFIG = {
  name: 'FounderNexus',
  version: '2.0.0',
  tagline: 'AI-native Founder Operating System',
  company: 'Team CYBERNEX',
  supportEmail: 'support@foundernexus.ai',
  docsUrl: 'https://docs.foundernexus.ai',
};

export const ENV = {
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  mode: import.meta.env.MODE,
};

export const STORAGE_CONFIG = {
  prefix: 'hv_',
  version: 2,
  // When migrating to cloud sync, update adapter here
  adapter: 'localStorage', // 'localStorage' | 'indexedDB' | 'cloud'
};

export const FEATURE_FLAGS = {
  // Toggle experimental features without code changes
  companyBrain: true,
  todaysBriefing: true,
  multiProvider: false,    // Enable when OpenAI adapter is production-ready
  collaboration: false,    // Future: real-time collaborative workspaces
  voiceCommands: false,    // Future: voice-commanded UI navigation
  mobileOptimized: false,  // Future: mobile-first layout switch
  darkModeAuto: false,     // Future: auto dark/light based on OS preference
};

export const UI_CONFIG = {
  toastDuration: 2200,        // ms
  animationDuration: 200,     // ms
  debounceDelay: 400,         // ms for search/filter inputs
  maxMessageLength: 8000,     // chars
  maxAttachmentSize: 5 * 1024 * 1024, // 5MB
  maxSavedInsights: 100,
  virtualListThreshold: 50,   // render virtual list when messages > this
};

export const SESSION_STAGE_OPTIONS = ['Idea', 'MVP', 'Beta', 'Revenue', 'Scaling'];
