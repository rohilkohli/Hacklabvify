import { useState, useRef, useEffect, useCallback } from 'react';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-3.6-flash';
const getGeminiUrl = (apiKey) => `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey || GEMINI_API_KEY}`;

const STAGE_OPTIONS = ['Idea', 'MVP', 'Beta', 'Revenue', 'Scaling'];

const LANGUAGES = [
  { code: 'English', label: 'English' },
  { code: 'Spanish', label: 'Español' },
  { code: 'French', label: 'Français' },
  { code: 'German', label: 'Deutsch' },
  { code: 'Hindi', label: 'Hindi' },
  { code: 'Japanese', label: '日本語' },
  { code: 'Chinese (Simplified)', label: '简体中文' },
  { code: 'Portuguese', label: 'Português' },
];

const PRESET_STARTUPS = [
  { name: 'DevPulse AI', industry: 'DevTools & AI', stage: 'MVP', tagline: 'Automated PR code reviews and security audits' },
  { name: 'MediMind', industry: 'HealthTech & AI', stage: 'Idea', tagline: 'AI clinical triage assistant for rural health clinics' },
  { name: 'PayFlow Global', industry: 'FinTech', stage: 'Revenue', tagline: 'Cross-border B2B payouts for remote engineering teams' }
];

const ADVISOR_PERSONAS = [
  { id: 'yc_partner', name: 'YC Partner', icon: '⚡', desc: 'Direct, speed & growth metrics focus' },
  { id: 'risk_expert', name: 'Risk & Legal Expert', icon: '🛡️', desc: 'Compliance, security & IP focus' },
  { id: 'growth_guru', name: 'Growth Lead', icon: '🚀', desc: 'Virality, CAC/LTV & funnel conversion' }
];

const QUICK_SUGGESTIONS = [
  { label: '⚡ 3 Next Actions', prompt: 'Give me the top 3 immediate actionable execution steps for our startup this week.' },
  { label: '🔍 Market Research', prompt: 'Give me a comprehensive Market Research overview (TAM/SAM/SOM, trends, target customer segments).' },
  { label: '🏆 Competitor Analysis', prompt: 'Analyze the top 5 competitors, key differentiators, and our competitive moat.' },
  { label: '💰 Pitch Deck Outline', prompt: 'Create a complete 10-slide pitch deck outline with slide titles and key bullet points.' },
  { label: '📊 Financial Runway', prompt: 'Analyze our unit economics, CAC/LTV, burn rate, and runway optimization strategies.' }
];

// ── Markdown Parser ──────────────────────────────────────────────
function parseMarkdown(text) {
  if (!text) return null;
  const elements = [];
  let key = 0;

  const parseInline = (str) => {
    const parts = [];
    const regex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) parts.push(str.slice(lastIndex, match.index).replace(/\*/g, ''));
      parts.push(<strong key={`b-${key++}`}>{match[1]}</strong>);
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < str.length) parts.push(str.slice(lastIndex).replace(/\*/g, ''));
    return parts.length === 0 ? '' : parts.length === 1 ? parts[0] : parts;
  };

  const blocks = text.split(/\n{2,}/);
  blocks.forEach((block) => {
    const trimmed = block.trim();
    if (!trimmed) return;
    const lines = trimmed.split('\n');
    const isBullet = (l) => /^[-•*]\s/.test(l.trim());

    if (/^#{1,3}\s/.test(lines[0])) {
      const ht = lines[0].replace(/^#{1,3}\s+/, '').replace(/\*\*/g, '');
      elements.push(<p key={`h-${key++}`} className="md-heading">{ht}</p>);
      const rest = lines.slice(1).join(' ').trim();
      if (rest) elements.push(<p key={`p-${key++}`} className="md-paragraph">{parseInline(rest)}</p>);
      return;
    }

    if (lines.every(isBullet)) {
      elements.push(
        <ul key={`ul-${key++}`} className="md-list">
          {lines.map((l, i) => <li key={i}>{parseInline(l.trim().replace(/^[-•*]\s/, ''))}</li>)}
        </ul>
      );
      return;
    }

    const listItems = [];
    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`ul-${key++}`} className="md-list">
            {listItems.map((item, i) => <li key={i}>{parseInline(item)}</li>)}
          </ul>
        );
        listItems.length = 0;
      }
    };

    lines.forEach((line) => {
      const t = line.trim();
      if (!t) return;
      if (isBullet(t)) {
        listItems.push(t.replace(/^[-•*]\s/, ''));
      } else if (/^#{1,3}\s/.test(t)) {
        flushList();
        elements.push(<p key={`h-${key++}`} className="md-heading">{t.replace(/^#{1,3}\s+/, '').replace(/\*\*/g, '')}</p>);
      } else {
        flushList();
        elements.push(<p key={`p-${key++}`} className="md-paragraph">{parseInline(t)}</p>);
      }
    });
    flushList();
  });

  return elements;
}

