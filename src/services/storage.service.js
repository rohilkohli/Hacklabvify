// src/services/storage.service.js
// Typed localStorage abstraction. No React. No UI dependencies.
// Preserves all existing hv_* key names for backward compatibility.

const SCHEMA_VERSION = 2;
const VERSION_KEY = 'hv_schema_version';

const KEYS = {
  theme: 'hv_theme',
  lang: 'hv_lang',
  user: 'hv_user',
  startupName: 'hv_startupName',
  stage: 'hv_stage',
  session: 'hv_session',
  messages: 'hv_messages',
  savedInsights: 'hv_savedInsights',
  pitchSlides: 'hv_pitch_slides',
  customApiKey: 'hv_custom_api_key',
  persona: 'hv_persona',
  cash: 'hv_cash',
  expenses: 'hv_expenses',
  revenue: 'hv_revenue',
  arpu: 'hv_arpu',
  cac: 'hv_cac',
  margin: 'hv_margin',
  churn: 'hv_churn',
  founderPct: 'hv_founder_pct',
  esopPct: 'hv_esop_pct',
  safeAmt: 'hv_safe_amt',
  postCap: 'hv_post_cap',
  memoMonth: 'hv_memo_month',
  memoHighs: 'hv_memo_highs',
  memoLows: 'hv_memo_lows',
  memoAsks: 'hv_memo_asks',
  companyBrain: 'hv_company_brain',
  showGuideBanner: 'hv_guide_banner',
};

function safeGet(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return raw;
  } catch {
    return defaultValue;
  }
}

function safeGetJSON(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage quota exceeded or private browsing — fail silently
  }
}

function safeSetJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage quota exceeded — fail silently
  }
}

function safeGetNumber(key, defaultValue) {
  const raw = safeGet(key, null);
  if (raw === null) return defaultValue;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

// Run schema migrations on startup
function migrate() {
  const currentVersion = safeGetNumber(VERSION_KEY, 1);
  if (currentVersion < SCHEMA_VERSION) {
    // v1 → v2: no destructive changes needed; new keys simply get defaults
    safeSet(VERSION_KEY, String(SCHEMA_VERSION));
  }
}

migrate();

export const storage = {
  KEYS,

  // App settings
  getTheme: () => safeGet(KEYS.theme, 'dark'),
  setTheme: (v) => safeSet(KEYS.theme, v),

  getLang: () => safeGet(KEYS.lang, 'English'),
  setLang: (v) => safeSet(KEYS.lang, v),

  getUser: () => safeGet(KEYS.user, 'Rohil Kohli'),
  setUser: (v) => safeSet(KEYS.user, v),

  getStartupName: () => safeGet(KEYS.startupName, 'DevPulse AI'),
  setStartupName: (v) => safeSet(KEYS.startupName, v),

  getStage: () => safeGet(KEYS.stage, 'MVP'),
  setStage: (v) => safeSet(KEYS.stage, v),

  getSession: () => safeGet(KEYS.session, 'false') === 'true',
  setSession: (v) => safeSet(KEYS.session, String(v)),

  getPersona: () => safeGet(KEYS.persona, 'yc_partner'),
  setPersona: (v) => safeSet(KEYS.persona, v),

  getCustomApiKey: () => safeGet(KEYS.customApiKey, ''),
  setCustomApiKey: (v) => safeSet(KEYS.customApiKey, v),

  getShowGuideBanner: () => safeGet(KEYS.showGuideBanner, 'true') !== 'false',
  setShowGuideBanner: (v) => safeSet(KEYS.showGuideBanner, String(v)),

  // Chat
  getMessages: () => safeGetJSON(KEYS.messages, []),
  setMessages: (v) => safeSetJSON(KEYS.messages, v),

  getSavedInsights: () => safeGetJSON(KEYS.savedInsights, []),
  setSavedInsights: (v) => safeSetJSON(KEYS.savedInsights, v),

  // Pitch
  getPitchSlides: (defaultSlides) => safeGetJSON(KEYS.pitchSlides, defaultSlides),
  setPitchSlides: (v) => safeSetJSON(KEYS.pitchSlides, v),

  // Financials
  getCash: (d) => safeGetNumber(KEYS.cash, d),
  setCash: (v) => safeSet(KEYS.cash, String(v)),

  getExpenses: (d) => safeGetNumber(KEYS.expenses, d),
  setExpenses: (v) => safeSet(KEYS.expenses, String(v)),

  getRevenue: (d) => safeGetNumber(KEYS.revenue, d),
  setRevenue: (v) => safeSet(KEYS.revenue, String(v)),

  getArpu: (d) => safeGetNumber(KEYS.arpu, d),
  setArpu: (v) => safeSet(KEYS.arpu, String(v)),

  getCac: (d) => safeGetNumber(KEYS.cac, d),
  setCac: (v) => safeSet(KEYS.cac, String(v)),

  getMargin: (d) => safeGetNumber(KEYS.margin, d),
  setMargin: (v) => safeSet(KEYS.margin, String(v)),

  getChurn: (d) => safeGetNumber(KEYS.churn, d),
  setChurn: (v) => safeSet(KEYS.churn, String(v)),

  getFounderPct: (d) => safeGetNumber(KEYS.founderPct, d),
  setFounderPct: (v) => safeSet(KEYS.founderPct, String(v)),

  getEsopPct: (d) => safeGetNumber(KEYS.esopPct, d),
  setEsopPct: (v) => safeSet(KEYS.esopPct, String(v)),

  getSafeAmt: (d) => safeGetNumber(KEYS.safeAmt, d),
  setSafeAmt: (v) => safeSet(KEYS.safeAmt, String(v)),

  getPostCap: (d) => safeGetNumber(KEYS.postCap, d),
  setPostCap: (v) => safeSet(KEYS.postCap, String(v)),

  // Memo
  getMemoMonth: (d) => safeGet(KEYS.memoMonth, d),
  setMemoMonth: (v) => safeSet(KEYS.memoMonth, v),

  getMemoHighs: (d) => safeGet(KEYS.memoHighs, d),
  setMemoHighs: (v) => safeSet(KEYS.memoHighs, v),

  getMemoLows: (d) => safeGet(KEYS.memoLows, d),
  setMemoLows: (v) => safeSet(KEYS.memoLows, v),

  getMemoAsks: (d) => safeGet(KEYS.memoAsks, d),
  setMemoAsks: (v) => safeSet(KEYS.memoAsks, v),

  // Company Brain
  getCompanyBrain: (defaultBrain) => safeGetJSON(KEYS.companyBrain, defaultBrain),
  setCompanyBrain: (v) => safeSetJSON(KEYS.companyBrain, v),
};
