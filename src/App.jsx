import { useState, useRef, useEffect, useCallback } from 'react';
import InteractiveWaves from './components/ui/interactive-waves.jsx';
import { BorderBeam } from './components/ui/border-beam.jsx';

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

const INITIAL_PITCH_SLIDES = [
  { id: 1, title: '1. Problem', detail: 'Founders lack immediate, data-driven co-founder advisory for critical strategic decisions.' },
  { id: 2, title: '2. Solution', detail: 'FounderNexus: AI Co-Founder providing real-time market research, pitch outlines & financial runway modeling.' },
  { id: 3, title: '3. Market Size (TAM)', detail: 'TAM: $45B Global Startup Software Market | SAM: $8.2B Founder Tooling | SOM: $1.2B AI Copilots.' },
  { id: 4, title: '4. Product & Demo', detail: 'Dual-Column IDE Co-Founder Workspace, speech-to-text, live runway modeler & 1-click strategy playbooks.' },
  { id: 5, title: '5. Business Model', detail: 'B2B SaaS Tiered Subscriptions ($49/mo Pro, $199/mo Scale, Enterprise Custom API).' },
  { id: 6, title: '6. Competitive Moat', detail: 'Deep IDE context integration (Code + Terminal error tracebacks + live financial unit economics).' },
  { id: 7, title: '7. Go-To-Market', detail: 'Product-led growth, developer community viral loops, YC/Techstars accelerator partnerships.' },
  { id: 8, title: '8. Financial Projections', detail: 'ARR Growth: Year 1 $350k, Year 2 $1.8M, Year 3 $5.5M with 82% Gross Margins.' },
  { id: 9, title: '9. Team', detail: 'Team CYBERNEX — AI Engineers & Product Designers specialized in LLM Agent System Architectures.' },
  { id: 10, title: '10. The Ask', detail: 'Seeking $500k Pre-Seed to accelerate model fine-tuning, distribution partnerships & team expansion.' }
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

function MicIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? "#EF4444" : "none"} stroke={active ? "#EF4444" : "currentColor"} strokeWidth="2">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
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
  const [activeRightTab, setActiveRightTab] = useState('ide'); // 'ide' | 'financials' | 'pitch'
  const [showGuideBanner, setShowGuideBanner] = useState(true);

  // IDE Context Buffer states
  const [codeFilename, setCodeFilename] = useState('');
  const [codeContext, setCodeContext] = useState('');
  const [terminalErrors, setTerminalErrors] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);

  // Pitch Deck Builder state
  const [pitchSlides, setPitchSlides] = useState(() => {
    try {
      const saved = localStorage.getItem('hv_pitch_slides');
      return saved ? JSON.parse(saved) : INITIAL_PITCH_SLIDES;
    } catch { return INITIAL_PITCH_SLIDES; }
  });

  // Financial Runway Modeler states
  const [cashBalance, setCashBalance] = useState(() => Number(localStorage.getItem('hv_cash')) || 120000);
  const [monthlyExpenses, setMonthlyExpenses] = useState(() => Number(localStorage.getItem('hv_expenses')) || 15000);
  const [monthlyRevenue, setMonthlyRevenue] = useState(() => Number(localStorage.getItem('hv_revenue')) || 4000);

  // Chat Messages & Insights state
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('hv_messages');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [savedInsights, setSavedInsights] = useState(() => {
    try {
      const saved = localStorage.getItem('hv_savedInsights');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(customApiKey);
  const [isListening, setIsListening] = useState(false);

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
  useEffect(() => { localStorage.setItem('hv_savedInsights', JSON.stringify(savedInsights)); }, [savedInsights]);
  useEffect(() => { localStorage.setItem('hv_pitch_slides', JSON.stringify(pitchSlides)); }, [pitchSlides]);
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

  const systemContext = `You are FounderNexus AI Startup Copilot (Problem Statement 10 by Team CYBERNEX). ${activePersonaObj.desc}. Respond in ${language}. Founder: "${username}", Startup: "${startupName || 'DevPulse AI'}" (${stage} stage). Provide sharp, founder-level strategic advice. Format with bold terms, ## headers, and bullet points. Conclude with ## ⚡ Your Next 3 Actions. Keep response under 350 words.`;

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

  const handleLaunchWithPrompt = (initialPrompt) => {
    const chosenUser = username.trim() || 'Rohil Kohli';
    const chosenStartup = startupName.trim() || 'DevPulse AI';
    setUsername(chosenUser);
    setStartupName(chosenStartup);
    setSessionActive(true);
    callGemini(initialPrompt);
    showToast('Session launched!');
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

  const handleCopyMessage = (content) => {
    navigator.clipboard.writeText(content);
    showToast('Copied to clipboard');
  };

  const handleBookmarkMessage = (content) => {
    const snippet = content.slice(0, 120) + (content.length > 120 ? '…' : '');
    setSavedInsights((prev) => [{ id: Date.now(), snippet, full: content, ts: Date.now() }, ...prev]);
    showToast('Insight bookmarked');
  };

  const handleDeleteBookmark = (id) => {
    setSavedInsights((prev) => prev.filter((i) => i.id !== id));
    showToast('Bookmark removed');
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

  const handleExportSession = (format = 'txt') => {
    let text = '';
    let mimeType = 'text/plain';
    let ext = 'txt';

    if (format === 'json') {
      text = JSON.stringify({ startup: { name: startupName, stage }, persona, language, messages, savedInsights, pitchSlides }, null, 2);
      mimeType = 'application/json';
      ext = 'json';
    } else if (format === 'md') {
      text = `# ${startupName || 'Startup'} - AI Co-Founder Strategy Session\n\n**Founder**: ${username} | **Stage**: ${stage} | **Persona**: ${activePersonaObj.name}\n\n` +
        messages.map((m) => `### ${m.role.toUpperCase()}\n${m.content}`).join('\n\n---\n\n');
      ext = 'md';
    } else {
      text = messages.map((m) => `[${m.role.toUpperCase()}]\n${m.content}`).join('\n\n---\n\n');
    }

    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(startupName || 'foundernexus').replace(/\s+/g, '-')}-copilot.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported as .${ext}`);
  };

  // Voice Input Speech Recognition
  const toggleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Speech recognition not supported in browser');
      return;
    }
    if (isListening) {
      setIsListening(false);
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.onstart = () => { setIsListening(true); showToast('Listening... Speak now'); };
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => { setIsListening(false); showToast('Voice error'); };
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Load sample code helper
  const handleLoadSampleCode = () => {
    setCodeFilename('App.jsx');
    setCodeContext(`// Sample React Component for ${startupName || 'DevPulse AI'}
import React, { useState } from 'react';

export default function PRScanner() {
  const [prUrl, setPrUrl] = useState('');
  return (
    <div className="p-4 bg-slate-900 text-white rounded-lg">
      <h2 className="text-xl font-bold">Automated PR Security Scanner</h2>
      <input value={prUrl} onChange={(e) => setPrUrl(e.target.value)} placeholder="https://github.com/org/repo/pull/1" className="p-2 border rounded text-black" />
    </div>
  );
}`);
    showToast('Loaded sample code buffer');
  };

  // Load sample error traceback helper
  const handleLoadSampleError = () => {
    setTerminalErrors(`Error [Vite]: Internal server error in src/App.jsx:12:45
Uncaught SyntaxError: Unexpected token 'export' (at App.jsx:12:45)
  10 |   const [state, setState] = useState(null);
  11 |   
> 12 |   export default function MainApp() {
     |   ^^^^^^
  13 |     return <div>Header</div>
  14 |   }`);
    showToast('Loaded sample terminal traceback');
  };

  // Quick Action Triggers for Code & Terminal buffers
  const handleRunCodeAudit = () => {
    if (!codeContext.trim()) {
      showToast('Paste or load code into buffer first');
      return;
    }
    callGemini(`Perform a comprehensive security, performance, and code cleanliness audit on this code buffer (${codeFilename || 'code'}):`);
  };

  const handleRunCodeRefactor = () => {
    if (!codeContext.trim()) {
      showToast('Paste or load code into buffer first');
      return;
    }
    callGemini(`Refactor and optimize this code buffer (${codeFilename || 'code'}) for maximum performance and clean design patterns:`);
  };

  const handleRunErrorDiagnosis = () => {
    if (!terminalErrors.trim()) {
      showToast('Paste or load terminal traceback first');
      return;
    }
    callGemini(`Analyze the root cause and provide the exact step-by-step code fix for this terminal error traceback:`);
  };

  // Financial calculations
  const netBurn = Math.max(0, monthlyExpenses - monthlyRevenue);
  const runwayMonths = netBurn > 0 ? (cashBalance / netBurn).toFixed(1) : '∞';
  const runwayNum = Number(runwayMonths) || 0;
  const gaugePercent = netBurn === 0 ? 100 : Math.min(100, Math.max(5, (runwayNum / 24) * 100));

  const getGaugeColor = () => {
    if (netBurn === 0 || runwayNum >= 12) return '#10B981'; // Green
    if (runwayNum >= 6) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const handleAskFinancialOptimization = () => {
    const prompt = `Analyze financial runway for ${startupName || 'our startup'}. Cash: $${cashBalance.toLocaleString()}, Expenses: $${monthlyExpenses.toLocaleString()}/mo, Revenue: $${monthlyRevenue.toLocaleString()}/mo. Net Burn: $${netBurn.toLocaleString()}/mo, Runway: ${runwayMonths} months. Provide ## Runway Analysis, ## Top 3 Cost Reduction Strategies, ## Revenue Acceleration Tactics, and ## ⚡ Your Next 3 Actions.`;
    callGemini(prompt);
  };

  // Update pitch slide helper
  const handleUpdateSlideDetail = (id, newDetail) => {
    setPitchSlides((prev) => prev.map((s) => s.id === id ? { ...s, detail: newDetail } : s));
  };

  return (
    <div className={`app-root theme-${theme}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Dark Theme Variables ── */
        .theme-dark {
          --bg-dot: #121824;
          --dot-color: rgba(255, 255, 255, 0.08);
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
          --wave-line-color: rgba(56, 189, 248, 0.2);
          --wave-glow-color: rgba(37, 99, 235, 0.18);
        }

        /* ── Light Theme Liquid Glass Variables ── */
        .theme-light {
          --bg-dot: #F1F5F9;
          --dot-color: rgba(71, 85, 105, 0.25);
          --grid-line-color: rgba(203, 213, 225, 0.5);
          --card-bg: rgba(255, 255, 255, 0.64);
          --card-border: rgba(255, 255, 255, 0.95);
          --left-bg: rgba(255, 255, 255, 0.58);
          --right-bg: rgba(248, 250, 252, 0.48);
          --header-bg: rgba(241, 245, 249, 0.72);
          --text-primary: #0F172A;
          --text-secondary: #475569;
          --text-muted: #94A3B8;
          --input-bg: rgba(255, 255, 255, 0.82);
          --input-border: rgba(203, 213, 225, 0.75);
          --accent-blue: #2563EB;
          --accent-glow: rgba(37, 99, 235, 0.15);
          --btn-hover: #1D4ED8;
          --code-bg: rgba(248, 250, 252, 0.9);
          --shadow: 0 30px 60px -12px rgba(15, 23, 42, 0.12), 0 18px 36px -18px rgba(0, 0, 0, 0.08), inset 0 1px 1px 0 rgba(255, 255, 255, 0.95);
          --wave-line-color: rgba(37, 99, 235, 0.16);
          --wave-glow-color: rgba(14, 165, 233, 0.16);
        }

        html, body, #root, .app-root { height: 100%; overflow: hidden; }
        body { font-family: 'Inter', sans-serif; background: var(--bg-dot); color: var(--text-primary); transition: all 0.3s ease; }

        /* ── Clean Liquid Glass Background with Floating Nodes ── */
        .grid-background {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-color: var(--bg-dot);
        }

        .grid-background::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.35), transparent 40%),
            radial-gradient(circle at 80% 25%, rgba(139, 92, 246, 0.3), transparent 38%),
            radial-gradient(circle at 70% 80%, rgba(245, 158, 11, 0.25), transparent 35%),
            radial-gradient(circle at 30% 75%, rgba(16, 185, 129, 0.25), transparent 35%);
          filter: blur(40px);
        }

        .waves-container {
          position: absolute;
          inset: 0;
          z-index: 1;
          opacity: 0.95;
          mix-blend-mode: screen;
        }

        .theme-light .waves-container {
          opacity: 0.85;
          mix-blend-mode: multiply;
        }

        .waves-container canvas {
          width: 100%;
          height: 100%;
          display: block;
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
          box-shadow: var(--shadow); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); transition: all 0.2s ease;
        }
        .top-theme-btn:hover { transform: scale(1.08); border-color: var(--accent-blue); }

        .top-lang-select {
          position: absolute; top: 1.2rem; right: 1.5rem; z-index: 100;
          padding: 8px 16px; border-radius: 20px; border: 1px solid var(--card-border);
          background: var(--card-bg); color: var(--text-primary); font-family: inherit; font-size: 0.85rem; font-weight: 500;
          cursor: pointer; box-shadow: var(--shadow); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); outline: none; transition: all 0.2s ease;
        }
        .top-lang-select:hover { border-color: var(--accent-blue); }

        /* ── Centered Main Container Card & True Liquid Glass ── */
        .app-window-wrapper {
          position: relative; z-index: 10; display: flex; align-items: center; justify-content: center;
          height: 100vh; width: 100vw; padding: 24px;
        }

        .main-container-card {
          width: 100%; max-width: 1100px; height: 88vh; max-height: 820px;
          border-radius: 24px; display: flex; overflow: hidden;
          position: relative; z-index: 10;
          transform: translateZ(0);
          will-change: backdrop-filter, -webkit-backdrop-filter;
          transition: all 0.3s ease;
        }

        /* Dark Theme Reduced Opacity Liquid Glass */
        .theme-dark .main-container-card {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.45) 0%, rgba(30, 41, 59, 0.35) 100%);
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow: 0 35px 80px -15px rgba(0, 0, 0, 0.7), inset 0 1px 1px 0 rgba(255, 255, 255, 0.22);
          -webkit-backdrop-filter: blur(24px) saturate(190%);
          backdrop-filter: blur(24px) saturate(190%);
        }

        .theme-dark .context-section {
          background: rgba(30, 41, 59, 0.45);
          -webkit-backdrop-filter: blur(10px);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .theme-dark .msg-row.assistant .msg-bubble {
          background: rgba(30, 41, 59, 0.5);
          -webkit-backdrop-filter: blur(10px);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.14);
        }

        /* Light Theme Backdrop Glass Effect */
        .theme-light .main-container-card {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.52) 0%, rgba(255, 255, 255, 0.32) 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.95);
          box-shadow: 
            0 30px 70px -12px rgba(15, 23, 42, 0.12),
            inset 0 1px 2px 0 rgba(255, 255, 255, 0.98),
            inset 0 -1px 1px 0 rgba(0, 0, 0, 0.03);
          backdrop-filter: blur(20px) saturate(200%);
          -webkit-backdrop-filter: blur(20px) saturate(200%);
        }

        .theme-light .context-section {
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.85);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.03);
        }

        .theme-light .msg-row.assistant .msg-bubble {
          background: rgba(255, 255, 255, 0.65);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
        }

        /* ── Start Mission / Welcome View ── */
        .login-view-container {
          width: 100%; height: 100%; overflow-y: auto; padding: 32px 40px;
          display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
          background: transparent;
        }
        .login-view-container::-webkit-scrollbar { width: 4px; }
        .login-view-container::-webkit-scrollbar-thumb { background: var(--card-border); }

        .login-header h1 { font-family: 'Outfit', sans-serif; font-size: 26px; font-weight: 800; color: #3B82F6; margin-bottom: 6px; }
        .login-header p { font-size: 13.5px; color: var(--text-secondary); margin-bottom: 20px; }

        .login-tips { display: flex; flex-direction: column; gap: 8px; width: 100%; max-width: 480px; margin-bottom: 20px; }
        .tip-item {
          background: var(--input-bg); border: 1px solid var(--card-border); border-radius: 16px;
          padding: 10px 16px; font-size: 12.5px; color: var(--text-secondary); text-align: left;
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
        }
        .tip-btn {
          width: 100%; cursor: pointer; transition: all 0.2s ease; font-family: inherit;
        }
        .tip-btn:hover { border-color: #3B82F6; background: var(--accent-glow); color: var(--text-primary); transform: translateY(-1px); }

        .login-form-group { display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 480px; }

        .input-login {
          width: 100%; background: var(--input-bg); border: 1px solid var(--card-border);
          border-radius: 12px; padding: 11px 14px; font-size: 13.5px; color: var(--text-primary); outline: none;
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
        }
        .input-login:focus { border-color: var(--accent-blue); box-shadow: 0 0 0 3px var(--accent-glow); }
        .input-login option { background: var(--card-bg); color: var(--text-primary); }

        .glow-start-btn {
          width: 100%; background: var(--card-bg); border: 1px solid var(--card-border);
          border-radius: 24px; padding: 11px 20px; font-size: 13.5px; font-weight: 600; color: #3B82F6;
          cursor: pointer; transition: all 0.2s ease; margin-top: 4px; box-shadow: var(--shadow);
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
        }
        .glow-start-btn:hover { border-color: #3B82F6; background: var(--accent-glow); transform: translateY(-1px); }

        /* ── Split Left & Right Columns ── */
        .chat-left-col { flex: 1.2; display: flex; flex-direction: column; border-right: 1px solid var(--card-border); background: transparent; height: 100%; }
        .context-tools-col { flex: 0.9; display: flex; flex-direction: column; background: transparent; height: 100%; overflow-y: auto; padding: 16px 18px; gap: 12px; }
        .context-tools-col::-webkit-scrollbar { width: 3px; }
        .context-tools-col::-webkit-scrollbar-thumb { background: var(--card-border); }

        .context-section {
          background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 16px; padding: 12px 14px;
        }

        /* ── Right Panel Category Tabs ── */
        .right-tab-bar {
          display: flex; gap: 4px; background: var(--input-bg); padding: 4px; border-radius: 14px; border: 1px solid var(--card-border);
        }
        .right-tab-btn {
          flex: 1; background: transparent; border: none; padding: 6px 4px; border-radius: 10px;
          font-size: 10.5px; font-weight: 600; color: var(--text-secondary); cursor: pointer; transition: all 0.2s ease; text-align: center;
        }
        .right-tab-btn.active { background: var(--card-bg); color: #3B82F6; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }

        /* ── Guided Onboarding Banner ── */
        .guide-banner {
          background: var(--input-bg); border: 1px solid var(--card-border); border-radius: 14px;
          padding: 10px 14px; margin-bottom: 12px; font-size: 11.5px;
        }

        /* ── Header Bar & Metric Badges ── */
        .chat-header {
          padding: 12px 20px; border-bottom: 1px solid var(--card-border); background: var(--header-bg);
          display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
        }

        .codelab-title { display: flex; align-items: center; gap: 8px; }
        .codelab-title h2 { font-family: 'Space Grotesk', sans-serif; font-size: 14px; font-weight: 700; color: #3B82F6; }

        .header-metric-badge {
          background: var(--card-bg); border: 1px solid var(--card-border); color: var(--text-secondary);
          font-size: 10px; font-weight: 600; padding: 3px 10px; border-radius: 12px; display: flex; align-items: center; gap: 4px;
        }

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
        .chat-area { flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 14px; }
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
          padding: 10px 14px; border-radius: 16px; font-size: 13px; line-height: 1.5;
        }
        .msg-row.assistant .msg-bubble { background: var(--card-bg); border: 1px solid var(--card-border); color: var(--text-primary); border-radius: 6px 18px 18px 18px; }
        .msg-row.user .msg-bubble { background: var(--accent-blue); color: #FFF; border-radius: 18px 18px 6px 18px; }

        .msg-bubble .md-heading { font-weight: 700; font-size: 13px; color: var(--text-primary); margin: 6px 0 3px; }
        .msg-bubble .md-paragraph { margin-bottom: 4px; }
        .msg-bubble .md-list { margin: 4px 0 6px 14px; list-style: disc; }

        .msg-actions { display: flex; gap: 4px; margin-top: 4px; }
        .msg-action-btn {
          background: transparent; border: 1px solid var(--card-border); color: var(--text-muted);
          border-radius: 8px; padding: 2px 8px; font-size: 9.5px; cursor: pointer; transition: all 0.2s ease;
        }
        .msg-action-btn:hover { color: #3B82F6; border-color: #3B82F6; }

        /* ── Suggestions Bar ── */
        .suggestions-container { padding: 8px 20px; display: flex; gap: 8px; overflow-x: auto; flex-shrink: 0; }
        .suggestions-container::-webkit-scrollbar { height: 2px; }

        .suggestion-chip {
          background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 18px;
          padding: 5px 14px; font-size: 11px; color: var(--text-secondary); cursor: pointer;
          white-space: nowrap; transition: all 0.2s ease; flex-shrink: 0;
        }
        .suggestion-chip:hover { border-color: var(--accent-blue); color: #3B82F6; background: var(--accent-glow); }

        /* ── Chat Footer Input Pill ── */
        .chat-footer { padding: 12px 20px 16px; flex-shrink: 0; }

        .input-pill {
          display: flex; align-items: center; gap: 8px; background: var(--input-bg);
          border: 1px solid var(--input-border); border-radius: 28px; padding: 6px 14px;
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

        .context-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
        .context-section-header h4 { font-size: 11.5px; font-weight: 600; color: var(--text-secondary); }

        .mini-link-btn {
          background: transparent; border: none; color: #3B82F6; font-size: 10px; cursor: pointer; font-weight: 500;
        }
        .mini-link-btn:hover { text-decoration: underline; }

        .context-input, .context-textarea {
          width: 100%; background: var(--input-bg); border: 1px solid var(--card-border);
          border-radius: 10px; padding: 8px 12px; font-size: 12px; color: var(--text-primary);
          outline: none; transition: border-color 0.2s ease;
        }
        .context-input:focus, .context-textarea:focus { border-color: var(--accent-blue); }

        .context-textarea { font-family: 'JetBrains Mono', monospace; font-size: 11px; resize: vertical; min-height: 55px; }
        .context-textarea.large { min-height: 90px; }

        .quick-trigger-group { display: flex; gap: 4px; margin-top: 6px; }
        .btn-trigger-chip {
          background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 8px;
          padding: 4px 8px; font-size: 10px; font-weight: 500; color: var(--text-secondary); cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-trigger-chip:hover { border-color: #3B82F6; color: #3B82F6; }

        /* ── Visual Gauge Bar & TAM Pyramid ── */
        .gauge-bar-outer {
          width: 100%; height: 8px; background: var(--input-bg); border-radius: 6px; overflow: hidden; margin-top: 6px;
        }
        .gauge-bar-inner { height: 100%; border-radius: 6px; transition: width 0.4s ease, background-color 0.4s ease; }

        .tam-pyramid { display: flex; flex-direction: column; gap: 4px; margin-top: 6px; }
        .tam-layer {
          border-radius: 10px; padding: 5px 10px; font-size: 10px; font-weight: 600; text-align: center;
        }
        .tam-layer-1 { background: rgba(59, 130, 246, 0.15); color: #3B82F6; border: 1px solid rgba(59, 130, 246, 0.3); }
        .tam-layer-2 { background: rgba(16, 185, 129, 0.15); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.3); width: 85%; align-self: center; }
        .tam-layer-3 { background: rgba(245, 158, 11, 0.15); color: #F59E0B; border: 1px solid rgba(245, 158, 11, 0.3); width: 68%; align-self: center; }

        /* ── Pitch Slide Card ── */
        .slide-card-item {
          background: var(--input-bg); border: 1px solid var(--card-border); border-radius: 10px; padding: 8px 10px; margin-bottom: 6px;
        }
        .slide-card-title { font-size: 11px; font-weight: 700; color: #3B82F6; }
        .slide-card-detail { font-size: 10.5px; color: var(--text-secondary); margin-top: 2px; line-height: 1.3; }

        .persona-chip-group { display: flex; gap: 6px; }
        .persona-chip {
          flex: 1; background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px;
          padding: 7px 8px; font-size: 10.5px; font-weight: 600; color: var(--text-secondary); text-align: center;
          cursor: pointer; transition: all 0.2s ease;
        }
        .persona-chip.active { border-color: #3B82F6; color: #3B82F6; background: var(--accent-glow); }

        .modal-overlay {
          position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.65);
          backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .modal-content {
          background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 20px;
          width: 100%; max-width: 440px; padding: 22px; display: flex; flex-direction: column; gap: 14px; box-shadow: var(--shadow);
        }

        .toast {
          position: fixed; bottom: 20px; right: 20px; z-index: 300; background: var(--card-bg);
          border: 1px solid var(--card-border); color: var(--text-primary); padding: 8px 14px;
          border-radius: 12px; font-size: 12px; font-weight: 500; opacity: 0; transform: translateY(10px); transition: all 0.25s ease;
        }
        .toast-visible { opacity: 1; transform: translateY(0); }
      `}</style>

      {/* Floating Dot Grid & Nodes Background */}
      <div className="grid-background">
        <InteractiveWaves />
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

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontFamily: 'Space Grotesk', fontSize: '16px', fontWeight: 700 }}>🔑 Gemini API Key Settings</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Enter a custom Google Gemini API Key if you wish to override default key configuration. Stored locally in your browser.
            </div>
            <div className="login-form-group">
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>API Key</label>
              <input type="password" className="input-login" placeholder="AIzaSy..." value={tempApiKey} onChange={(e) => setTempApiKey(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="text-btn" onClick={() => { setCustomApiKey(''); setTempApiKey(''); setShowSettingsModal(false); showToast('Key cleared'); }}>Clear Key</button>
              <button className="glow-start-btn" style={{ width: 'auto', padding: '6px 16px' }} onClick={() => { setCustomApiKey(tempApiKey.trim()); setShowSettingsModal(false); showToast(tempApiKey.trim() ? 'Key saved' : 'Using default'); }}>Save Settings</button>
            </div>
          </div>
        </div>
      )}

      {/* Centered Main Container Card */}
      <div className="app-window-wrapper">
        <div className="main-container-card">

          {/* VIEW 1: Start Mission / Startup Setup Screen */}
          {!sessionActive ? (
            <div className="login-view-container">
              <div className="login-header">
                <h1>FounderNexus — AI Startup Copilot</h1>
                <p>Team CYBERNEX • Problem Statement 10: AI Startup Copilot & Strategic Growth Assistant</p>
              </div>

              <div className="login-tips">
                <button type="button" className="tip-item tip-btn" onClick={() => handleLaunchWithPrompt('Give me a comprehensive Market Research overview (TAM/SAM/SOM, trends, target customer segments).')}>
                  🔍 <strong>Market Research</strong>: TAM/SAM/SOM breakdown & customer segments
                </button>
                <button type="button" className="tip-item tip-btn" onClick={() => handleLaunchWithPrompt('Analyze the top 5 competitors, key differentiators, and our competitive moat.')}>
                  🏆 <strong>Competitor Analysis</strong>: Top 5 competitors & competitive moat definition
                </button>
                <button type="button" className="tip-item tip-btn" onClick={() => handleLaunchWithPrompt('Create a complete 10-slide pitch deck outline with slide titles and key bullet points.')}>
                  💰 <strong>Pitch Deck Outline</strong>: 10-slide deck architecture & investor narrative
                </button>
                <button type="button" className="tip-item tip-btn" onClick={() => handleLaunchWithPrompt('Analyze our unit economics, CAC/LTV, burn rate, and runway optimization strategies.')}>
                  📊 <strong>Runway Calculator</strong>: Burn rate analysis & financial runway optimization
                </button>
              </div>

              <form onSubmit={handleStartMission} className="login-form-group">
                <BorderBeam borderRadius="12px" duration={8} colorFrom="#3B82F6" colorTo="#10B981">
                  <input
                    type="text"
                    className="input-login"
                    placeholder="What's your founder name?"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </BorderBeam>

                <BorderBeam borderRadius="12px" duration={8} colorFrom="#8B5CF6" colorTo="#EC4899">
                  <input
                    type="text"
                    className="input-login"
                    placeholder="What's your startup name? (e.g., Acme AI)"
                    value={startupName}
                    onChange={(e) => setStartupName(e.target.value)}
                    required
                  />
                </BorderBeam>

                <BorderBeam borderRadius="12px" duration={8} colorFrom="#F59E0B" colorTo="#3B82F6">
                  <select
                    className="input-login"
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                  >
                    {STAGE_OPTIONS.map((st) => (
                      <option key={st} value={st}>{st} Stage</option>
                    ))}
                  </select>
                </BorderBeam>

                <BorderBeam borderRadius="24px" duration={6} colorFrom="#3B82F6" colorTo="#10B981">
                  <button type="submit" className="glow-start-btn" style={{ margin: 0 }}>Start Co-Founder Session</button>
                </BorderBeam>
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
                    <h2>{startupName || 'FounderNexus | AI Startup Copilot'}</h2>
                  </div>

                  {/* Header Live Metric Badges */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span className="header-metric-badge" style={{ color: getGaugeColor() }}>
                      Runway: {runwayMonths} Mo
                    </span>
                    <span className="header-metric-badge">
                      Burn: ${netBurn.toLocaleString()}/mo
                    </span>
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
                  {/* Guided Onboarding Banner */}
                  {showGuideBanner && (
                    <div className="guide-banner">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <strong style={{ color: '#3B82F6' }}>💡 Quick Guide to FounderNexus:</strong>
                        <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px' }} onClick={() => setShowGuideBanner(false)}>✕ Dismiss</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        <div>1️⃣ <strong>Choose Tone</strong> or click a Strategy Playbook chip below.</div>
                        <div>2️⃣ <strong>(Optional) Paste Code</strong> or Errors in right panel tabs.</div>
                        <div>3️⃣ <strong>Type Question</strong> & click Send to receive AI founder advice!</div>
                      </div>
                    </div>
                  )}

                  {messages.map((msg, idx) => (
                    <div key={idx} className={`msg-row ${msg.role}`}>
                      {msg.role === 'assistant' && <BotAvatar />}
                      <div>
                        <div className="msg-bubble">
                          {msg.role === 'assistant' ? parseMarkdown(msg.content) : msg.content}
                        </div>
                        {msg.role === 'assistant' && (
                          <div className="msg-actions">
                            <button className="msg-action-btn" onClick={() => handleCopyMessage(msg.content)}>Copy</button>
                            <button className="msg-action-btn" onClick={() => handleBookmarkMessage(msg.content)}>Bookmark</button>
                          </div>
                        )}
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
                  <BorderBeam borderRadius="28px" duration={6} colorFrom="#3B82F6" colorTo="#10B981">
                    <div className="input-pill">
                      <label htmlFor="file-upload" className="action-btn" title="Add file context">
                        <PlusIcon />
                      </label>
                      <input type="file" id="file-upload" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} accept="image/*,.txt,.js,.py,.json,.md" />

                      <button className="action-btn" onClick={toggleVoiceInput} title="Voice dictation">
                        <MicIcon active={isListening} />
                      </button>

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
                  </BorderBeam>

                  {attachedFile && (
                    <div style={{ marginTop: '6px', fontSize: '11px', color: '#3B82F6', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      📎 Attached Context: {attachedFile.name}
                      <button style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }} onClick={() => setAttachedFile(null)}>✕</button>
                    </div>
                  )}
                </footer>
              </div>

              {/* Right Column: Clean Tabbed IDE & Tooling Panel */}
              <div className="context-tools-col">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 className="context-title">Co-Founder Tooling</h3>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="mini-link-btn" onClick={() => handleExportSession('txt')}>TXT</button>
                    <button className="mini-link-btn" onClick={() => handleExportSession('md')}>MD</button>
                    <button className="mini-link-btn" onClick={() => handleExportSession('json')}>JSON</button>
                  </div>
                </div>

                {/* Always-Visible Advisor Persona Switcher */}
                <div>
                  <div className="persona-chip-group">
                    {ADVISOR_PERSONAS.map((p) => (
                      <div key={p.id} className={`persona-chip ${persona === p.id ? 'active' : ''}`} onClick={() => { setPersona(p.id); showToast(`Tone: ${p.name}`); }}>
                        {p.icon} {p.name}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Category Tabs Bar */}
                <div className="right-tab-bar">
                  <button className={`right-tab-btn ${activeRightTab === 'ide' ? 'active' : ''}`} onClick={() => setActiveRightTab('ide')}>
                    🛠️ Code & Error
                  </button>
                  <button className={`right-tab-btn ${activeRightTab === 'financials' ? 'active' : ''}`} onClick={() => setActiveRightTab('financials')}>
                    📊 Financials & Market
                  </button>
                  <button className={`right-tab-btn ${activeRightTab === 'pitch' ? 'active' : ''}`} onClick={() => setActiveRightTab('pitch')}>
                    🎴 Pitch & Saved
                  </button>
                </div>

                {/* TAB 1: IDE Code & Terminal Fixer */}
                {activeRightTab === 'ide' && (
                  <>
                    <div className="context-section">
                      <div className="context-section-header">
                        <h4>Paste Code Buffer</h4>
                        <div>
                          <button className="mini-link-btn" onClick={handleLoadSampleCode}>Sample</button>
                          {codeContext && <button className="mini-link-btn" style={{ marginLeft: '6px', color: '#EF4444' }} onClick={() => setCodeContext('')}>Clear</button>}
                        </div>
                      </div>
                      <input
                        type="text"
                        className="context-input"
                        placeholder="Filename (e.g., App.jsx, schema.sql)"
                        value={codeFilename}
                        onChange={(e) => setCodeFilename(e.target.value)}
                      />
                      <BorderBeam borderRadius="10px" duration={10} colorFrom="#3B82F6" colorTo="#F59E0B" style={{ marginTop: '6px' }}>
                        <textarea
                          className="context-textarea large"
                          placeholder="Paste code snippet to include in AI analysis..."
                          value={codeContext}
                          onChange={(e) => setCodeContext(e.target.value)}
                        />
                      </BorderBeam>
                      <div className="quick-trigger-group">
                        <button className="btn-trigger-chip" onClick={handleRunCodeAudit}>🔍 Audit Code</button>
                        <button className="btn-trigger-chip" onClick={handleRunCodeRefactor}>⚡ Refactor Code</button>
                      </div>
                    </div>

                    <div className="context-section">
                      <div className="context-section-header">
                        <h4>Terminal Errors & Tracebacks</h4>
                        <div>
                          <button className="mini-link-btn" onClick={handleLoadSampleError}>Sample</button>
                          {terminalErrors && <button className="mini-link-btn" style={{ marginLeft: '6px', color: '#EF4444' }} onClick={() => setTerminalErrors('')}>Clear</button>}
                        </div>
                      </div>
                      <BorderBeam borderRadius="10px" duration={10} colorFrom="#EF4444" colorTo="#F59E0B">
                        <textarea
                          className="context-textarea"
                          placeholder="Paste CLI build errors or stack tracebacks..."
                          value={terminalErrors}
                          onChange={(e) => setTerminalErrors(e.target.value)}
                        />
                      </BorderBeam>
                      <div className="quick-trigger-group">
                        <button className="btn-trigger-chip" onClick={handleRunErrorDiagnosis}>🛠️ Auto-Fix Terminal Error</button>
                      </div>
                    </div>
                  </>
                )}

                {/* TAB 2: Financials & Market Modelers */}
                {activeRightTab === 'financials' && (
                  <>
                    <div className="context-section">
                      <div className="context-section-header">
                        <h4>Financial Runway Calculator</h4>
                        <button className="mini-link-btn" onClick={handleAskFinancialOptimization}>⚡ AI Optimize</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Cash ($)</label>
                          <input type="number" className="context-input" value={cashBalance} onChange={(e) => setCashBalance(Number(e.target.value))} />
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Expenses ($/mo)</label>
                          <input type="number" className="context-input" value={monthlyExpenses} onChange={(e) => setMonthlyExpenses(Number(e.target.value))} />
                        </div>
                      </div>
                      
                      <div className="gauge-bar-outer">
                        <div className="gauge-bar-inner" style={{ width: `${gaugePercent}%`, backgroundColor: getGaugeColor() }} />
                      </div>

                      <div style={{ marginTop: '4px', fontSize: '11px', color: getGaugeColor(), fontWeight: 600 }}>
                        Runway: {runwayMonths} Months | Net Burn: ${netBurn.toLocaleString()}/mo
                      </div>
                    </div>

                    <div className="context-section">
                      <div className="context-section-header">
                        <h4>TAM / SAM / SOM Market Diagram</h4>
                      </div>
                      <div className="tam-pyramid">
                        <div className="tam-layer tam-layer-1">TAM: $45.0B Global Market</div>
                        <div className="tam-layer tam-layer-2">SAM: $8.2B Founder Tooling</div>
                        <div className="tam-layer tam-layer-3">SOM: $1.2B Target Copilots</div>
                      </div>
                    </div>
                  </>
                )}

                {/* TAB 3: Pitch Deck & Saved Insights */}
                {activeRightTab === 'pitch' && (
                  <>
                    <div className="context-section">
                      <div className="context-section-header">
                        <h4>10-Slide Pitch Deck Builder</h4>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
                        {pitchSlides.map((slide) => (
                          <div key={slide.id} className="slide-card-item">
                            <div className="slide-card-title">{slide.title}</div>
                            <input
                              type="text"
                              className="context-input"
                              style={{ fontSize: '10.5px', marginTop: '2px', padding: '4px 6px' }}
                              value={slide.detail}
                              onChange={(e) => handleUpdateSlideDetail(slide.id, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="context-section">
                      <div className="context-section-header">
                        <h4>Bookmarked Insights ({savedInsights.length})</h4>
                      </div>
                      {savedInsights.length === 0 ? (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0' }}>
                          No bookmarks saved yet. Click "Bookmark" under any AI message to save insights here!
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                          {savedInsights.map((item) => (
                            <div key={item.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '6px 8px' }}>
                              <div style={{ fontSize: '11px', color: 'var(--text-primary)', lineHeight: 1.4 }}>{item.snippet}</div>
                              <div style={{ display: 'flex', gap: '6px', marginTop: '4px', justifyContent: 'flex-end' }}>
                                <button className="mini-link-btn" onClick={() => handleCopyMessage(item.full)}>Copy</button>
                                <button className="mini-link-btn" style={{ color: '#EF4444' }} onClick={() => handleDeleteBookmark(item.id)}>Remove</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="context-hint">
                  <p>💡 <i>Active Code or Terminal text entered in tabs is automatically bundled into your prompts when you click Send!</i></p>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