// ── Icons ────────────────────────────────────────────────────────
function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function UpArrowIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function BotAvatar() {
  return (
    <div className="bot-avatar">
      ⚡
    </div>
  );
}

function Toast({ message, visible }) {
  return (
    <div className={`toast ${visible ? 'toast-visible' : ''}`}>
      {message}
    </div>
  );
}

// ── Main App Component ───────────────────────────────────────────
export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('hv_theme') || 'dark');
  const [language, setLanguage] = useState(() => localStorage.getItem('hv_lang') || 'English');
  const [username, setUsername] = useState(() => localStorage.getItem('hv_user') || 'Rohil Kohli');
  const [startupName, setStartupName] = useState(() => localStorage.getItem('hv_startupName') || 'DevPulse AI');
  const [stage, setStage] = useState(() => localStorage.getItem('hv_stage') || 'MVP');
  const [sessionActive, setSessionActive] = useState(() => localStorage.getItem('hv_session') === 'true');
  const [customApiKey, setCustomApiKey] = useState(() => localStorage.getItem('hv_custom_api_key') || '');
  const [persona, setPersona] = useState(() => localStorage.getItem('hv_persona') || 'yc_partner');

  // IDE Context Buffer states
  const [codeFilename, setCodeFilename] = useState('');
  const [codeContext, setCodeContext] = useState('');
  const [terminalErrors, setTerminalErrors] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);

  // Financial Runway Modeler states
  const [cashBalance, setCashBalance] = useState(() => Number(localStorage.getItem('hv_cash')) || 120000);
  const [monthlyExpenses, setMonthlyExpenses] = useState(() => Number(localStorage.getItem('hv_expenses')) || 15000);
  const [monthlyRevenue, setMonthlyRevenue] = useState(() => Number(localStorage.getItem('hv_revenue')) || 4000);

  // Chat Messages state
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('hv_messages');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(customApiKey);

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // LocalStorage Sync
  useEffect(() => { localStorage.setItem('hv_theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('hv_lang', language); }, [language]);
  useEffect(() => { localStorage.setItem('hv_user', username); }, [username]);
  useEffect(() => { localStorage.setItem('hv_startupName', startupName); }, [startupName]);
  useEffect(() => { localStorage.setItem('hv_stage', stage); }, [stage]);
  useEffect(() => { localStorage.setItem('hv_session', sessionActive); }, [sessionActive]);
  useEffect(() => { localStorage.setItem('hv_messages', JSON.stringify(messages)); }, [messages]);
  useEffect(() => { localStorage.setItem('hv_custom_api_key', customApiKey); }, [customApiKey]);
  useEffect(() => { localStorage.setItem('hv_persona', persona); }, [persona]);
  useEffect(() => { localStorage.setItem('hv_cash', cashBalance); }, [cashBalance]);
  useEffect(() => { localStorage.setItem('hv_expenses', monthlyExpenses); }, [monthlyExpenses]);
  useEffect(() => { localStorage.setItem('hv_revenue', monthlyRevenue); }, [monthlyRevenue]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2200);
  }, []);

  const activePersonaObj = ADVISOR_PERSONAS.find((p) => p.id === persona) || ADVISOR_PERSONAS[0];

  const systemContext = `You are Hacklabvify AI Startup Copilot (Problem Statement 10 by Team CYBERNEX). ${activePersonaObj.desc}. Respond in ${language}. Founder: "${username}", Startup: "${startupName || 'DevPulse AI'}" (${stage} stage). Provide sharp, founder-level strategic advice. Format with bold terms, ## headers, and bullet points. Conclude with ## ⚡ Your Next 3 Actions. Keep response under 350 words.`;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 100)}px`;
  }, [input]);

  const callGemini = useCallback(async (userMessage) => {
    if (!userMessage.trim() || loading) return;
    setLoading(true);

    let fullPrompt = userMessage.trim();
    if (codeContext.trim()) {
      fullPrompt += `\n\n[ATTACHED CODE BUFFER ${codeFilename ? `(${codeFilename})` : ''}]:\n\`\`\`\n${codeContext.trim()}\n\`\`\``;
    }
    if (terminalErrors.trim()) {
      fullPrompt += `\n\n[TERMINAL & BUILD TRACEBACKS]:\n\`\`\`\n${terminalErrors.trim()}\n\`\`\``;
    }
    if (attachedFile) {
      fullPrompt += `\n\n[ATTACHED FILE (${attachedFile.name})]:\n${attachedFile.content}`;
    }

    const newMessages = [...messages, { role: 'user', content: userMessage.trim(), ts: Date.now() }];
    setMessages(newMessages);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      const history = newMessages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      if (history.length > 0) {
        history[history.length - 1].parts = [{ text: fullPrompt }];
      }

      const activeKey = customApiKey.trim() || GEMINI_API_KEY;

      const res = await fetch(getGeminiUrl(activeKey), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemContext }] },
          contents: history,
          generationConfig: { maxOutputTokens: 2048, temperature: 0.75 },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg = data?.error?.message || `API error (${res.status})`;
        setMessages([...newMessages, { role: 'assistant', content: `⚠️ ${errMsg}`, ts: Date.now() }]);
        return;
      }

      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trimEnd()
        || "Couldn't generate a response. Please try again.";
      const finalMessages = [...newMessages, { role: 'assistant', content: reply, ts: Date.now() }];
      setMessages(finalMessages);
    } catch {
      setMessages([...messages, { role: 'assistant', content: '⚠️ Connection error. Check your API key or network connection.', ts: Date.now() }]);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [messages, loading, systemContext, customApiKey, codeContext, codeFilename, terminalErrors, attachedFile]);

  const handleStartMission = (e) => {
    if (e) e.preventDefault();
    if (!username.trim()) return;
    const chosenName = startupName.trim() || 'DevPulse AI';
    setStartupName(chosenName);
    setSessionActive(true);
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Welcome **${username.trim()}**! I am your AI Startup Co-Founder for **${chosenName}** (${stage} stage). How can I assist your startup strategy today? ⚡`,
        ts: Date.now(),
      }]);
    }
  };

  const handleApplyPreset = (preset) => {
    setUsername(username || 'Rohil Kohli');
    setStartupName(preset.name);
    setStage(preset.stage);
    setSessionActive(true);
    setMessages([{
      role: 'assistant',
      content: `Welcome **${username || 'Founder'}**! Loaded **${preset.name}** (${preset.industry} • ${preset.stage} stage). "${preset.tagline}". Choose a Strategy Playbook below or ask any question! 🚀`,
      ts: Date.now(),
    }]);
    showToast(`Loaded ${preset.name}`);
  };

  const handleSend = () => {
    if (!input.trim() || loading) return;
    callGemini(input);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearSession = () => {
    setMessages([{
      role: 'assistant',
      content: `Session reset. Ready to assist **${startupName || 'DevPulse AI'}**. Ask a strategy question or paste code/terminal context!`,
      ts: Date.now(),
    }]);
    setCodeContext('');
    setCodeFilename('');
    setTerminalErrors('');
    setAttachedFile(null);
    showToast('Session cleared');
  };

  const handleLogout = () => {
    setSessionActive(false);
    showToast('Returned to Start Screen');
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

  const netBurn = Math.max(0, monthlyExpenses - monthlyRevenue);
  const runwayMonths = netBurn > 0 ? (cashBalance / netBurn).toFixed(1) : '∞';

  return (
    <div className={`app-root theme-${theme}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Dark Theme Variables ── */
        .theme-dark {
          --bg-dot: #121824;
          --dot-color: rgba(255, 255, 255, 0.12);
          --grid-line-color: rgba(255, 255, 255, 0.04);
          --card-bg: #1A212D;
          --card-border: #283344;
          --left-bg: #1A212D;
          --right-bg: #151B25;
          --header-bg: #1E2736;
          --text-primary: #F0F4FF;
          --text-secondary: #94A3B8;
          --text-muted: #64748B;
          --input-bg: #222C3D;
          --input-border: #313E54;
          --accent-blue: #3B82F6;
          --accent-glow: rgba(59, 130, 246, 0.2);
          --btn-hover: #2563EB;
          --code-bg: #111622;
          --shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
        }

        /* ── Light Theme Variables ── */
        .theme-light {
          --bg-dot: #F8FAFC;
          --dot-color: rgba(71, 85, 105, 0.25);
          --grid-line-color: rgba(203, 213, 225, 0.45);
          --card-bg: #FFFFFF;
          --card-border: #E2E8F0;
          --left-bg: #FFFFFF;
          --right-bg: #FAFCFF;
          --header-bg: #F1F5F9;
          --text-primary: #0F172A;
          --text-secondary: #475569;
          --text-muted: #94A3B8;
          --input-bg: #F1F5F9;
          --input-border: #CBD5E1;
          --accent-blue: #2563EB;
          --accent-glow: rgba(37, 99, 235, 0.12);
          --btn-hover: #1D4ED8;
          --code-bg: #F8FAFC;
          --shadow: 0 20px 50px rgba(0, 0, 0, 0.08);
        }

        html, body, #root, .app-root { height: 100%; overflow: hidden; }
        body { font-family: 'Inter', sans-serif; background: var(--bg-dot); color: var(--text-primary); transition: all 0.3s ease; }

        /* ── Grid & Dot Background with Floating Nodes ── */
        .grid-background {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-color: var(--bg-dot);
          background-image: 
            radial-gradient(var(--dot-color) 1.5px, transparent 1.5px),
            linear-gradient(to right, var(--grid-line-color) 1px, transparent 1px),
            linear-gradient(to bottom, var(--grid-line-color) 1px, transparent 1px);
          background-size: 24px 24px, 24px 24px, 24px 24px;
        }

        .floating-node {
          position: absolute; border-radius: 50%; pointer-events: none;
          animation: floatAnim 18s infinite ease-in-out alternate;
        }
        .node-blue { width: 22px; height: 22px; background: #3B82F6; top: 18%; left: 12%; box-shadow: 0 0 16px rgba(59, 130, 246, 0.6); }
        .node-yellow { width: 18px; height: 18px; background: #F59E0B; bottom: 25%; left: 8%; box-shadow: 0 0 16px rgba(245, 158, 11, 0.6); animation-delay: -5s; }
        .node-green { width: 20px; height: 20px; background: #10B981; bottom: 15%; right: 28%; box-shadow: 0 0 16px rgba(16, 185, 129, 0.6); animation-delay: -10s; }
        .node-red { width: 16px; height: 16px; background: #EF4444; bottom: 30%; right: 18%; box-shadow: 0 0 14px rgba(239, 68, 68, 0.6); animation-delay: -12s; }
        .node-big-yellow { width: 28px; height: 28px; background: #F59E0B; top: 22%; right: 15%; box-shadow: 0 0 20px rgba(245, 158, 11, 0.5); animation-delay: -3s; }

        @keyframes floatAnim {
          0% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) translateX(15px) scale(1.1); }
          100% { transform: translateY(20px) translateX(-15px) scale(0.95); }
        }

        /* ── Floating Absolute Top Controls ── */
        .top-theme-btn {
          position: absolute; top: 1.2rem; left: 1.5rem; z-index: 100;
          width: 44px; height: 44px; border-radius: 50%;
          background: var(--card-bg); border: 1px solid var(--card-border);
          color: var(--text-primary); cursor: pointer; display: flex; align-items: center; justify-content: center;
          box-shadow: var(--shadow); transition: all 0.2s ease;
        }
        .top-theme-btn:hover { transform: scale(1.08); border-color: var(--accent-blue); }

        .top-lang-select {
          position: absolute; top: 1.2rem; right: 1.5rem; z-index: 100;
          padding: 8px 16px; border-radius: 20px; border: 1px solid var(--card-border);
          background: var(--card-bg); color: var(--text-primary); font-family: inherit; font-size: 0.85rem; font-weight: 500;
          cursor: pointer; box-shadow: var(--shadow); outline: none; transition: all 0.2s ease;
        }
        .top-lang-select:hover { border-color: var(--accent-blue); }

        /* ── Centered Main Container Card ── */
        .app-window-wrapper {
          position: relative; z-index: 10; display: flex; align-items: center; justify-content: center;
          height: 100vh; width: 100vw; padding: 24px;
        }

        .main-container-card {
          width: 100%; max-width: 1100px; height: 88vh; max-height: 820px;
          background: var(--card-bg); border: 1px solid var(--card-border);
          border-radius: 16px; box-shadow: var(--shadow); display: flex; overflow: hidden;
        }

        /* ── Start Mission / Welcome View ── */
        .login-view-container {
          width: 100%; height: 100%; overflow-y: auto; padding: 32px 40px;
          display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
        }
        .login-view-container::-webkit-scrollbar { width: 4px; }
        .login-view-container::-webkit-scrollbar-thumb { background: var(--card-border); }

        .login-header h1 { font-family: 'Outfit', sans-serif; font-size: 26px; font-weight: 800; color: #3B82F6; margin-bottom: 6px; }
        .login-header p { font-size: 13.5px; color: var(--text-secondary); margin-bottom: 20px; }

        .login-tips { display: flex; flex-direction: column; gap: 8px; width: 100%; max-width: 480px; margin-bottom: 20px; }
        .tip-item {
          background: var(--input-bg); border: 1px solid var(--card-border); border-radius: 20px;
          padding: 10px 16px; font-size: 12.5px; color: var(--text-secondary); text-align: left;
        }

        .login-form-group { display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 480px; }

        .input-login {
          width: 100%; background: var(--card-bg); border: 1px solid var(--card-border);
          border-radius: 8px; padding: 11px 14px; font-size: 13.5px; color: var(--text-primary); outline: none;
        }
        .input-login:focus { border-color: var(--accent-blue); box-shadow: 0 0 0 3px var(--accent-glow); }

        .glow-start-btn {
          width: 100%; background: var(--card-bg); border: 1px solid var(--card-border);
          border-radius: 24px; padding: 11px 20px; font-size: 13.5px; font-weight: 600; color: #3B82F6;
          cursor: pointer; transition: all 0.2s ease; margin-top: 4px; box-shadow: var(--shadow);
        }
        .glow-start-btn:hover { border-color: #3B82F6; background: var(--accent-glow); transform: translateY(-1px); }

        /* ── Split Left & Right Columns ── */
        .chat-left-col { flex: 1.2; display: flex; flex-direction: column; border-right: 1px solid var(--card-border); background: var(--left-bg); height: 100%; }
        .context-tools-col { flex: 0.9; display: flex; flex-direction: column; background: var(--right-bg); height: 100%; overflow-y: auto; padding: 20px 24px; gap: 16px; }
        .context-tools-col::-webkit-scrollbar { width: 3px; }
        .context-tools-col::-webkit-scrollbar-thumb { background: var(--card-border); }

        /* ── Header Bar ── */
        .chat-header {
          padding: 14px 20px; border-bottom: 1px solid var(--card-border); background: var(--header-bg);
          display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
        }

        .codelab-title { display: flex; align-items: center; gap: 8px; }
        .codelab-title h2 { font-family: 'Space Grotesk', sans-serif; font-size: 14px; font-weight: 700; color: #3B82F6; }

        .header-controls { display: flex; align-items: center; gap: 8px; }
        .user-badge {
          background: transparent; border: 1px solid var(--accent-blue); color: #3B82F6;
          padding: 3px 10px; border-radius: 14px; font-size: 11px; font-weight: 600;
        }

        .text-btn {
          background: transparent; border: none; color: var(--text-secondary);
          font-size: 11px; font-weight: 500; cursor: pointer; padding: 4px 6px; transition: color 0.2s ease;
        }
        .text-btn:hover { color: var(--accent-blue); }

        /* ── Chat Messages Timeline ── */
        .chat-area { flex: 1; overflow-y: auto; padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; }
        .chat-area::-webkit-scrollbar { width: 4px; }
        .chat-area::-webkit-scrollbar-thumb { background: var(--card-border); }

        .msg-row { display: flex; gap: 10px; max-width: 90%; }
        .msg-row.assistant { align-self: flex-start; }
        .msg-row.user { align-self: flex-end; flex-direction: row-reverse; }

        .bot-avatar {
          width: 32px; height: 32px; border-radius: 50%; background: rgba(59, 130, 246, 0.15);
          display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0;
        }

        .msg-bubble {
          padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.5;
        }
        .msg-row.assistant .msg-bubble { background: var(--card-bg); border: 1px solid var(--card-border); color: var(--text-primary); border-radius: 4px 14px 14px 14px; }
        .msg-row.user .msg-bubble { background: var(--accent-blue); color: #FFF; border-radius: 14px 14px 4px 14px; }

        .msg-bubble .md-heading { font-weight: 700; font-size: 13px; color: var(--text-primary); margin: 6px 0 3px; }
        .msg-bubble .md-paragraph { margin-bottom: 4px; }
        .msg-bubble .md-list { margin: 4px 0 6px 14px; list-style: disc; }

        /* ── Suggestions Bar ── */
        .suggestions-container { padding: 8px 20px; display: flex; gap: 8px; overflow-x: auto; flex-shrink: 0; }
        .suggestions-container::-webkit-scrollbar { height: 2px; }

        .suggestion-chip {
          background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 16px;
          padding: 4px 12px; font-size: 11px; color: var(--text-secondary); cursor: pointer;
          white-space: nowrap; transition: all 0.2s ease; flex-shrink: 0;
        }
        .suggestion-chip:hover { border-color: var(--accent-blue); color: #3B82F6; background: var(--accent-glow); }

        /* ── Chat Footer Input Pill ── */
        .chat-footer { padding: 12px 20px 16px; flex-shrink: 0; }

        .input-pill {
          display: flex; align-items: center; gap: 8px; background: var(--input-bg);
          border: 1px solid var(--input-border); border-radius: 24px; padding: 6px 14px;
        }
        .input-pill:focus-within { border-color: var(--accent-blue); }

        .action-btn { background: transparent; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; }
        .action-btn:hover { color: var(--accent-blue); }

        .chat-input-textarea {
          flex: 1; background: transparent; border: none; outline: none;
          color: var(--text-primary); font-family: inherit; font-size: 13px; resize: none; max-height: 80px; padding: 4px 0;
        }

        .send-btn-round {
          background: var(--card-bg); border: 1px solid var(--card-border); color: var(--text-primary);
          width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s ease; flex-shrink: 0;
        }
        .send-btn-round:hover:not(:disabled) { border-color: var(--accent-blue); color: #3B82F6; background: var(--accent-glow); }
        .send-btn-round:disabled { opacity: 0.35; cursor: not-allowed; }

        /* ── Right Column IDE Context Panel ── */
        .context-title { font-family: 'Space Grotesk', sans-serif; font-size: 14px; font-weight: 700; color: #3B82F6; margin-bottom: 2px; }

        .context-section h4 { font-size: 11.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; }

        .context-input, .context-textarea {
          width: 100%; background: var(--card-bg); border: 1px solid var(--card-border);
          border-radius: 6px; padding: 8px 10px; font-size: 12px; color: var(--text-primary);
          outline: none; transition: border-color 0.2s ease;
        }
        .context-input:focus, .context-textarea:focus { border-color: var(--accent-blue); }

        .context-textarea { font-family: 'JetBrains Mono', monospace; font-size: 11px; resize: vertical; min-height: 60px; }
        .context-textarea.large { min-height: 110px; }

        .context-hint { font-size: 10.5px; color: var(--text-muted); line-height: 1.5; font-style: italic; }

        .toast {
          position: fixed; bottom: 20px; right: 20px; z-index: 200; background: var(--card-bg);
          border: 1px solid var(--card-border); color: var(--text-primary); padding: 8px 14px;
          border-radius: 8px; font-size: 12px; font-weight: 500; opacity: 0; transform: translateY(10px); transition: all 0.25s ease;
        }
        .toast-visible { opacity: 1; transform: translateY(0); }
      `}</style>

      {/* Floating Dot Grid & Nodes Background */}
      <div className="grid-background">
        <div className="floating-node node-blue" />
        <div className="floating-node node-yellow" />
        <div className="floating-node node-green" />
        <div className="floating-node node-red" />
        <div className="floating-node node-big-yellow" />
      </div>

      {/* Floating Sun/Moon Theme Toggle (Top Left) */}
      <button className="top-theme-btn" onClick={toggleTheme} title="Toggle Theme">
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>

      {/* Floating Language Selector (Top Right) */}
      <select className="top-lang-select" value={language} onChange={(e) => { setLanguage(e.target.value); showToast(`Language: ${e.target.value}`); }}>
        {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
      </select>

      <Toast message={toastMsg} visible={toastVisible} />

      {/* Centered Main Container Card */}
      <div className="app-window-wrapper">
        <div className="main-container-card">

          {/* VIEW 1: Start Mission / Startup Setup Screen */}
          {!sessionActive ? (
            <div className="login-view-container">
              <div className="login-header">
                <h1>Hacklabvify — AI Startup Copilot</h1>
                <p>Team CYBERNEX • Problem Statement 10: AI Startup Copilot & Strategic Growth Assistant</p>
              </div>

              <div className="login-tips">
                <div className="tip-item">🔍 <strong>Market Research</strong>: TAM/SAM/SOM breakdown & customer segments</div>
                <div className="tip-item">🏆 <strong>Competitor Analysis</strong>: Top 5 competitors & competitive moat definition</div>
                <div className="tip-item">💰 <strong>Pitch Deck Outline</strong>: 10-slide deck architecture & investor narrative</div>
                <div className="tip-item">📊 <strong>Runway Calculator</strong>: Burn rate analysis & financial runway optimization</div>
              </div>

              <form onSubmit={handleStartMission} className="login-form-group">
                <input
                  type="text"
                  className="input-login"
                  placeholder="What's your founder name?"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />

                <select
                  className="input-login"
                  value={startupName}
                  onChange={(e) => setStartupName(e.target.value)}
                >
                  <option value="" disabled>Select startup stage or demo profile...</option>
                  <option value="DevPulse AI">DevPulse AI (DevTools & AI • MVP Stage)</option>
                  <option value="MediMind">MediMind (HealthTech & AI • Idea Stage)</option>
                  <option value="PayFlow Global">PayFlow Global (FinTech • Revenue Stage)</option>
                </select>

                <button type="submit" className="glow-start-btn">Start Co-Founder Session</button>
              </form>

              <div style={{ marginTop: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {PRESET_STARTUPS.map((p) => (
                  <button key={p.name} className="suggestion-chip" onClick={() => handleApplyPreset(p)}>
                    🚀 {p.name} ({p.stage})
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* VIEW 2: Active Co-Founder Advisory Workspace */
            <>
              {/* Left Column: Advisory Chat */}
              <div className="chat-left-col">
                <header className="chat-header">
                  <div className="codelab-title">
                    <span style={{ color: '#3B82F6' }}>🔹</span>
                    <h2>{startupName || 'Hacklabvify | AI Startup Copilot'}</h2>
                  </div>

                  <div className="header-controls">
                    <span className="user-badge">Founder: {username}</span>
                    <button className="text-btn" onClick={handleClearSession}>Clear Session</button>
                    <button className="text-btn" onClick={handleLogout}>Main Page</button>
                    <button className="text-btn" onClick={() => setShowSettingsModal(true)} title="API Settings">⋮</button>
                  </div>
                </header>

                {/* Chat Messages Timeline */}
                <div className="chat-area">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`msg-row ${msg.role}`}>
                      {msg.role === 'assistant' && <BotAvatar />}
                      <div className="msg-bubble">
                        {msg.role === 'assistant' ? parseMarkdown(msg.content) : msg.content}
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="msg-row assistant">
                      <BotAvatar />
                      <div className="msg-bubble" style={{ color: 'var(--text-secondary)' }}>
                        AI Co-Founder analyzing startup strategy & context...
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Quick Strategy Suggestions */}
                <div className="suggestions-container">
                  {QUICK_SUGGESTIONS.map((s, i) => (
                    <button key={i} className="suggestion-chip" onClick={() => callGemini(s.prompt)} disabled={loading}>
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Input Footer Pill */}
                <footer className="chat-footer">
                  <div className="input-pill">
                    <label htmlFor="file-upload" className="action-btn" title="Add file context">
                      <PlusIcon />
                    </label>
                    <input type="file" id="file-upload" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} accept="image/*,.txt,.js,.py,.json,.md" />

                    <textarea
                      ref={textareaRef}
                      className="chat-input-textarea"
                      rows={1}
                      placeholder="Ask your AI co-founder anything (e.g., 'How do we lower CAC?')..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={loading}
                    />

                    <button className="send-btn-round" onClick={handleSend} disabled={!input.trim() || loading} title="Send Message">
                      <UpArrowIcon />
                    </button>
                  </div>

                  {attachedFile && (
                    <div style={{ marginTop: '6px', fontSize: '11px', color: '#3B82F6', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      📎 Attached Context: {attachedFile.name}
                      <button style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }} onClick={() => setAttachedFile(null)}>✕</button>
                    </div>
                  )}
                </footer>
              </div>

              {/* Right Column: IDE & Co-Founder Context Tooling */}
              <div className="context-tools-col">
                <h3 className="context-title">IDE Context Tooling</h3>

                <div className="context-section">
                  <h4>Paste Code & Architecture Context</h4>
                  <input
                    type="text"
                    className="context-input"
                    placeholder="Code Filename (e.g., App.jsx, schema.sql)"
                    value={codeFilename}
                    onChange={(e) => setCodeFilename(e.target.value)}
                  />
                  <textarea
                    className="context-textarea large"
                    style={{ marginTop: '8px' }}
                    placeholder="Paste your raw code buffer or architecture spec here..."
                    value={codeContext}
                    onChange={(e) => setCodeContext(e.target.value)}
                  />
                </div>

                <div className="context-section">
                  <h4>Terminal & Build Tracebacks</h4>
                  <textarea
                    className="context-textarea"
                    placeholder="Paste command line tracebacks, API errors, or build logs here..."
                    value={terminalErrors}
                    onChange={(e) => setTerminalErrors(e.target.value)}
                  />
                </div>

                <div className="context-section">
                  <h4>Financial Runway & Unit Economics</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Cash ($)</label>
                      <input type="number" className="context-input" value={cashBalance} onChange={(e) => setCashBalance(Number(e.target.value))} />
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Expenses ($/mo)</label>
                      <input type="number" className="context-input" value={monthlyExpenses} onChange={(e) => setMonthlyExpenses(Number(e.target.value))} />
                    </div>
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '11px', color: '#3B82F6', fontWeight: 600 }}>
                    Runway: {runwayMonths} Months | Net Burn: ${netBurn.toLocaleString()}/mo
                  </div>
                </div>

                <div className="context-hint">
                  <p>💡 <i>Any active Code, Terminal text, or Financial metrics entered here will be automatically extracted and bundled securely into your message when you hit the primary SEND button on the left!</i></p>
                  <p style={{ marginTop: '8px' }}>💡 <i>Standard startup questions, pitch deck inquiries, or market queries should be typed directly into the chat box!</i></p>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}