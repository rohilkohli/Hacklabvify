// src/App.jsx
// Root application orchestrator — maintains signature card layout, top controls, and kinetic wave background.
// Integrates Raycast Command Palette, Thinking Indicator, 16 C-Suite Board, Tasks, and Health Radar into Right Tools Panel.

import { useState, useRef, useEffect, useCallback } from 'react';
import { buildSystemPrompt, buildRunwayPrompt, buildUnitEconomicsPrompt, buildCapTablePrompt, buildInvestorMemoPrompt } from './engine/prompt.engine.js';
import { getTranslation } from './i18n/translations.js';
import { ADVISOR_PERSONAS, LANGUAGES, PRESET_STARTUPS, QUICK_SUGGESTIONS } from './config/constants.js';

// Stores
import { useSettingsStore } from './store/settingsStore.js';
import { useSessionStore } from './store/sessionStore.js';
import { useCompanyStore } from './store/companyStore.js';
import { useChatStore } from './store/chatStore.js';
import { useFinanceStore } from './store/financeStore.js';

// Components & Modals
import InteractiveWaves from './components/ui/interactive-waves.jsx';
import { SunIcon, MoonIcon } from './components/icons.jsx';
import { MessageBubble } from './components/chat/MessageBubble.jsx';
import { ThinkingIndicator } from './components/chat/ThinkingIndicator.jsx';
import { InputComposer } from './components/chat/InputComposer.jsx';
import { CommandPalette } from './components/common/CommandPalette.jsx';
import { RightPanel } from './components/panel/RightPanel.jsx';
import { ErrorBoundary } from './components/layout/ErrorBoundary.jsx';

// Toast Notification Component
function Toast({ message, visible }) {
  return <div className={`toast ${visible ? 'toast-visible' : ''}`}>{message}</div>;
}

