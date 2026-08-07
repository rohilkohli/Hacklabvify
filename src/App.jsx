import { useState, useRef, useEffect, useCallback } from 'react';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-3.6-flash';
const getGeminiUrl = (apiKey) => `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey || GEMINI_API_KEY}`;

const STAGE_OPTIONS = ['Idea', 'MVP', 'Beta', 'Revenue', 'Scaling'];

const LANGUAGES = [
  { code: 'English', label: '🇺🇸 English' },
  { code: 'Spanish', label: '🇪🇸 Español' },
  { code: 'French', label: '🇫🇷 Français' },
  { code: 'German', label: '🇩🇪 Deutsch' },
  { code: 'Hindi', label: '🇮🇳 Hindi' },
  { code: 'Japanese', label: '🇯🇵 日本語' },
  { code: 'Chinese (Simplified)', label: '🇨🇳 简体中文' },
  { code: 'Portuguese', label: '🇧🇷 Português' },
];

const PRESET_STARTUPS = [
  {
    name: 'DevPulse AI',
    industry: 'DevTools & AI',
    stage: 'MVP',
    tagline: 'Automated PR code reviews and security audits'
  },
  {
    name: 'MediMind',
    industry: 'HealthTech & AI',
    stage: 'Idea',
    tagline: 'AI clinical triage assistant for rural health clinics'
  },
  {
    name: 'PayFlow Global',
    industry: 'FinTech',
    stage: 'Revenue',
    tagline: 'Cross-border B2B payouts for remote engineering teams'
  }
];

const ADVISOR_PERSONAS = [
  {
    id: 'yc_partner',
    name: 'YC Partner',
    icon: '⚡',
    desc: 'Direct, speed & growth metrics focus',
    modifier: 'Adopt the tone of an experienced Y Combinator partner. Be direct, aggressive on metrics, zero fluff, and hyper-focused on speed and customer validation.'
  },
  {
    id: 'risk_expert',
    name: 'Risk & Legal Expert',
    icon: '🛡️',
    desc: 'Compliance, security & IP focus',
    modifier: 'Adopt the tone of a seasoned risk officer and legal compliance expert. Focus heavily on regulatory hurdles, IP protection, security risks, and contractual safeguards.'
  },
  {
    id: 'growth_guru',
    name: 'Growth Lead',
    icon: '🚀',
    desc: 'Virality, CAC/LTV & funnel conversion',
    modifier: 'Adopt the tone of a hyper-focused Growth Lead. Focus on viral marketing loops, CAC reduction, LTV optimization, landing page conversion, and product-led growth strategies.'
  }
];

