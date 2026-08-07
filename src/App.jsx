import { useState, useRef, useEffect, useCallback } from 'react';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-3.6-flash';
const getGeminiUrl = (apiKey) => `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey || GEMINI_API_KEY}`;

const STAGE_OPTIONS = ['Idea', 'MVP', 'Beta', 'Revenue', 'Scaling'];

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

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
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

function Toast({ message, visible }) {
  return (
    <div className={`toast ${visible ? 'toast-visible' : ''}`}>
      {message}
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────
export default function App() {
  // LocalStorage state initialization
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

  // UI state
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('context');
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [msgCount, setMsgCount] = useState(0);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(customApiKey);
  const [isListening, setIsListening] = useState(false);

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Sync state to LocalStorage
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

  const systemContext = `You are an expert startup co-founder, strategist, and advisor. ${activePersonaObj.modifier} The user is building a startup called "${startupName}" in the ${industry} space, currently at the ${stage} stage${tagline ? `, with the tagline: "${tagline}"` : ''}. Give sharp, actionable, founder-level advice — never generic. Format responses using: **bold** for emphasis, ## for section headings, and bullet points starting with - for lists. Always end with a section ## ⚡ Your Next 3 Actions listing exactly 3 immediate steps the founder can take this week. Keep responses under 350 words and always complete every section fully — never cut off mid-response.`;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [input]);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2200);
  }, []);

  const callGemini = useCallback(async (userMessage) => {
    if (!userMessage.trim() || loading) return;
    setLoading(true);
    const newMessages = [...messages, { role: 'user', content: userMessage.trim(), ts: Date.now() }];
    setMessages(newMessages);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      const history = newMessages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

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
      setMsgCount((c) => c + 1);
    } catch {
      setMessages([...messages, { role: 'assistant', content: '⚠️ Connection error. Check your API key or internet connection.', ts: Date.now() }]);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [messages, loading, systemContext, customApiKey]);

  const handleStartSession = (e) => {
    if (e) e.preventDefault();
    if (!startupName.trim() || !industry.trim()) return;
    setContextSet(true);
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Hey! I'm your AI co-founder for **${startupName.trim()}** (${activePersonaObj.name} Mode). I know your space — **${industry.trim()}** at the **${stage}** stage${tagline ? ` with the vision: "${tagline}"` : ''}. Ask me anything or select a Quick Action to get started. Let's build. ⚡`,
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
      content: `Loaded **${preset.name}** preset! Stage: **${preset.stage}** in **${preset.industry}**. Tagline: "${preset.tagline}". Choose an Action Playbook below or ask any question to begin. 🚀`,
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
    if (loading || !contextSet) return;
    callGemini(getQuickActionPrompt(key));
  };

  const handleSend = () => {
    if (!input.trim() || loading || !contextSet) return;
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
      localStorage.removeItem('hv_startupName');
      localStorage.removeItem('hv_industry');
      localStorage.removeItem('hv_stage');
      localStorage.removeItem('hv_tagline');
      localStorage.removeItem('hv_contextSet');
      localStorage.removeItem('hv_messages');
      localStorage.removeItem('hv_savedInsights');
      showToast('Session reset');
    }
  };

  const handleExportChat = (format = 'txt') => {
    let text = '';
    let mimeType = 'text/plain';
    let ext = 'txt';

    if (format === 'json') {
      text = JSON.stringify({ startup: { name: startupName, industry, stage, tagline }, persona, messages, savedInsights }, null, 2);
      mimeType = 'application/json';
      ext = 'json';
    } else if (format === 'md') {
      text = `# ${startupName || 'Startup'} - AI Co-Founder Strategy Session\n\n**Industry**: ${industry} | **Stage**: ${stage} | **Persona**: ${activePersonaObj.name}\n\n` +
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
      showToast('Speech recognition not supported in this browser');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        showToast('Listening... Speak now');
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        showToast('Voice input error');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      showToast('Could not start voice recognition');
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
    if (!contextSet) {
      showToast('Please set startup context first');
      return;
    }
    const health = getFinancialHealthBadge();
    const prompt = `Analyze our financial runway for ${startupName || 'our startup'}. Cash in Bank: $${cashBalance.toLocaleString()}, Monthly Expenses: $${monthlyExpenses.toLocaleString()}, Monthly Revenue: $${monthlyRevenue.toLocaleString()}. Current Net Burn: $${netBurn.toLocaleString()}/month, Runway: ${runwayMonths} months (${health.label}). Provide ## Cash Runway Analysis, ## Top 3 Cost Reduction Strategies, ## Revenue Acceleration Opportunities, and ## ⚡ Your Next 3 Actions to extend runway.`;
    callGemini(prompt);
  };

  const filteredMessages = searchQuery
    ? messages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  const formatTime = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #080C14;
          --surface: #0F1623;
          --surface-2: #151E2E;
          --surface-3: #1A2640;
          --border: #1E2D45;
          --border-2: #253550;
          --accent: #3B6FFF;
          --accent-glow: rgba(59,111,255,0.15);
          --accent-2: #00D4AA;
          --text-primary: #F0F4FF;
          --text-secondary: #7A8BAD;
          --text-muted: #3D4F6B;
          --danger: #FF4D6D;
          --success: #22C55E;
          --warn: #F59E0B;
        }

        html, body, #root { height: 100%; overflow: hidden; }
        body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text-primary); -webkit-font-smoothing: antialiased; }

        /* ── App Shell ── */
        .app-shell { display: flex; height: 100vh; overflow: hidden; }

        /* ── Sidebar ── */
        .sidebar {
          width: 275px; flex-shrink: 0;
          background: var(--surface);
          border-right: 1px solid var(--border);
          display: flex; flex-direction: column;
          height: 100vh; overflow: hidden;
        }

        .sidebar-brand {
          padding: 16px 18px 14px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
          display: flex; align-items: center; justify-content: space-between;
        }

        .brand-row { display: flex; align-items: center; gap: 8px; }
        .brand-icon { color: var(--accent); display: flex; align-items: center; }
        .brand-title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 16px; letter-spacing: -0.3px; }
        .brand-sub { font-size: 10px; color: var(--text-secondary); margin-top: 1px; }

        .btn-settings {
          background: var(--surface-2); border: 1px solid var(--border);
          border-radius: 6px; color: var(--text-secondary);
          padding: 6px; cursor: pointer; display: flex; align-items: center;
          transition: all 0.2s ease;
        }
        .btn-settings:hover { color: var(--accent); border-color: var(--accent); background: var(--accent-glow); }

        /* ── Sidebar Tabs ── */
        .sidebar-tabs {
          display: flex;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }

        .sidebar-tab {
          flex: 1; padding: 10px 2px;
          font-size: 10px; font-weight: 600;
          letter-spacing: 0.04em; text-transform: uppercase;
          color: var(--text-muted);
          background: transparent; border: none;
          cursor: pointer; transition: all 0.2s ease;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px; text-align: center;
        }

        .sidebar-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
        .sidebar-tab:hover:not(.active) { color: var(--text-secondary); }

        .sidebar-body {
          flex: 1; overflow-y: auto;
          padding: 14px;
          display: flex; flex-direction: column; gap: 14px;
        }

        .sidebar-body::-webkit-scrollbar { width: 3px; }
        .sidebar-body::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

        .section-label {
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--text-muted); margin-bottom: 8px;
          display: flex; align-items: center; justify-content: space-between;
        }

        /* ── Presets Chips ── */
        .presets-row { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
        .preset-chip {
          background: var(--surface-2); border: 1px solid var(--border);
          border-radius: 6px; padding: 7px 9px; cursor: pointer;
          text-align: left; transition: all 0.2s ease;
        }
        .preset-chip:hover { border-color: var(--accent); background: var(--accent-glow); }
        .preset-name { font-size: 11px; font-weight: 600; color: var(--text-primary); }
        .preset-desc { font-size: 9.5px; color: var(--text-muted); margin-top: 1px; }

        /* ── Persona Cards ── */
        .persona-selector { display: flex; flex-direction: column; gap: 6px; }
        .persona-card {
          display: flex; align-items: center; gap: 8px;
          background: var(--surface-2); border: 1px solid var(--border);
          border-radius: 8px; padding: 8px 10px; cursor: pointer;
          transition: all 0.2s ease;
        }
        .persona-card.active { border-color: var(--accent); background: var(--accent-glow); }
        .persona-icon { font-size: 16px; }
        .persona-title { font-size: 11px; font-weight: 600; color: var(--text-primary); }
        .persona-desc { font-size: 9.5px; color: var(--text-muted); }

        /* ── Finance Widget ── */
        .finance-card {
          background: var(--surface-2); border: 1px solid var(--border);
          border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 10px;
        }
        .finance-status {
          font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 4px;
          display: inline-block; text-align: center; background: rgba(255,255,255,0.05);
        }

        /* ── Form ── */
        .form-group { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
        .form-label { font-size: 11px; font-weight: 500; color: var(--text-secondary); }

        .form-input, .form-select {
          width: 100%;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 8px 10px;
          font-family: 'Inter', sans-serif;
          font-size: 12.5px; color: var(--text-primary);
          outline: none; transition: all 0.2s ease;
        }

        .form-input::placeholder { color: var(--text-muted); }
        .form-input:focus, .form-select:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-glow);
        }

        .form-select {
          cursor: pointer; appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A8BAD' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          padding-right: 28px;
        }
        .form-select option { background: var(--surface-2); }

        .btn-primary {
          width: 100%; background: var(--accent); color: #fff;
          border: none; border-radius: 8px;
          padding: 9px 14px;
          font-family: 'Inter', sans-serif; font-size: 12.5px; font-weight: 600;
          cursor: pointer; transition: all 0.2s ease;
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .btn-primary:hover { background: #2b5ce6; transform: translateY(-1px); }

        .btn-secondary {
          background: var(--surface-2); border: 1px solid var(--border);
          color: var(--text-secondary); border-radius: 6px; padding: 6px 10px;
          font-size: 11px; font-weight: 500; cursor: pointer; transition: all 0.2s ease;
        }
        .btn-secondary:hover { border-color: var(--accent); color: var(--accent); }

        /* ── Main View ── */
        .main-view { flex: 1; display: flex; flex-direction: column; background: var(--bg); position: relative; }

        /* ── Header ── */
        .top-header {
          padding: 12px 24px;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0;
        }

        .header-title-group { display: flex; align-items: center; gap: 10px; }
        .header-title { font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 700; color: var(--text-primary); }
        .badge-stage {
          background: var(--surface-3); border: 1px solid var(--border-2);
          color: var(--accent-2); font-size: 10px; font-weight: 600;
          padding: 2px 8px; border-radius: 12px; text-transform: uppercase;
        }
        .badge-persona {
          background: rgba(59,111,255,0.1); border: 1px solid var(--accent);
          color: var(--accent); font-size: 10px; font-weight: 600;
          padding: 2px 8px; border-radius: 12px;
        }

        .header-actions { display: flex; align-items: center; gap: 8px; }

        .export-dropdown { display: flex; gap: 4px; }
        .btn-export-opt {
          background: var(--surface-2); border: 1px solid var(--border);
          color: var(--text-secondary); border-radius: 5px;
          padding: 4px 8px; font-size: 10px; font-weight: 600;
          cursor: pointer; transition: all 0.2s ease;
        }
        .btn-export-opt:hover { border-color: var(--accent); color: var(--accent); }

        /* ── Quick Actions Grid ── */
        .quick-actions-bar {
          padding: 10px 24px; border-bottom: 1px solid var(--border);
          background: var(--surface); display: flex; gap: 8px; overflow-x: auto;
          flex-shrink: 0;
        }
        .quick-actions-bar::-webkit-scrollbar { height: 3px; }
        .quick-actions-bar::-webkit-scrollbar-thumb { background: var(--border); }

        .btn-quick-chip {
          display: flex; align-items: center; gap: 5px;
          background: var(--surface-2); border: 1px solid var(--border);
          border-radius: 16px; padding: 5px 11px; white-space: nowrap;
          font-size: 11px; font-weight: 500; color: var(--text-secondary);
          cursor: pointer; transition: all 0.2s ease; flex-shrink: 0;
        }
        .btn-quick-chip:hover { border-color: var(--accent); color: var(--text-primary); background: var(--accent-glow); }

        /* ── Chat Container ── */
        .chat-container {
          flex: 1; overflow-y: auto; padding: 20px 24px;
          display: flex; flex-direction: column; gap: 16px;
        }
        .chat-container::-webkit-scrollbar { width: 4px; }
        .chat-container::-webkit-scrollbar-thumb { background: var(--border); }

        .message-wrapper { display: flex; flex-direction: column; gap: 4px; max-width: 820px; }
        .message-wrapper.user { align-self: flex-end; }
        .message-wrapper.assistant { align-self: flex-start; width: 100%; }

        .bubble {
          padding: 12px 16px; border-radius: 12px; font-size: 13.5px; line-height: 1.6;
        }
        .bubble.user {
          background: var(--accent); color: #fff; border-radius: 14px 14px 4px 14px;
        }
        .bubble.assistant {
          background: var(--surface-2); border: 1px solid var(--border);
          color: var(--text-primary); border-radius: 4px 14px 14px 14px;
        }

        .bubble.assistant .md-heading { font-weight: 600; color: var(--text-primary); margin: 8px 0 4px; font-size: 13px; }
        .bubble.assistant .md-heading:first-child { margin-top: 0; }
        .bubble.assistant .md-paragraph { margin-bottom: 6px; }
        .bubble.assistant .md-list { margin: 4px 0 8px 16px; list-style: disc; }
        .bubble.assistant .md-list li { margin-bottom: 3px; font-size: 13.5px; }

        .msg-meta { display: flex; align-items: center; gap: 6px; }
        .msg-time { font-size: 10px; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; }
        .msg-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.15s ease; }
        .message-wrapper:hover .msg-actions { opacity: 1; }

        .msg-btn {
          background: var(--surface-3); border: 1px solid var(--border);
          border-radius: 5px; color: var(--text-muted); padding: 3px 6px;
          cursor: pointer; font-size: 10px; display: flex; align-items: center; gap: 3px;
        }
        .msg-btn:hover { color: var(--accent); border-color: var(--accent); background: var(--accent-glow); }

        /* ── Input Bar ── */
        .input-bar {
          padding: 14px 24px 16px; border-top: 1px solid var(--border);
          background: var(--surface); display: flex; gap: 8px; align-items: flex-end;
          flex-shrink: 0;
        }

        .input-wrapper {
          flex: 1; position: relative; display: flex; align-items: center;
          background: var(--surface-2); border: 1px solid var(--border);
          border-radius: 10px; padding: 8px 12px; transition: all 0.2s ease;
        }
        .input-wrapper:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }

        .chat-textarea {
          width: 100%; background: transparent; border: none; outline: none;
          color: var(--text-primary); font-family: 'Inter', sans-serif;
          font-size: 13.5px; resize: none; max-height: 120px;
        }

        .btn-mic {
          background: transparent; border: none; color: var(--text-muted);
          cursor: pointer; padding: 4px; margin-right: 6px; display: flex; align-items: center;
          transition: all 0.2s ease;
        }
        .btn-mic:hover { color: var(--danger); }

        .btn-send {
          background: var(--accent); color: #fff; border: none; border-radius: 8px;
          width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s ease; flex-shrink: 0;
        }
        .btn-send:hover:not(:disabled) { background: #2b5ce6; }
        .btn-send:disabled { opacity: 0.35; cursor: not-allowed; }

        /* ── Modal ── */
        .modal-overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .modal-content {
          background: var(--surface); border: 1px solid var(--border-2);
          border-radius: 12px; width: 100%; max-width: 440px; padding: 20px;
          display: flex; flex-direction: column; gap: 14px; box-shadow: 0 12px 32px rgba(0,0,0,0.5);
        }
        .modal-title { font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 700; }
        .modal-sub { font-size: 12px; color: var(--text-secondary); line-height: 1.5; }

        /* ── Toast & Utilities ── */
        .toast {
          position: fixed; bottom: 20px; right: 20px; z-index: 200;
          background: var(--surface-3); border: 1px solid var(--border-2);
          color: var(--text-primary); padding: 8px 14px; border-radius: 8px;
          font-size: 12px; font-weight: 500; pointer-events: none;
          opacity: 0; transform: translateY(10px); transition: all 0.25s ease;
        }
        .toast-visible { opacity: 1; transform: translateY(0); }

        .empty-setup {
          flex: 1; display: flex; flex-direction: column; align-items: center;
          justify-content: center; text-align: center; gap: 12px; padding: 40px;
        }
        .empty-icon { font-size: 40px; opacity: 0.4; }
        .empty-title { font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 600; color: var(--text-secondary); }
        .empty-sub { font-size: 13px; color: var(--text-muted); max-width: 340px; line-height: 1.5; }
      `}</style>

      <Toast message={toastMsg} visible={toastVisible} />

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">🔑 Gemini API Settings</div>
            <div className="modal-sub">
              Enter your custom Google Gemini API Key. If left empty, the application falls back to default environment key configuration.
            </div>
            <div className="form-group">
              <label className="form-label">API Key</label>
              <input
                type="password"
                className="form-input"
                placeholder="AIzaSy..."
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                className="btn-secondary"
                onClick={() => {
                  setCustomApiKey('');
                  setTempApiKey('');
                  setShowSettingsModal(false);
                  showToast('Custom API Key cleared');
                }}
              >
                Clear
              </button>
              <button
                className="btn-primary"
                style={{ width: 'auto' }}
                onClick={() => {
                  setCustomApiKey(tempApiKey.trim());
                  setShowSettingsModal(false);
                  showToast(tempApiKey.trim() ? 'API Key saved' : 'Using default key');
                }}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="app-shell">
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="brand-row">
              <span className="brand-icon"><LightningIcon size={18} /></span>
              <div>
                <div className="brand-title">Hacklabvify</div>
                <div className="brand-sub">by Team CYBERNEX</div>
              </div>
            </div>
            <button className="btn-settings" onClick={() => setShowSettingsModal(true)} title="API Settings">
              <SettingsIcon />
            </button>
          </div>

          <div className="sidebar-tabs">
            {['context', 'persona', 'runway', 'saved'].map((tab) => (
              <button key={tab} className={`sidebar-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                {tab === 'context' ? 'Context' : tab === 'persona' ? 'Persona' : tab === 'runway' ? 'Finance' : `Saved (${savedInsights.length})`}
              </button>
            ))}
          </div>

          <div className="sidebar-body">
            {/* Context Tab */}
            {activeTab === 'context' && (
              <>
                <div>
                  <div className="section-label">⚡ 1-Click Demo Presets</div>
                  <div className="presets-row">
                    {PRESET_STARTUPS.map((p) => (
                      <div key={p.name} className="preset-chip" onClick={() => handleApplyPreset(p)}>
                        <div className="preset-name">{p.name} ({p.stage})</div>
                        <div className="preset-desc">{p.industry} • {p.tagline}</div>
                      </div>
                    ))}
                  </div>
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
                    <label className="form-label">One-line Tagline</label>
                    <input className="form-input" type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="e.g. AI vulnerability audit for PRs" maxLength={80} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stage</label>
                    <select className="form-select" value={stage} onChange={(e) => setStage(e.target.value)}>
                      {STAGE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <button type="submit" className="btn-primary" style={{ marginTop: '4px' }}>
                    {contextSet ? 'Update Profile' : 'Initialize Co-Founder'}
                  </button>
                </form>

                {contextSet && (
                  <button className="btn-secondary" onClick={handleResetSession} style={{ width: '100%', marginTop: '6px' }}>
                    Reset Session State
                  </button>
                )}
              </>
            )}

            {/* Persona Tab */}
            {activeTab === 'persona' && (
              <div>
                <div className="section-label">AI Persona Tone</div>
                <div className="persona-selector">
                  {ADVISOR_PERSONAS.map((p) => (
                    <div
                      key={p.id}
                      className={`persona-card ${persona === p.id ? 'active' : ''}`}
                      onClick={() => {
                        setPersona(p.id);
                        showToast(`Switched tone to ${p.name}`);
                      }}
                    >
                      <span className="persona-icon">{p.icon}</span>
                      <div>
                        <div className="persona-title">{p.name}</div>
                        <div className="persona-desc">{p.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Runway / Finance Tab */}
            {activeTab === 'runway' && (
              <div>
                <div className="section-label">Financial Runway Calculator</div>
                <div className="finance-card">
                  <div className="form-group">
                    <label className="form-label">Cash in Bank ($)</label>
                    <input type="number" className="form-input" value={cashBalance} onChange={(e) => setCashBalance(Number(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Monthly Expenses ($)</label>
                    <input type="number" className="form-input" value={monthlyExpenses} onChange={(e) => setMonthlyExpenses(Number(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Monthly Revenue ($)</label>
                    <input type="number" className="form-input" value={monthlyRevenue} onChange={(e) => setMonthlyRevenue(Number(e.target.value))} />
                  </div>
                  
                  <div className="finance-status" style={{ border: `1px solid ${getFinancialHealthBadge().color}`, color: getFinancialHealthBadge().color }}>
                    {getFinancialHealthBadge().label}
                  </div>

                  <button className="btn-primary" onClick={handleAskFinancialOptimization}>
                    ⚡ AI Runway Optimization
                  </button>
                </div>
              </div>
            )}

            {/* Saved Insights Tab */}
            {activeTab === 'saved' && (
              <div>
                <div className="section-label">Bookmarked Insights ({savedInsights.length})</div>
                {savedInsights.length === 0 ? (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                    No saved insights yet. Click the bookmark icon on any AI message.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {savedInsights.map((item) => (
                      <div key={item.id} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 10px' }}>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-primary)', lineHeight: 1.4 }}>{item.snippet}</div>
                        <div style={{ display: 'flex', justifySelf: 'flex-end', gap: '6px', marginTop: '6px' }}>
                          <button className="btn-secondary" style={{ padding: '2px 6px', fontSize: '9px' }} onClick={() => handleCopyMessage(item.full)}>Copy</button>
                          <button className="btn-secondary" style={{ padding: '2px 6px', fontSize: '9px', color: 'var(--danger)' }} onClick={() => handleDeleteInsight(item.id)}>Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* ── Main View ── */}
        <main className="main-view">
          <header className="top-header">
            <div className="header-title-group">
              <span className="header-title">{startupName || 'Startup AI Copilot'}</span>
              {contextSet && <span className="badge-stage">{stage}</span>}
              <span className="badge-persona">{activePersonaObj.name} Mode</span>
            </div>

            <div className="header-actions">
              <div className="export-dropdown">
                <button className="btn-export-opt" onClick={() => handleExportChat('txt')}>TXT</button>
                <button className="btn-export-opt" onClick={() => handleExportChat('md')}>MD</button>
                <button className="btn-export-opt" onClick={() => handleExportChat('json')}>JSON</button>
              </div>
            </div>
          </header>

          {/* Quick Action Playbooks Bar */}
          <div className="quick-actions-bar">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.key}
                className="btn-quick-chip"
                onClick={() => handleQuickAction(action.key)}
                disabled={loading || !contextSet}
                title={!contextSet ? 'Initialize startup context first' : action.label}
              >
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>

          {/* Chat Container */}
          {!contextSet && messages.length === 0 ? (
            <div className="empty-setup">
              <div className="empty-icon">⚡</div>
              <div className="empty-title">Welcome to Hacklabvify</div>
              <div className="empty-sub">
                Your AI Startup Co-Founder (Problem Statement 10). Select a demo preset or configure your startup profile on the left to activate strategy playbooks.
              </div>
            </div>
          ) : (
            <div className="chat-container">
              {filteredMessages.map((msg, idx) => (
                <div key={idx} className={`message-wrapper ${msg.role}`}>
                  <div className={`bubble ${msg.role}`}>
                    {msg.role === 'assistant' ? parseMarkdown(msg.content) : msg.content}
                  </div>
                  <div className="msg-meta">
                    <span className="msg-time">{formatTime(msg.ts)}</span>
                    {msg.role === 'assistant' && (
                      <div className="msg-actions">
                        <button className="msg-btn" onClick={() => handleCopyMessage(msg.content)} title="Copy message">
                          <CopyIcon /> Copy
                        </button>
                        <button className="msg-btn" onClick={() => handleSaveInsight(msg.content)} title="Save insight">
                          Bookmark
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="message-wrapper assistant">
                  <div className="bubble assistant" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>AI Co-Founder analyzing strategy</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}

          {/* Input Bar */}
          <div className="input-bar">
            <div className="input-wrapper">
              <button
                className="btn-mic"
                onClick={toggleVoiceInput}
                title={isListening ? 'Stop listening' : 'Voice dictation'}
              >
                <MicIcon active={isListening} />
              </button>
              <textarea
                ref={textareaRef}
                className="chat-textarea"
                rows={1}
                placeholder={contextSet ? "Ask your co-founder anything (e.g. 'How do we lower CAC?')..." : "Initialize startup profile on the left first..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!contextSet || loading}
              />
            </div>
            <button
              className="btn-send"
              onClick={handleSend}
              disabled={!input.trim() || !contextSet || loading}
              title="Send message"
            >
              ⚡
            </button>
          </div>
        </main>
      </div>
    </>
  );
}