export function AppContent() {
  // Settings store
  const { theme, toggleTheme, language, setLanguage, customApiKey, setCustomApiKey, showGuideBanner, setShowGuideBanner } = useSettingsStore();

  // Session store
  const { username, startupName, stage, sessionActive, persona, setPersona, startSession, endSession, setUsername, setStartupName, setStage } = useSessionStore();

  // Company store
  const { brain, updateField: updateBrainField, getCompletionScore } = useCompanyStore();

  // Chat store
  const {
    messages, savedInsights, input, loading, isListening, attachedFile,
    setInput, sendMessage, clearSessionMessages, bookmarkMessage, deleteBookmark,
    exportSession, initSessionMessages, setAttachedFile
  } = useChatStore();

  // Finance store
  const financeStore = useFinanceStore();
  const derivedMetrics = financeStore.getDerivedMetrics();

  // UI state
  const [langOpen, setLangOpen] = useState(false);
  const [guideExpanded, setGuideExpanded] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(customApiKey);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const langRef = useRef(null);
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2200);
  }, []);

  // Theme Sync
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Scroll to chat bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Close lang dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const t = getTranslation(language);
  const activePersonaObj = ADVISOR_PERSONAS.find((p) => p.id === persona) || ADVISOR_PERSONAS[0];
  const brainScore = getCompletionScore();

  // Build system prompt with Company Brain context
  const systemPrompt = buildSystemPrompt({ personaId: persona, username, startupName, stage, language, companyBrain: brain });

  // Event Handlers
  const handleStartSessionSubmit = (e) => {
    e?.preventDefault();
    if (!username.trim()) return;
    const name = startupName.trim() || 'DevPulse AI';
    startSession(username.trim(), name, stage);
    initSessionMessages(username.trim(), name, stage);
  };

  const handleApplyPreset = (preset) => {
    startSession(username || 'Founder', preset.name, preset.stage);
    initSessionMessages(username || 'Founder', preset.name, preset.stage);
    showToast(`Loaded ${preset.name}`);
  };

  const handleLaunchWithPrompt = (prompt) => {
    const name = startupName.trim() || 'DevPulse AI';
    if (!sessionActive) startSession(username || 'Founder', name, stage);
    sendMessage(prompt, systemPrompt);
  };

  const handleCommandPaletteAction = (type, value) => {
    if (type === 'prompt') {
      handleLaunchWithPrompt(value);
    } else if (type === 'openPalette') {
      setIsCmdOpen(true);
    }
  };

  const handleLogout = () => {
    endSession();
    showToast('Returned to Start');
  };

  const handleSend = () => {
    if (!input.trim() || loading) return;
    sendMessage(input, systemPrompt);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Financial AI prompt actions
  const askRunway = () => sendMessage(buildRunwayPrompt({
    startupName,
    cashBalance: financeStore.cashBalance,
    monthlyExpenses: financeStore.monthlyExpenses,
    monthlyRevenue: financeStore.monthlyRevenue,
    netBurn: derivedMetrics.netBurn,
    runwayMonths: derivedMetrics.runwayMonths
  }), systemPrompt);

  const askUnitEcon = () => sendMessage(buildUnitEconomicsPrompt({
    startupName,
    arpu: financeStore.arpu,
    cac: financeStore.cac,
    grossMargin: financeStore.grossMargin,
    monthlyChurn: financeStore.monthlyChurn,
    ltv: derivedMetrics.ltv,
    ltvCacRatio: derivedMetrics.ltvCacRatio,
    cacPaybackMonths: derivedMetrics.cacPaybackMonths
  }), systemPrompt);

  const askCapTable = () => sendMessage(buildCapTablePrompt({
    startupName,
    founderInitialPct: financeStore.founderInitialPct,
    esopPoolPct: financeStore.esopPoolPct,
    safeInvestment: financeStore.safeInvestment,
    postMoneyCap: financeStore.postMoneyCap,
    safeDilutionPct: derivedMetrics.safeDilutionPct,
    founderPostRoundPct: derivedMetrics.founderPostRoundPct
  }), systemPrompt);

  const askMemo = () => sendMessage(buildInvestorMemoPrompt({
    startupName,
    stage,
    memoMonth: financeStore.memoMonth,
    cashBalance: financeStore.cashBalance,
    netBurn: derivedMetrics.netBurn,
    runwayMonths: derivedMetrics.runwayMonths,
    monthlyRevenue: financeStore.monthlyRevenue,
    memoHighs: financeStore.memoHighs,
    memoLows: financeStore.memoLows,
    memoAsks: financeStore.memoAsks
  }), systemPrompt);

  const copyMemo = () => {
    const text = `Subject: ${startupName || 'Startup'} Investor Update — ${financeStore.memoMonth}\n\nHi Investors & Mentors,\n\n🚀 HIGHS\n${financeStore.memoHighs}\n\n📉 LOWS\n${financeStore.memoLows}\n\n📊 METRICS\n- MRR: $${financeStore.monthlyRevenue.toLocaleString()}/mo\n- Burn: $${derivedMetrics.netBurn.toLocaleString()}/mo\n- Cash: $${financeStore.cashBalance.toLocaleString()}\n- Runway: ${derivedMetrics.runwayMonths} months\n\n🤝 ASKS\n${financeStore.memoAsks}\n\nThanks,\n${username} & Team ${startupName}`;
    navigator.clipboard.writeText(text);
    showToast('Investor memo copied');
  };

  const copyMessageText = (content) => {
    navigator.clipboard.writeText(content);
    showToast('Copied to clipboard');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      setAttachedFile({ name: file.name, content: typeof content === 'string' ? content : '[Binary File]' });
      showToast(`Attached ${file.name}`);
    };
    reader.readAsText(file);
  };

  const toggleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Speech recognition not supported in browser');
      return;
    }
    if (isListening) {
      useChatStore.getState().setIsListening(false);
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.onstart = () => { useChatStore.getState().setIsListening(true); showToast('Listening... Speak now'); };
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(input ? `${input} ${transcript}` : transcript);
        useChatStore.getState().setIsListening(false);
      };
      recognition.onerror = () => { useChatStore.getState().setIsListening(false); showToast('Voice input error'); };
      recognition.onend = () => useChatStore.getState().setIsListening(false);
      recognition.start();
    } catch {
      useChatStore.getState().setIsListening(false);
    }
  };

  return (
    <div className={`app-root theme-${theme}`}>
      {/* Background */}
      <div className="grid-background"><InteractiveWaves /></div>

      {/* Floating Theme Control */}
      <button className="top-theme-btn" onClick={toggleTheme} title="Toggle theme">
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>

      {/* Language Dropdown */}
      <div className="top-lang-dropdown" ref={langRef}>
        <button className={`top-lang-pill ${langOpen ? 'open' : ''}`} onClick={() => setLangOpen(p => !p)}>
          <span style={{ fontSize: '12px' }}>🌐</span>
          <span>{LANGUAGES.find(l => l.code === language)?.label || language}</span>
          <span className={`top-lang-chevron ${langOpen ? 'open' : ''}`}>▾</span>
        </button>
        {langOpen && (
          <div className="top-lang-menu">
            {LANGUAGES.map(l => (
              <button key={l.code} className={`top-lang-option ${language === l.code ? 'active' : ''}`}
                onClick={() => { setLanguage(l.code); setLangOpen(false); showToast(`Language: ${l.label}`); }}>
                <span>{l.label}</span>
                {language === l.code && <span style={{ color: 'var(--accent)', fontSize: '11px' }}>✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <Toast message={toastMsg} visible={toastVisible} />

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCmdOpen}
        onClose={() => setIsCmdOpen(false)}
        onSelectAction={handleCommandPaletteAction}
      />

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '17px', fontWeight: 500, color: 'var(--text-primary)' }}>API Settings</div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Enter a custom Gemini/OpenAI API key to override the environment default. Stored locally in your browser.
            </div>
            <div className="login-form-group">
              <label className="field-label">API Key</label>
              <input type="password" className="input-login" placeholder="AIzaSy... / sk-..." value={tempApiKey} onChange={e => setTempApiKey(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button className="text-btn" onClick={() => { setCustomApiKey(''); setTempApiKey(''); setShowSettingsModal(false); showToast('Key cleared'); }}>Clear Key</button>
              <button className="glow-start-btn" style={{ width: 'auto', padding: '6px 16px', margin: 0 }}
                onClick={() => { setCustomApiKey(tempApiKey.trim()); setShowSettingsModal(false); showToast(tempApiKey.trim() ? 'Key saved' : 'Using default'); }}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Window */}
      <div className="app-window-wrapper">
        <div className="main-container-card">

          {/* VIEW 1: Start / Onboarding */}
          {!sessionActive ? (
            <div className="login-view-container">
              <div className="login-header">
                <h1>{t.heroTitle}</h1>
                <p>{t.heroTagline}</p>
              </div>

              <div className="login-tips">
                {[
                  { label: t.marketResearch, desc: t.marketResearchDesc, prompt: 'Give me a comprehensive Market Research overview (TAM/SAM/SOM, trends, target customer segments).' },
                  { label: t.competitorAnalysis, desc: t.competitorDesc, prompt: 'Analyze the top 5 competitors, key differentiators, and our competitive moat.' },
                  { label: t.pitchDeck, desc: t.pitchDeckDesc, prompt: 'Create a complete 10-slide pitch deck outline with slide titles and key bullet points.' },
                  { label: t.runwayCalc, desc: t.runwayDesc, prompt: 'Analyze our unit economics, CAC/LTV, burn rate, and runway optimization strategies.' },
                ].map(({ label, desc, prompt }) => (
                  <button key={label} type="button" className="tip-item tip-btn" onClick={() => handleLaunchWithPrompt(prompt)}>
                    <strong>{label}</strong>: {desc}
                  </button>
                ))}
              </div>

              <form onSubmit={handleStartSessionSubmit} className="login-form-group">
                <input type="text" className="input-login" placeholder={t.founderPlaceholder} value={username} onChange={e => setUsername(e.target.value)} required />
                <input type="text" className="input-login" placeholder={t.startupPlaceholder} value={startupName} onChange={e => setStartupName(e.target.value)} required />
                <select className="input-login" value={stage} onChange={e => setStage(e.target.value)}>
                  {['Idea', 'MVP', 'Beta', 'Revenue', 'Scaling'].map(s => (
                    <option key={s} value={s}>{s} Stage</option>
                  ))}
                </select>
                <button type="submit" className="glow-start-btn">{t.startSessionBtn}</button>
              </form>

              <div style={{ marginTop: '18px', display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {PRESET_STARTUPS.map(p => (
                  <button key={p.name} className="suggestion-chip" onClick={() => handleApplyPreset(p)}>
                    ✦ {p.name} ({p.stage})
                  </button>
                ))}
              </div>
            </div>

          ) : (
            /* VIEW 2: Active Dual-Column Workspace */
            <>
              {/* Left Column: Advisory Chat */}
              <div className="chat-left-col">
                <header className="chat-header">
                  <div className="codelab-title">
                    <span style={{ color: 'var(--accent)', fontSize: '15px' }}>✦</span>
                    <h2>{startupName || 'FounderNexus'}</h2>
                  </div>

                  <div className="header-metrics">
                    <span className="header-metric-badge" style={{ borderColor: derivedMetrics.runwayColor, color: derivedMetrics.runwayColor }}>
                      <span className="metric-label">{t.runway}</span>
                      <span className="metric-value">{derivedMetrics.runwayMonths} mo</span>
                    </span>
                    <span className="header-metric-badge">
                      <span className="metric-label">{t.burn}</span>
                      <span className="metric-value">${derivedMetrics.netBurn.toLocaleString()}/mo</span>
                    </span>
                  </div>

                  <div className="header-controls">
                    <button className="mini-link-btn" onClick={() => setIsCmdOpen(true)} title="Command Palette (Cmd+K)">⌘K</button>
                    <span className="user-badge">{username}</span>
                    <button className="text-btn" onClick={() => clearSessionMessages(startupName)}>{t.clear}</button>
                    <button className="text-btn" onClick={handleLogout}>{t.home}</button>
                    <button className="text-btn" onClick={() => setShowSettingsModal(true)}>{t.settings}</button>
                  </div>
                </header>

                {/* Chat Timeline */}
                <div className="chat-area">
                  {showGuideBanner && (
                    <div className="guide-banner">
                      <div className="guide-banner-collapsed" onClick={() => setGuideExpanded(p => !p)}>
                        <div className="guide-banner-title">
                          <span>✦</span><span>{t.quickTips}</span>
                          <span className={`guide-banner-arrow ${guideExpanded ? 'expanded' : ''}`}>›</span>
                        </div>
                        <button className="guide-dismiss" onClick={e => { e.stopPropagation(); setShowGuideBanner(false); }}>✕</button>
                      </div>
                      {guideExpanded && (
                        <div className="guide-banner-content">
                          <div>1. {t.tip1}</div><div>2. {t.tip2}</div><div>3. {t.tip3}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {messages.map((msg, idx) => (
                    <MessageBubble key={idx} msg={msg} onCopy={copyMessageText} onBookmark={bookmarkMessage} />
                  ))}

                  {/* Empty state starter cards */}
                  {messages.length === 1 && !loading && (
                    <div className="empty-state">
                      <div className="starter-grid">
                        {QUICK_SUGGESTIONS.map((s, i) => (
                          <button key={i} className="starter-card" onClick={() => sendMessage(s.prompt, systemPrompt)} disabled={loading}>
                            <span className="starter-card-icon">{['🔍', '🏆', '💰', '📊'][i % 4]}</span>
                            <div className="starter-card-title">{s.label}</div>
                          </button>
                        ))}
                      </div>
                      <div className="empty-state-hint">{t.orTypeQuestion}</div>
                    </div>
                  )}

                  {loading && <ThinkingIndicator />}
                  <div ref={chatEndRef} />
                </div>

                {/* Quick Suggestions */}
                <div className="suggestions-container">
                  {QUICK_SUGGESTIONS.map((s, i) => (
                    <button key={i} className="suggestion-chip" onClick={() => sendMessage(s.prompt, systemPrompt)} disabled={loading}>
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Input Composer */}
                <InputComposer
                  input={input}
                  setInput={setInput}
                  onSend={handleSend}
                  onKeyDown={handleKeyDown}
                  onVoiceInput={toggleVoiceInput}
                  isListening={isListening}
                  loading={loading}
                  onFileUpload={handleFileUpload}
                  fileInputRef={fileInputRef}
                  attachedFile={attachedFile}
                  onRemoveFile={() => setAttachedFile(null)}
                  placeholder={t.inputPlaceholder}
                />
              </div>

              {/* Right Column */}
              <RightPanel
                t={t}
                persona={persona}
                setPersona={setPersona}
                financials={{
                  ...financeStore,
                  ...derivedMetrics,
                  setCashBalance: financeStore.setCashBalance,
                  setMonthlyExpenses: financeStore.setMonthlyExpenses,
                  setMonthlyRevenue: financeStore.setMonthlyRevenue,
                  setArpu: financeStore.setArpu,
                  setCac: financeStore.setCac,
                  setGrossMargin: financeStore.setGrossMargin,
                  setMonthlyChurn: financeStore.setMonthlyChurn,
                  setSafeInvestment: financeStore.setSafeInvestment,
                  setPostMoneyCap: financeStore.setPostMoneyCap,
                  setMemoMonth: financeStore.setMemoMonth,
                  setMemoHighs: financeStore.setMemoHighs,
                  setMemoLows: financeStore.setMemoLows,
                  setMemoAsks: financeStore.setMemoAsks,
                  updateSlideDetail: financeStore.updateSlideDetail,
                  getRunwayColor: () => derivedMetrics.runwayColor,
                  getLtvCacColor: () => derivedMetrics.ltvCacColor,
                }}
                brain={brain}
                onUpdateBrainField={updateBrainField}
                brainCompletionScore={brainScore}
                savedInsights={savedInsights}
                onCopyMessage={copyMessageText}
                onDeleteBookmark={deleteBookmark}
                onExportSession={(format, opts) => exportSession(format, opts)}
                startupName={startupName}
                stage={stage}
                activePersonaObj={activePersonaObj}
                pitchSlides={financeStore.pitchSlides}
                onAskRunway={askRunway}
                onAskUnitEcon={askUnitEcon}
                onAskCapTable={askCapTable}
                onAskMemo={askMemo}
                onCopyMemo={copyMemo}
                onAskPrompt={(prompt) => handleLaunchWithPrompt(prompt)}
                onToast={showToast}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