const QUICK_ACTIONS = [
  { icon: '🔍', label: 'Market Research', key: 'market', color: '#3B6FFF' },
  { icon: '🏆', label: 'Competitor Analysis', key: 'competitor', color: '#00D4AA' },
  { icon: '💰', label: 'Fundraising Pitch', key: 'fundraising', color: '#F59E0B' },
  { icon: '📋', label: 'Go-to-Market Plan', key: 'gtm', color: '#8B5CF6' },
  { icon: '⚠️', label: 'Risk Assessment', key: 'risk', color: '#FF4D6D' },
  { icon: '💡', label: 'Business Model', key: 'bizmodel', color: '#06B6D4' },
  { icon: '🎯', label: 'ICP & Personas', key: 'icp', color: '#10B981' },
  { icon: '📊', label: 'Pitch Deck Outline', key: 'pitchdeck', color: '#EC4899' },
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
function LightningIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function MicIcon({ active }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill={active ? "#FF4D6D" : "none"} stroke={active ? "#FF4D6D" : "currentColor"} strokeWidth="2">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function SunMoonIcon({ theme }) {
  return theme === 'dark' ? (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
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
  ) : (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function Toast({ message, visible }) {
  return (
    <div className={`toast ${visible ? 'toast-visible' : ''}`}>
      {message}
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────
export default function App() {
  // Theme state
  const [theme, setTheme] = useState(() => localStorage.getItem('hv_theme') || 'dark');
  const [language, setLanguage] = useState(() => localStorage.getItem('hv_lang') || 'English');

  // Startup Profile state
  const [startupName, setStartupName] = useState(() => localStorage.getItem('hv_startupName') || '');
  const [industry, setIndustry] = useState(() => localStorage.getItem('hv_industry') || '');
  const [stage, setStage] = useState(() => localStorage.getItem('hv_stage') || 'Idea');
  const [tagline, setTagline] = useState(() => localStorage.getItem('hv_tagline') || '');
  const [contextSet, setContextSet] = useState(() => localStorage.getItem('hv_contextSet') === 'true');
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
  const [customApiKey, setCustomApiKey] = useState(() => localStorage.getItem('hv_custom_api_key') || '');
  const [persona, setPersona] = useState(() => localStorage.getItem('hv_persona') || 'yc_partner');
  
  // Finance Runway state
  const [cashBalance, setCashBalance] = useState(() => Number(localStorage.getItem('hv_cash')) || 120000);
  const [monthlyExpenses, setMonthlyExpenses] = useState(() => Number(localStorage.getItem('hv_expenses')) || 15000);
  const [monthlyRevenue, setMonthlyRevenue] = useState(() => Number(localStorage.getItem('hv_revenue')) || 4000);

  // Right Column IDE Context Tooling state
  const [codeContext, setCodeContext] = useState('');
  const [codeFilename, setCodeFilename] = useState('');
  const [terminalErrors, setTerminalErrors] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);

  // UI State
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('context');
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(customApiKey);
  const [isListening, setIsListening] = useState(false);
  const [showRightCol, setShowRightCol] = useState(true);

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Sync to localStorage
  useEffect(() => { localStorage.setItem('hv_theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('hv_lang', language); }, [language]);
  useEffect(() => { localStorage.setItem('hv_startupName', startupName); }, [startupName]);
  useEffect(() => { localStorage.setItem('hv_industry', industry); }, [industry]);
  useEffect(() => { localStorage.setItem('hv_stage', stage); }, [stage]);
  useEffect(() => { localStorage.setItem('hv_tagline', tagline); }, [tagline]);
  useEffect(() => { localStorage.setItem('hv_contextSet', contextSet); }, [contextSet]);
  useEffect(() => { localStorage.setItem('hv_messages', JSON.stringify(messages)); }, [messages]);
  useEffect(() => { localStorage.setItem('hv_savedInsights', JSON.stringify(savedInsights)); }, [savedInsights]);
  useEffect(() => { localStorage.setItem('hv_custom_api_key', customApiKey); }, [customApiKey]);
  useEffect(() => { localStorage.setItem('hv_persona', persona); }, [persona]);
  useEffect(() => { localStorage.setItem('hv_cash', cashBalance); }, [cashBalance]);
  useEffect(() => { localStorage.setItem('hv_expenses', monthlyExpenses); }, [monthlyExpenses]);
  useEffect(() => { localStorage.setItem('hv_revenue', monthlyRevenue); }, [monthlyRevenue]);

  const activePersonaObj = ADVISOR_PERSONAS.find((p) => p.id === persona) || ADVISOR_PERSONAS[0];

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2200);
  }, []);

  const systemContext = `You are an expert startup co-founder, strategist, and advisor. ${activePersonaObj.modifier} Respond in ${language}. The user is building a startup called "${startupName || 'Startup'}" in the ${industry || 'Tech'} space, currently at the ${stage} stage${tagline ? `, with tagline: "${tagline}"` : ''}. Format responses with: **bold** for key concepts, ## for section headers, and bullet points. Always end with a section ## ⚡ Your Next 3 Actions listing 3 immediate steps for this week. Keep under 350 words.`;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [input]);

  const callGemini = useCallback(async (userMessage) => {
    if (!userMessage.trim() || loading) return;
    setLoading(true);

    // Bundle active context buffer from IDE tooling column
    let fullPrompt = userMessage.trim();
    if (codeContext.trim()) {
      fullPrompt += `\n\n[ATTACHED CODE CONTEXT ${codeFilename ? `(${codeFilename})` : ''}]:\n\`\`\`\n${codeContext.trim()}\n\`\`\``;
    }
    if (terminalErrors.trim()) {
      fullPrompt += `\n\n[TERMINAL ERROR TRACEBACK]:\n\`\`\`\n${terminalErrors.trim()}\n\`\`\``;
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

      // Inject bundled context into latest message part
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

  const handleStartSession = (e) => {
    if (e) e.preventDefault();
    if (!startupName.trim() || !industry.trim()) return;
    setContextSet(true);
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Welcome! I'm your AI co-founder for **${startupName.trim()}** (${activePersonaObj.name} Mode). Domain: **${industry.trim()}** (${stage} stage)${tagline ? ` — "${tagline}"` : ''}. Ask a question or use a Strategy Playbook to begin. ⚡`,
        ts: Date.now(),
      }]);
    }
  };

  const handleApplyPreset = (preset) => {
    setStartupName(preset.name);
    setIndustry(preset.industry);
    setStage(preset.stage);
    setTagline(preset.tagline);
    setContextSet(true);
    setMessages([{
      role: 'assistant',
      content: `Loaded **${preset.name}** preset! Stage: **${preset.stage}** in **${preset.industry}**. Vision: "${preset.tagline}". Select a Strategy Playbook below to execute. 🚀`,
      ts: Date.now(),
    }]);
    showToast(`Loaded ${preset.name} preset`);
  };

  const getQuickActionPrompt = (key) => {
    const n = startupName.trim() || 'our startup';
    const ind = industry.trim() || 'our market';
    const prompts = {
      market: `Give me a comprehensive market research overview for ${n}. Include ## Market Size (TAM/SAM/SOM), ## Key Trends, ## Target Customer Segments, and ## Top 3 Opportunities.`,
      competitor: `Analyze the competitive landscape for ${n} in ${ind}. List ## Top 5 Competitors with their strengths and weaknesses, then ## Our Key Differentiators and competitive moat.`,
      fundraising: `Help me structure a fundraising pitch for ${n}. Cover ## Problem, ## Solution, ## Market Opportunity, ## Business Model, ## Traction Metrics to highlight, and ## Key Investor Objections.`,
      gtm: `Create a go-to-market strategy for ${n} at the ${stage} stage. Include ## Target Customer Profile, ## Acquisition Channels, ## Pricing Strategy, and ## 90-Day Launch Plan.`,
      risk: `Identify the top risks for ${n}. Cover ## Market Risks, ## Execution Risks, ## Technical Risks, ## Regulatory Risks. For each give a mitigation strategy.`,
      bizmodel: `Design the optimal business model for ${n} in ${ind}. Cover ## Revenue Streams, ## Pricing Models, ## Unit Economics, ## Key Metrics to track, and ## Monetization Roadmap.`,
      icp: `Define the Ideal Customer Profile and buyer personas for ${n}. Include ## Primary ICP, ## Secondary ICP, ## Pain Points, ## Buying Triggers, and ## How to Reach Them.`,
      pitchdeck: `Create a complete pitch deck outline for ${n}. For each of the 10 slides provide the slide title, key message, and 2-3 bullet points of content to include.`,
    };
    return prompts[key];
  };

  const handleQuickAction = (key) => {
    if (loading) return;
    if (!contextSet) {
      setStartupName('DevPulse AI');
      setIndustry('DevTools & AI');
      setStage('MVP');
      setTagline('Automated PR reviews');
      setContextSet(true);
    }
    callGemini(getQuickActionPrompt(key));
  };

  const handleSend = () => {
    if (!input.trim() || loading) return;
    if (!contextSet) {
      setStartupName('My Startup');
      setIndustry('Technology');
      setContextSet(true);
    }
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

  const handleSaveInsight = (content) => {
    const snippet = content.slice(0, 120) + (content.length > 120 ? '…' : '');
    setSavedInsights((prev) => [{ id: Date.now(), snippet, full: content, ts: Date.now() }, ...prev]);
    showToast('Insight saved');
  };

  const handleDeleteInsight = (id) => {
    setSavedInsights((prev) => prev.filter((i) => i.id !== id));
    showToast('Insight removed');
  };

  const handleResetSession = () => {
    if (window.confirm('Reset all startup context and chat history?')) {
      setStartupName('');
      setIndustry('');
      setStage('Idea');
      setTagline('');
      setContextSet(false);
      setMessages([]);
      setSavedInsights([]);
      setCodeContext('');
      setCodeFilename('');
      setTerminalErrors('');
      setAttachedFile(null);
      localStorage.clear();
      showToast('Session reset');
    }
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

  const handleExportChat = (format = 'txt') => {
    let text = '';
    let mimeType = 'text/plain';
    let ext = 'txt';

    if (format === 'json') {
      text = JSON.stringify({ startup: { name: startupName, industry, stage, tagline }, persona, language, messages, savedInsights }, null, 2);
      mimeType = 'application/json';
      ext = 'json';
    } else if (format === 'md') {
      text = `# ${startupName || 'Startup'} - AI Co-Founder Strategy Session\n\n**Industry**: ${industry} | **Stage**: ${stage} | **Persona**: ${activePersonaObj.name} | **Language**: ${language}\n\n` +
        messages.map((m) => `### ${m.role.toUpperCase()}\n${m.content}`).join('\n\n---\n\n');
      ext = 'md';
    } else {
      text = messages.map((m) => `[${m.role.toUpperCase()}]\n${m.content}`).join('\n\n---\n\n');
    }

    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(startupName || 'hacklabvify').replace(/\s+/g, '-')}-copilot-session.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported as .${ext}`);
  };

  // Voice Input Handler
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

  // Financial calculations
  const netBurn = Math.max(0, monthlyExpenses - monthlyRevenue);
  const runwayMonths = netBurn > 0 ? (cashBalance / netBurn).toFixed(1) : '∞';

  const getFinancialHealthBadge = () => {
    if (netBurn === 0) return { label: '🟢 Net Profitable', color: '#22C55E' };
    const months = Number(runwayMonths);
    if (months >= 12) return { label: `🟢 Healthy (${months} Mo)`, color: '#22C55E' };
    if (months >= 6) return { label: `🟡 Moderate (${months} Mo)`, color: '#F59E0B' };
    return { label: `🔴 Critical (${months} Mo)`, color: '#FF4D6D' };
  };

  const handleAskFinancialOptimization = () => {
    const health = getFinancialHealthBadge();
    const prompt = `Analyze financial runway for ${startupName || 'our startup'}. Cash in Bank: $${cashBalance.toLocaleString()}, Monthly Expenses: $${monthlyExpenses.toLocaleString()}, Monthly Revenue: $${monthlyRevenue.toLocaleString()}. Net Burn: $${netBurn.toLocaleString()}/mo, Runway: ${runwayMonths} mo (${health.label}). Provide ## Cash Runway Analysis, ## Top 3 Cost Reduction Strategies, ## Revenue Acceleration Opportunities, and ## ⚡ Your Next 3 Actions.`;
    callGemini(prompt);
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`theme-${theme}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Outfit:wght@500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Dark Theme Tokens ── */
        .theme-dark {
          --bg: #080C14;
          --bg-glass: rgba(15, 22, 35, 0.75);
          --surface: #0F1623;
          --surface-2: #151E2E;
          --surface-3: #1A2640;
          --border: #1E2D45;
          --border-2: #2B3D5E;
          --accent: #3B6FFF;
          --accent-glow: rgba(59,111,255,0.18);
          --accent-2: #00D4AA;
          --text-primary: #F0F4FF;
          --text-secondary: #8A9BBF;
          --text-muted: #4A5D7E;
          --danger: #FF4D6D;
          --success: #22C55E;
          --warn: #F59E0B;
          --shadow: 0 8px 32px rgba(0,0,0,0.4);
          --blob-1: rgba(59, 111, 255, 0.25);
          --blob-2: rgba(0, 212, 170, 0.2);
          --blob-3: rgba(139, 92, 246, 0.22);
          --code-bg: #0B101B;
        }

        /* ── Light Theme Tokens ── */
        .theme-light {
          --bg: #F4F7FC;
          --bg-glass: rgba(255, 255, 255, 0.85);
          --surface: #FFFFFF;
          --surface-2: #F0F4FA;
          --surface-3: #E2E9F5;
          --border: #D1DBEC;
          --border-2: #B0C2DE;
          --accent: #2563EB;
          --accent-glow: rgba(37, 99, 235, 0.12);
          --accent-2: #059669;
          --text-primary: #0F172A;
          --text-secondary: #475569;
          --text-muted: #94A3B8;
          --danger: #E11D48;
          --success: #16A34A;
          --warn: #D97706;
          --shadow: 0 8px 24px rgba(0,0,0,0.08);
          --blob-1: rgba(37, 99, 235, 0.12);
          --blob-2: rgba(5, 150, 105, 0.12);
          --blob-3: rgba(124, 58, 237, 0.12);
          --code-bg: #E8EEF8;
        }

        html, body, #root { height: 100%; overflow: hidden; }
        body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text-primary); transition: background 0.3s ease, color 0.3s ease; }

        /* ── Nebula Animated Background ── */
        .nebula-bg {
          position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden;
        }

        .blob {
          position: absolute; border-radius: 50%; filter: blur(90px); animation: blobFloat 22s infinite alternate ease-in-out;
        }
        .blob-1 { width: 450px; height: 450px; top: -100px; left: -100px; background: var(--blob-1); }
        .blob-2 { width: 500px; height: 500px; bottom: -150px; right: -100px; background: var(--blob-2); animation-delay: -7s; }
        .blob-3 { width: 400px; height: 400px; top: 40%; left: 35%; background: var(--blob-3); animation-delay: -14s; }

        @keyframes blobFloat {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(60px, 40px) scale(1.1); }
          100% { transform: translate(-40px, 70px) scale(0.95); }
        }

        /* ── App Shell Layout ── */
        .app-container {
          position: relative; z-index: 1; display: flex; height: 100vh; overflow: hidden;
          backdrop-filter: blur(8px);
        }

        /* ── Sidebar ── */
        .sidebar {
          width: 275px; flex-shrink: 0; background: var(--bg-glass);
          border-right: 1px solid var(--border); display: flex; flex-direction: column;
          height: 100vh; overflow: hidden; z-index: 10;
        }

        .sidebar-brand {
          padding: 16px 18px; border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
        }

        .brand-row { display: flex; align-items: center; gap: 9px; }
        .brand-title { font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 17px; letter-spacing: -0.3px; }
        .brand-sub { font-size: 10px; color: var(--text-secondary); margin-top: 1px; }

        .sidebar-tabs { display: flex; border-bottom: 1px solid var(--border); }
        .sidebar-tab {
          flex: 1; padding: 10px 2px; font-size: 10px; font-weight: 600;
          letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-muted);
          background: transparent; border: none; cursor: pointer; transition: all 0.2s ease;
          border-bottom: 2px solid transparent; margin-bottom: -1px; text-align: center;
        }
        .sidebar-tab.active { color: var(--accent); border-bottom-color: var(--accent); }

        .sidebar-body { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 14px; }
        .sidebar-body::-webkit-scrollbar { width: 3px; }
        .sidebar-body::-webkit-scrollbar-thumb { background: var(--border); }

        .section-label {
          font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--text-muted); margin-bottom: 8px;
        }

        .preset-chip {
          background: var(--surface-2); border: 1px solid var(--border);
          border-radius: 8px; padding: 8px 10px; cursor: pointer;
          text-align: left; transition: all 0.2s ease; margin-bottom: 6px;
        }
        .preset-chip:hover { border-color: var(--accent); background: var(--accent-glow); transform: translateY(-1px); }
        .preset-name { font-size: 11.5px; font-weight: 600; color: var(--text-primary); }
        .preset-desc { font-size: 10px; color: var(--text-secondary); margin-top: 2px; }

        .persona-card {
          display: flex; align-items: center; gap: 8px;
          background: var(--surface-2); border: 1px solid var(--border);
          border-radius: 8px; padding: 9px 10px; cursor: pointer; transition: all 0.2s ease; margin-bottom: 6px;
        }
        .persona-card.active { border-color: var(--accent); background: var(--accent-glow); }
        .persona-icon { font-size: 16px; }
        .persona-title { font-size: 11.5px; font-weight: 600; color: var(--text-primary); }
        .persona-desc { font-size: 9.5px; color: var(--text-secondary); }

        .form-group { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
        .form-label { font-size: 11px; font-weight: 500; color: var(--text-secondary); }

        .form-input, .form-select, .context-textarea {
          width: 100%; background: var(--surface-2); border: 1px solid var(--border);
          border-radius: 8px; padding: 8px 10px; font-family: 'Inter', sans-serif;
          font-size: 12.5px; color: var(--text-primary); outline: none; transition: all 0.2s ease;
        }
        .form-input:focus, .form-select:focus, .context-textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }

        .btn-primary {
          width: 100%; background: var(--accent); color: #fff; border: none; border-radius: 8px;
          padding: 9px 14px; font-family: 'Inter', sans-serif; font-size: 12.5px; font-weight: 600;
          cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }

        .btn-secondary {
          background: var(--surface-2); border: 1px solid var(--border); color: var(--text-secondary);
          border-radius: 6px; padding: 5px 9px; font-size: 11px; font-weight: 500; cursor: pointer; transition: all 0.2s ease;
        }
        .btn-secondary:hover { border-color: var(--accent); color: var(--accent); }

        /* ── Center Chat Panel ── */
        .chat-main { flex: 1; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }

        .chat-header {
          padding: 12px 24px; border-bottom: 1px solid var(--border); background: var(--bg-glass);
          display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
        }

        .header-controls { display: flex; align-items: center; gap: 8px; }

        .lang-select {
          background: var(--surface-2); border: 1px solid var(--border); color: var(--text-primary);
          padding: 5px 9px; border-radius: 20px; font-size: 11.5px; font-weight: 500; cursor: pointer; outline: none;
        }

        .icon-btn {
          background: var(--surface-2); border: 1px solid var(--border); color: var(--text-secondary);
          width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s ease;
        }
        .icon-btn:hover { border-color: var(--accent); color: var(--accent); }

        .suggestions-bar {
          padding: 10px 24px; border-bottom: 1px solid var(--border); background: var(--bg-glass);
          display: flex; gap: 8px; overflow-x: auto; flex-shrink: 0;
        }
        .suggestions-bar::-webkit-scrollbar { height: 3px; }
        .suggestions-bar::-webkit-scrollbar-thumb { background: var(--border); }

        .suggestion-chip {
          display: flex; align-items: center; gap: 6px; background: var(--surface-2);
          border: 1px solid var(--border); border-radius: 20px; padding: 6px 12px;
          white-space: nowrap; font-size: 11.5px; font-weight: 500; color: var(--text-secondary);
          cursor: pointer; transition: all 0.2s ease; flex-shrink: 0;
        }
        .suggestion-chip:hover { border-color: var(--accent); color: var(--text-primary); background: var(--accent-glow); }

        .chat-area { flex: 1; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
        .chat-area::-webkit-scrollbar { width: 4px; }
        .chat-area::-webkit-scrollbar-thumb { background: var(--border); }

        .message-wrapper { display: flex; flex-direction: column; gap: 4px; max-width: 820px; }
        .message-wrapper.user { align-self: flex-end; }
        .message-wrapper.assistant { align-self: flex-start; width: 100%; }

        .bubble { padding: 12px 16px; border-radius: 12px; font-size: 13.5px; line-height: 1.6; }
        .bubble.user { background: var(--accent); color: #fff; border-radius: 14px 14px 4px 14px; }
        .bubble.assistant { background: var(--surface); border: 1px solid var(--border); color: var(--text-primary); border-radius: 4px 14px 14px 14px; box-shadow: var(--shadow); }

        .bubble.assistant .md-heading { font-weight: 700; color: var(--text-primary); margin: 8px 0 4px; font-size: 13.5px; font-family: 'Space Grotesk', sans-serif; }
        .bubble.assistant .md-heading:first-child { margin-top: 0; }
        .bubble.assistant .md-paragraph { margin-bottom: 6px; }
        .bubble.assistant .md-list { margin: 4px 0 8px 16px; list-style: disc; }

        .msg-meta { display: flex; align-items: center; gap: 6px; }
        .msg-time { font-size: 10px; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; }
        .msg-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.15s ease; }
        .message-wrapper:hover .msg-actions { opacity: 1; }
        .msg-btn { background: var(--surface-3); border: 1px solid var(--border); border-radius: 5px; color: var(--text-muted); padding: 3px 6px; cursor: pointer; font-size: 10px; }
        .msg-btn:hover { color: var(--accent); border-color: var(--accent); }

        /* ── Input Pill Footer ── */
        .chat-footer { padding: 14px 24px 16px; border-top: 1px solid var(--border); background: var(--bg-glass); flex-shrink: 0; }

        .input-pill {
          display: flex; align-items: center; gap: 8px; background: var(--surface);
          border: 1px solid var(--border); border-radius: 28px; padding: 6px 14px;
          box-shadow: var(--shadow); transition: all 0.2s ease;
        }
        .input-pill:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }

        .chat-textarea {
          flex: 1; background: transparent; border: none; outline: none;
          color: var(--text-primary); font-family: 'Inter', sans-serif; font-size: 13.5px;
          resize: none; max-height: 100px; padding: 4px 0;
        }

        .action-icon-btn {
          background: transparent; border: none; color: var(--text-muted); cursor: pointer;
          display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;
        }
        .action-icon-btn:hover { color: var(--accent); }

        .send-btn-round {
          background: var(--accent); color: #fff; border: none; border-radius: 50%;
          width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s ease; flex-shrink: 0;
        }
        .send-btn-round:hover:not(:disabled) { transform: scale(1.05); }
        .send-btn-round:disabled { opacity: 0.35; cursor: not-allowed; }

        .preview-area { display: flex; align-items: center; gap: 8px; margin-top: 8px; padding: 4px 8px; }
        .file-chip {
          background: var(--surface-2); border: 1px solid var(--border); border-radius: 12px;
          padding: 3px 10px; font-size: 11px; color: var(--accent); display: flex; align-items: center; gap: 6px;
        }

        /* ── Right Column IDE Context Tooling ── */
        .context-tools-col {
          width: 290px; flex-shrink: 0; background: var(--bg-glass);
          border-left: 1px solid var(--border); display: flex; flex-direction: column;
          height: 100vh; overflow-y: auto; padding: 16px; gap: 16px; z-index: 10;
        }
        .context-tools-col::-webkit-scrollbar { width: 3px; }
        .context-tools-col::-webkit-scrollbar-thumb { background: var(--border); }

        .context-title { font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.05em; }

        .context-card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 8px; box-shadow: var(--shadow); }
        .context-card-title { font-size: 11.5px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 6px; }

        .hint-box { background: var(--surface-2); border: 1px solid var(--border); border-radius: 8px; padding: 10px; font-size: 11px; color: var(--text-secondary); line-height: 1.5; }

        /* ── Login / Welcome Card Screen ── */
        .welcome-screen {
          flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 30px; text-align: center; overflow-y: auto;
        }

        .login-card {
          background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
          max-width: 520px; width: 100%; padding: 28px; box-shadow: var(--shadow);
          display: flex; flex-direction: column; gap: 20px;
        }

        .login-header h1 { font-family: 'Outfit', sans-serif; font-size: 24px; font-weight: 800; color: var(--text-primary); }
        .login-header p { font-size: 13px; color: var(--text-secondary); margin-top: 4px; }

        .login-tips { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .tip-item {
          background: var(--surface-2); border: 1px solid var(--border); border-radius: 8px;
          padding: 10px; font-size: 11.5px; text-align: left; color: var(--text-secondary);
        }

        /* ── Modal & Toast ── */
        .modal-overlay {
          position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.65);
          backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .modal-content {
          background: var(--surface); border: 1px solid var(--border-2); border-radius: 14px;
          width: 100%; max-width: 440px; padding: 20px; display: flex; flex-direction: column; gap: 14px; box-shadow: var(--shadow);
        }

        .toast {
          position: fixed; bottom: 20px; right: 20px; z-index: 200; background: var(--surface-3);
          border: 1px solid var(--border-2); color: var(--text-primary); padding: 8px 14px;
          border-radius: 8px; font-size: 12px; font-weight: 500; opacity: 0; transform: translateY(10px); transition: all 0.25s ease;
        }
        .toast-visible { opacity: 1; transform: translateY(0); }
      `}</style>

      {/* Animated Nebula Background */}
      <div className="nebula-bg">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <Toast message={toastMsg} visible={toastVisible} />

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontFamily: 'Space Grotesk', fontSize: '16px', fontWeight: 700 }}>🔑 Gemini API Key Settings</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Provide a custom Google Gemini API Key if you wish to override default key settings. Key is stored locally in your browser.
            </div>
            <div className="form-group">
              <label className="form-label">API Key</label>
              <input type="password" className="form-input" placeholder="AIzaSy..." value={tempApiKey} onChange={(e) => setTempApiKey(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => { setCustomApiKey(''); setTempApiKey(''); setShowSettingsModal(false); showToast('API Key cleared'); }}>Clear</button>
              <button className="btn-primary" style={{ width: 'auto' }} onClick={() => { setCustomApiKey(tempApiKey.trim()); setShowSettingsModal(false); showToast(tempApiKey.trim() ? 'Key saved' : 'Using default'); }}>Save</button>
            </div>
          </div>
        </div>
      )}

      <div className="app-container">
        {/* ── Left Sidebar Navigation & Profiles ── */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="brand-row">
              <span style={{ color: 'var(--accent)' }}><LightningIcon size={20} /></span>
              <div>
                <div className="brand-title">Hacklabvify</div>
                <div className="brand-sub">by Team CYBERNEX</div>
              </div>
            </div>
            <button className="icon-btn" onClick={() => setShowSettingsModal(true)} title="API Settings">
              <SettingsIcon />
            </button>
          </div>

          <div className="sidebar-tabs">
            {['context', 'persona', 'saved'].map((tab) => (
              <button key={tab} className={`sidebar-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                {tab === 'context' ? 'Profile' : tab === 'persona' ? 'Persona' : `Saved (${savedInsights.length})`}
              </button>
            ))}
          </div>

          <div className="sidebar-body">
            {activeTab === 'context' && (
              <>
                <div>
                  <div className="section-label">⚡ 1-Click Demo Presets</div>
                  {PRESET_STARTUPS.map((p) => (
                    <div key={p.name} className="preset-chip" onClick={() => handleApplyPreset(p)}>
                      <div className="preset-name">{p.name} ({p.stage})</div>
                      <div className="preset-desc">{p.industry} • {p.tagline}</div>
                    </div>
                  ))}
                </div>

                <div className="section-label">Startup Profile</div>
                <form onSubmit={handleStartSession}>
                  <div className="form-group">
                    <label className="form-label">Startup Name</label>
                    <input className="form-input" type="text" value={startupName} onChange={(e) => setStartupName(e.target.value)} placeholder="e.g. DevPulse AI" required maxLength={50} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Industry / Domain</label>
                    <input className="form-input" type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. DevTools, FinTech" required maxLength={60} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tagline / Vision</label>
                    <input className="form-input" type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="e.g. Stripe for insurance claims" maxLength={80} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stage</label>
                    <select className="form-select" value={stage} onChange={(e) => setStage(e.target.value)}>
                      {STAGE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <button type="submit" className="btn-primary" style={{ marginTop: '4px' }}>
                    {contextSet ? 'Update Profile' : 'Start Advisory Session'}
                  </button>
                </form>

                {contextSet && (
                  <button className="btn-secondary" onClick={handleResetSession} style={{ width: '100%', marginTop: '6px' }}>
                    Reset Session State
                  </button>
                )}
              </>
            )}

            {activeTab === 'persona' && (
              <div>
                <div className="section-label">AI Advisor Persona Tone</div>
                {ADVISOR_PERSONAS.map((p) => (
                  <div key={p.id} className={`persona-card ${persona === p.id ? 'active' : ''}`} onClick={() => { setPersona(p.id); showToast(`Tone: ${p.name}`); }}>
                    <span className="persona-icon">{p.icon}</span>
                    <div>
                      <div className="persona-title">{p.name}</div>
                      <div className="persona-desc">{p.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'saved' && (
              <div>
                <div className="section-label">Bookmarked Insights ({savedInsights.length})</div>
                {savedInsights.length === 0 ? (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                    No bookmarked insights yet. Click Bookmark on any AI message.
                  </div>
                ) : (
                  savedInsights.map((item) => (
                    <div key={item.id} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 10px', marginBottom: '8px' }}>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-primary)', lineHeight: 1.4 }}>{item.snippet}</div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px', justifyContent: 'flex-end' }}>
                        <button className="btn-secondary" style={{ padding: '2px 6px', fontSize: '9px' }} onClick={() => handleCopyMessage(item.full)}>Copy</button>
                        <button className="btn-secondary" style={{ padding: '2px 6px', fontSize: '9px', color: 'var(--danger)' }} onClick={() => handleDeleteInsight(item.id)}>Remove</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </aside>

        {/* ── Main Chat Area ── */}
        <main className="chat-main">
          <header className="chat-header">
            <div style={{ display: 'flex', align-items: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px' }}>⚡</span>
              <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '15px', fontWeight: 700 }}>{startupName || 'AI Startup Copilot'}</h2>
              {contextSet && <span style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase', fontWeight: 600 }}>{stage}</span>}
            </div>

            <div className="header-controls">
              {/* Language Selector */}
              <select className="lang-select" value={language} onChange={(e) => { setLanguage(e.target.value); showToast(`Language set to ${e.target.value}`); }}>
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>

              {/* Theme Switcher Button */}
              <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">
                <SunMoonIcon theme={theme} />
              </button>

              {/* Toggle Context Panel Button */}
              <button className="icon-btn" onClick={() => setShowRightCol((prev) => !prev)} title="Toggle Context Tools Panel">
                ⋮
              </button>

              <div style={{ display: 'flex', gap: '4px' }}>
                <button className="btn-secondary" style={{ fontSize: '10px' }} onClick={() => handleExportChat('txt')}>TXT</button>
                <button className="btn-secondary" style={{ fontSize: '10px' }} onClick={() => handleExportChat('md')}>MD</button>
                <button className="btn-secondary" style={{ fontSize: '10px' }} onClick={() => handleExportChat('json')}>JSON</button>
              </div>
            </div>
          </header>

          {/* Quick Strategy Playbooks Chips */}
          <div className="suggestions-bar">
            {QUICK_ACTIONS.map((action) => (
              <button key={action.key} className="suggestion-chip" onClick={() => handleQuickAction(action.key)} disabled={loading}>
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>

          {/* Chat Messages Timeline or Welcome Screen */}
          {!contextSet && messages.length === 0 ? (
            <div className="welcome-screen">
              <div className="login-card">
                <div className="login-header">
                  <h1>AI Startup Copilot</h1>
                  <p>Problem Statement 10 • Team CYBERNEX</p>
                </div>
                <div className="login-tips">
                  <div className="tip-item">🔍 <strong>Market Research</strong><br/>TAM/SAM/SOM & Customer Segments</div>
                  <div className="tip-item">🏆 <strong>Competitor Analysis</strong><br/>Top 5 Competitors & Differentiators</div>
                  <div className="tip-item">💰 <strong>Pitch Deck Outline</strong><br/>10-Slide Deck & Investor Narrative</div>
                  <div className="tip-item">📊 <strong>Runway Calculator</strong><br/>Burn rate & runway optimization</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letter-spacing: '0.08em', color: 'var(--text-muted)' }}>Or choose a demo startup:</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {PRESET_STARTUPS.map((p) => (
                      <button key={p.name} className="suggestion-chip" onClick={() => handleApplyPreset(p)}>
                        🚀 {p.name} ({p.stage})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="chat-area">
              {messages.map((msg, idx) => (
                <div key={idx} className={`message-wrapper ${msg.role}`}>
                  <div className={`bubble ${msg.role}`}>
                    {msg.role === 'assistant' ? parseMarkdown(msg.content) : msg.content}
                  </div>
                  <div className="msg-meta">
                    <span className="msg-time">{formatTime(msg.ts)}</span>
                    {msg.role === 'assistant' && (
                      <div className="msg-actions">
                        <button className="msg-btn" onClick={() => handleCopyMessage(msg.content)}>Copy</button>
                        <button className="msg-btn" onClick={() => handleSaveInsight(msg.content)}>Bookmark</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="message-wrapper assistant">
                  <div className="bubble assistant" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>AI Co-Founder generating response</span>
                    <span style={{ fontSize: '12px' }}>⚡</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}

          {/* Footer Input Pill Bar */}
          <footer className="chat-footer">
            <div className="input-pill">
              {/* Add Attachment Button */}
              <label htmlFor="file-upload" className="action-icon-btn" title="Add File / Context">
                <PlusIcon />
              </label>
              <input type="file" id="file-upload" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} accept="image/*,.txt,.js,.py,.json,.md" />

              {/* Speech-to-Text Button */}
              <button className="action-icon-btn" onClick={toggleVoiceInput} title="Voice Dictation">
                <MicIcon active={isListening} />
              </button>

              {/* Text Area */}
              <textarea
                ref={textareaRef}
                className="chat-textarea"
                rows={1}
                placeholder={`Ask a question in ${language} (e.g. 'How do we scale revenue?')...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />

              {/* Send Button */}
              <button className="send-btn-round" onClick={handleSend} disabled={!input.trim() || loading} title="Send Message">
                ⚡
              </button>
            </div>

            {/* Attached File Preview Chip */}
            {attachedFile && (
              <div className="preview-area">
                <div className="file-chip">
                  📎 {attachedFile.name}
                  <button style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', marginLeft: '4px' }} onClick={() => setAttachedFile(null)}>✕</button>
                </div>
              </div>
            )}
          </footer>
        </main>

        {/* ── Right Column: IDE & Co-Founder Context Tooling ── */}
        {showRightCol && (
          <aside className="context-tools-col">
            <div className="context-title">IDE Context Tooling</div>

            {/* Section 1: Financial Runway Calculator */}
            <div className="context-card">
              <div className="context-card-title">💰 Financial Runway Modeler</div>
              <div className="form-group">
                <label className="form-label">Cash ($)</label>
                <input type="number" className="form-input" value={cashBalance} onChange={(e) => setCashBalance(Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label className="form-label">Expenses ($/mo)</label>
                <input type="number" className="form-input" value={monthlyExpenses} onChange={(e) => setMonthlyExpenses(Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label className="form-label">Revenue ($/mo)</label>
                <input type="number" className="form-input" value={monthlyRevenue} onChange={(e) => setMonthlyRevenue(Number(e.target.value))} />
              </div>

              <div style={{ fontSize: '11px', fontWeight: 600, color: getFinancialHealthBadge().color, textAlign: 'center', padding: '4px', background: 'var(--surface-2)', borderRadius: '4px' }}>
                {getFinancialHealthBadge().label}
              </div>

              <button className="btn-primary" style={{ padding: '6px 10px', fontSize: '11px' }} onClick={handleAskFinancialOptimization}>
                ⚡ Optimize Runway
              </button>
            </div>

            {/* Section 2: Code / Architecture Context Buffer */}
            <div className="context-card">
              <div className="context-card-title">🐍 Code & Architecture Buffer</div>
              <input type="text" className="form-input" placeholder="Filename (e.g. App.jsx)" value={codeFilename} onChange={(e) => setCodeFilename(e.target.value)} />
              <textarea className="context-textarea" style={{ height: '80px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }} placeholder="Paste raw code or architectural specs here..." value={codeContext} onChange={(e) => setCodeContext(e.target.value)} />
            </div>

            {/* Section 3: Terminal Error & Traceback Inspector */}
            <div className="context-card">
              <div className="context-card-title">📟 Terminal Error Traceback</div>
              <textarea className="context-textarea" style={{ height: '70px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }} placeholder="Paste command line tracebacks or logs..." value={terminalErrors} onChange={(e) => setTerminalErrors(e.target.value)} />
            </div>

            <div className="hint-box">
              💡 <i>Any active Code or Terminal text entered here is automatically bundled securely into your message when you click Send!</i>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}