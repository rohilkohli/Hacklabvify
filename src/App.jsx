import { useState, useRef, useEffect, useCallback } from 'react';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-3.6-flash';
const getGeminiUrl = (apiKey) => `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey || GEMINI_API_KEY}`;

const STAGE_OPTIONS = ['Idea', 'MVP', 'Beta', 'Revenue', 'Scaling'];

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

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

// ── Toast Notification ───────────────────────────────────────────
function Toast({ message, visible }) {
  return (
    <div className={`toast ${visible ? 'toast-visible' : ''}`}>
      {message}
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────
export default function App() {
  const [startupName, setStartupName] = useState('');
  const [industry, setIndustry] = useState('');
  const [stage, setStage] = useState('Idea');
  const [tagline, setTagline] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [contextSet, setContextSet] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [savedInsights, setSavedInsights] = useState([]);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [msgCount, setMsgCount] = useState(0);

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  const systemContext = `You are an expert startup co-founder, strategist, and advisor. The user is building a startup called "${startupName}" in the ${industry} space, currently at the ${stage} stage${tagline ? `, with the tagline: "${tagline}"` : ''}. Give sharp, actionable, founder-level advice — never generic. Format responses using: **bold** for emphasis, ## for section headings, and bullet points starting with - for lists. Always end with a section ## ⚡ Your Next 3 Actions listing exactly 3 immediate steps the founder can take this week. Keep responses under 350 words and always complete every section fully — never cut off mid-response.`;

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

      const res = await fetch(getGeminiUrl(GEMINI_API_KEY), {
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
      setMessages([...messages, { role: 'assistant', content: '⚠️ Connection error. Check your API key and try again.', ts: Date.now() }]);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [messages, loading, systemContext]);

  const handleStartSession = (e) => {
    e.preventDefault();
    if (!startupName.trim() || !industry.trim()) return;
    setContextSet(true);
    setMessages([{
      role: 'assistant',
      content: `Hey! I'm your AI co-founder for **${startupName.trim()}**. I know your space — **${industry.trim()}** at the **${stage}** stage${tagline ? ` with the vision: "${tagline}"` : ''}. Ask me anything or use a Quick Action to get started. Let's build. ⚡`,
      ts: Date.now(),
    }]);
  };

  const getQuickActionPrompt = (key) => {
    const n = startupName.trim();
    const ind = industry.trim();
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
    setActiveTab('chat');
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

  const handleClearChat = () => {
    setMessages([{
      role: 'assistant',
      content: `Chat cleared. Still here for **${startupName}** — what do you want to tackle next? ⚡`,
      ts: Date.now(),
    }]);
    setMsgCount(0);
  };

  const handleExportChat = () => {
    const text = messages.map((m) => `[${m.role.toUpperCase()}]\n${m.content}`).join('\n\n---\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${startupName.replace(/\s+/g, '-')}-copilot-session.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Chat exported');
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
          width: 268px; flex-shrink: 0;
          background: var(--surface);
          border-right: 1px solid var(--border);
          display: flex; flex-direction: column;
          height: 100vh; overflow: hidden;
        }

        .sidebar-brand {
          padding: 20px 18px 16px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }

        .brand-row { display: flex; align-items: center; gap: 9px; }
        .brand-icon { color: var(--accent); display: flex; align-items: center; }
        .brand-title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 17px; letter-spacing: -0.3px; }
        .brand-sub { font-size: 11px; color: var(--text-secondary); margin-top: 2px; padding-left: 29px; }

        /* ── Sidebar Tabs ── */
        .sidebar-tabs {
          display: flex;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }

        .sidebar-tab {
          flex: 1; padding: 10px 4px;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.04em; text-transform: uppercase;
          color: var(--text-muted);
          background: transparent; border: none;
          cursor: pointer; transition: all 0.2s ease;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
        }

        .sidebar-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
        .sidebar-tab:hover:not(.active) { color: var(--text-secondary); }

        .sidebar-body {
          flex: 1; overflow-y: auto;
          padding: 16px;
          display: flex; flex-direction: column; gap: 16px;
        }

        .sidebar-body::-webkit-scrollbar { width: 3px; }
        .sidebar-body::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

        .section-label {
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--text-muted); margin-bottom: 10px;
        }

        /* ── Form ── */
        .form-group { display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px; }
        .form-label { font-size: 11px; font-weight: 500; color: var(--text-secondary); }

        .form-input, .form-select {
          width: 100%;
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 9px 11px;
          font-family: 'Inter', sans-serif;
          font-size: 13px; color: var(--text-primary);
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
          background-position: right 11px center;
          padding-right: 30px;
        }
        .form-select option { background: var(--surface-2); }

        .char-count { font-size: 10px; color: var(--text-muted); text-align: right; margin-top: 2px; }

        .btn-primary {
          width: 100%; background: var(--accent); color: #fff;
          border: none; border-radius: 8px;
          padding: 10px 16px;
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.2s ease; margin-top: 2px;
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }

        .btn-primary:hover:not(:disabled) { filter: brightness(1.1); box-shadow: 0 0 20px var(--accent-glow); }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── Context Card ── */
        .context-card {
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 10px; padding: 12px;
        }

        .context-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .context-name { font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 600; }
        .context-tagline { font-size: 11px; color: var(--text-secondary); margin-bottom: 8px; font-style: italic; }

        .btn-edit {
          background: transparent; border: 1px solid var(--border);
          border-radius: 5px; color: var(--text-secondary);
          font-size: 10px; font-family: 'Inter', sans-serif;
          padding: 3px 7px; cursor: pointer; transition: all 0.2s ease;
        }
        .btn-edit:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-glow); }

        .context-pills { display: flex; flex-wrap: wrap; gap: 5px; }
        .pill {
          font-size: 10px; font-family: 'JetBrains Mono', monospace;
          padding: 2px 7px; border-radius: 5px;
          background: var(--bg); border: 1px solid var(--border);
          color: var(--text-secondary);
        }
        .pill.teal { color: var(--accent-2); border-color: rgba(0,212,170,0.3); background: rgba(0,212,170,0.08); }
        .pill.blue { color: var(--accent); border-color: rgba(59,111,255,0.3); background: rgba(59,111,255,0.08); }

        /* ── Session Stats ── */
        .session-stats {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 6px; margin-top: 10px;
        }
        .stat-box {
          background: var(--bg); border: 1px solid var(--border);
          border-radius: 7px; padding: 8px 10px; text-align: center;
        }
        .stat-num { font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 500; color: var(--accent); }
        .stat-label { font-size: 9px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 1px; }

        /* ── Quick Actions ── */
        .quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }

        .btn-action {
          display: flex; flex-direction: column; align-items: flex-start;
          gap: 3px; background: var(--surface-2);
          border: 1px solid var(--border); border-radius: 8px;
          padding: 9px 10px; cursor: pointer;
          text-align: left; transition: all 0.2s ease;
        }
        .btn-action:hover:not(:disabled) {
          border-color: var(--accent);
          background: var(--accent-glow);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .btn-action:disabled { opacity: 0.35; cursor: not-allowed; }
        .btn-action-icon { font-size: 15px; line-height: 1; }
        .btn-action-label { font-size: 10px; font-weight: 600; color: var(--text-secondary); line-height: 1.3; }

        /* ── Saved Insights ── */
        .insight-item {
          background: var(--surface-2); border: 1px solid var(--border);
          border-radius: 8px; padding: 10px 12px;
          display: flex; flex-direction: column; gap: 6px;
        }
        .insight-text { font-size: 12px; color: var(--text-secondary); line-height: 1.5; }
        .insight-actions { display: flex; gap: 6px; justify-content: flex-end; }
        .btn-icon {
          background: transparent; border: 1px solid var(--border);
          border-radius: 5px; color: var(--text-muted);
          padding: 4px 7px; cursor: pointer; font-size: 11px;
          display: flex; align-items: center; gap: 4px;
          transition: all 0.2s ease; font-family: 'Inter', sans-serif;
        }
        .btn-icon:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-glow); }
        .btn-icon.danger:hover { border-color: var(--danger); color: var(--danger); background: rgba(255,77,109,0.1); }

        .empty-insights {
          text-align: center; padding: 24px 12px;
          font-size: 12px; color: var(--text-muted);
        }

        /* ── Sidebar Footer ── */
        .sidebar-footer {
          padding: 12px 16px;
          border-top: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0;
        }
        .footer-text { font-size: 10px; color: var(--text-muted); }
        .footer-actions { display: flex; gap: 5px; }

        /* ── Main ── */
        .main {
          flex: 1; display: flex; flex-direction: column;
          height: 100vh; overflow: hidden; position: relative;
        }

        .ambient-glow {
          position: absolute; top: 40%; left: 50%;
          transform: translate(-50%, -50%);
          width: 700px; height: 700px;
          background: radial-gradient(circle, rgba(59,111,255,0.08) 0%, transparent 65%);
          pointer-events: none; z-index: 0;
          animation: ambientPulse 7s ease-in-out infinite alternate;
        }

        @keyframes ambientPulse {
          0% { transform: translate(-50%,-50%) scale(1); opacity: 0.6; }
          50% { transform: translate(-47%,-53%) scale(1.1); opacity: 1; }
          100% { transform: translate(-53%,-47%) scale(0.92); opacity: 0.7; }
        }

        /* ── Chat Header ── */
        .chat-header {
          position: relative; z-index: 1;
          padding: 16px 24px;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0;
          gap: 12px;
        }

        .chat-header-left { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .chat-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 17px; font-weight: 700; letter-spacing: -0.3px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .chat-subtitle { font-size: 12px; color: var(--text-secondary); }

        .chat-header-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

        .search-bar {
          background: var(--surface-2);
          border: 1px solid var(--border);
          border-radius: 7px; padding: 6px 10px;
          font-family: 'Inter', sans-serif; font-size: 12px;
          color: var(--text-primary); outline: none;
          width: 160px; transition: all 0.2s ease;
        }
        .search-bar::placeholder { color: var(--text-muted); }
        .search-bar:focus { border-color: var(--accent); width: 200px; box-shadow: 0 0 0 2px var(--accent-glow); }

        .live-badge { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--text-secondary); font-family: 'JetBrains Mono', monospace; }
        .live-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--success); animation: livePulse 2s ease-in-out infinite; }

        @keyframes livePulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
          50% { opacity: 0.7; box-shadow: 0 0 0 4px rgba(34,197,94,0); }
        }

        /* ── Main Tabs ── */
        .main-tabs {
          display: flex; gap: 0;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
          padding: 0 24px;
          position: relative; z-index: 1;
          flex-shrink: 0;
        }

        .main-tab {
          padding: 10px 16px; font-size: 12px; font-weight: 600;
          letter-spacing: 0.03em; text-transform: uppercase;
          color: var(--text-muted); background: transparent;
          border: none; cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 2px solid transparent; margin-bottom: -1px;
        }
        .main-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
        .main-tab:hover:not(.active) { color: var(--text-secondary); }
        .main-tab .tab-badge {
          background: var(--accent); color: white;
          font-size: 9px; padding: 1px 5px;
          border-radius: 10px; margin-left: 5px;
          font-weight: 700;
        }

        /* ── Chat Thread ── */
        .chat-thread {
          position: relative; z-index: 1; flex: 1;
          overflow-y: auto; scroll-behavior: smooth;
          padding: 20px 24px;
          display: flex; flex-direction: column; gap: 14px;
        }

        .chat-thread::-webkit-scrollbar { width: 5px; }
        .chat-thread::-webkit-scrollbar-thumb { background: var(--border); border-radius: 5px; }

        /* ── Empty State ── */
        .empty-state {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center; gap: 12px; padding: 40px;
        }
        .empty-icon { font-size: 52px; color: var(--accent); line-height: 1; filter: drop-shadow(0 0 20px rgba(59,111,255,0.4)); }
        .empty-heading { font-family: 'Space Grotesk', sans-serif; font-size: 20px; font-weight: 700; }
        .empty-sub { font-size: 13px; color: var(--text-secondary); max-width: 340px; line-height: 1.6; }

        /* ── Messages ── */
        .message-row { display: flex; width: 100%; }
        .message-row.user { justify-content: flex-end; }
        .message-row.assistant { justify-content: flex-start; }

        .message-wrapper { display: flex; flex-direction: column; max-width: 74%; gap: 4px; }
        .message-row.user .message-wrapper { align-items: flex-end; }
        .message-row.assistant .message-wrapper { align-items: flex-start; }

        .bubble {
          font-size: 13.5px; line-height: 1.7;
          transition: all 0.15s ease; position: relative;
        }
        .bubble.user {
          background: var(--accent); color: #fff;
          padding: 11px 15px;
          border-radius: 14px 14px 4px 14px;
        }
        .bubble.assistant {
          background: var(--surface-2);
          border: 1px solid var(--border);
          color: var(--text-primary);
          padding: 14px 18px;
          border-radius: 4px 14px 14px 14px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.2);
        }
        .bubble.assistant:hover { border-color: var(--border-2); }

        .bubble.assistant .md-heading {
          font-weight: 600; color: var(--text-primary);
          margin: 10px 0 5px; font-size: 13px;
          letter-spacing: 0.01em;
        }
        .bubble.assistant .md-heading:first-child { margin-top: 0; }
        .bubble.assistant .md-paragraph { margin-bottom: 6px; }
        .bubble.assistant .md-paragraph:last-child { margin-bottom: 0; }
        .bubble.assistant .md-list { margin: 5px 0 8px 16px; list-style: disc; }
        .bubble.assistant .md-list li { margin-bottom: 3px; color: var(--text-primary); font-size: 13.5px; }
        .bubble.assistant strong { color: var(--text-primary); font-weight: 600; }

        .msg-meta { display: flex; align-items: center; gap: 6px; }
        .msg-time { font-size: 10px; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; }
        .msg-actions { display: flex; gap: 3px; opacity: 0; transition: opacity 0.15s ease; }
        .message-wrapper:hover .msg-actions { opacity: 1; }
        .msg-btn {
          background: var(--surface-3); border: 1px solid var(--border);
          border-radius: 5px; color: var(--text-muted);
          padding: 3px 6px; cursor: pointer; font-size: 10px;
          display: flex; align-items: center; gap: 3px;
          transition: all 0.15s ease; font-family: 'Inter', sans-serif;
        }
        .msg-btn:hover { color: var(--accent); border-color: var(--accent); background: var(--accent-glow); }

        .highlight { background: rgba(59,111,255,0.2); border-radius: 3px; padding: 0 2px; }

        /* ── Typing Indicator ── */
        .typing-indicator { display: flex; align-items: center; gap: 4px; padding: 2px 0; }
        .typing-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text-secondary); animation: typingBounce 1.3s ease-in-out infinite; }
        .typing-dot:nth-child(2) { animation-delay: 0.18s; }
        .typing-dot:nth-child(3) { animation-delay: 0.36s; }

        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
          30% { transform: translateY(-7px); opacity: 1; }
        }

        /* ── Input Bar ── */
        .input-bar {
          position: relative; z-index: 1;
          padding: 14px 24px 16px;
          background: var(--surface);
          border-top: 1px solid var(--border);
          flex-shrink: 0;
        }

        .input-inner { display: flex; align-items: flex-end; gap: 8px; }

        .chat-textarea {
          flex: 1; background: var(--surface-2);
          border: 1px solid var(--border); border-radius: 10px;
          padding: 10px 14px;
          font-family: 'Inter', sans-serif; font-size: 13.5px;
          color: var(--text-primary); resize: none; outline: none;
          line-height: 1.5; min-height: 42px; max-height: 120px;
          overflow-y: auto; transition: all 0.2s ease;
        }
        .chat-textarea::placeholder { color: var(--text-muted); }
        .chat-textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }
        .chat-textarea:disabled { opacity: 0.45; cursor: not-allowed; }

        .btn-send {
          width: 42px; height: 42px; flex-shrink: 0;
          background: var(--accent); border: none; border-radius: 10px;
          color: #fff; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s ease;
        }
        .btn-send:hover:not(:disabled) { filter: brightness(1.1); box-shadow: 0 0 16px var(--accent-glow); }
        .btn-send:disabled { opacity: 0.35; cursor: not-allowed; }

        .input-hint { font-size: 10px; color: var(--text-muted); margin-top: 6px; padding-left: 2px; }

        /* ── Prompt Suggestions ── */
        .prompt-suggestions {
          display: flex; gap: 6px; flex-wrap: wrap;
          padding: 0 24px 10px; position: relative; z-index: 1;
        }
        .prompt-chip {
          background: var(--surface-2); border: 1px solid var(--border);
          border-radius: 20px; padding: 4px 12px;
          font-size: 11px; color: var(--text-secondary);
          cursor: pointer; transition: all 0.15s ease;
          white-space: nowrap;
        }
        .prompt-chip:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-glow); }

        /* ── Overview Tab ── */
        .overview-panel {
          position: relative; z-index: 1;
          flex: 1; overflow-y: auto;
          padding: 24px;
        }
        .overview-panel::-webkit-scrollbar { width: 5px; }
        .overview-panel::-webkit-scrollbar-thumb { background: var(--border); border-radius: 5px; }

        .overview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; }

        .stat-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 12px; padding: 16px 18px;
        }
        .stat-card-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
        .stat-card-val { font-family: 'Space Grotesk', sans-serif; font-size: 26px; font-weight: 700; color: var(--accent); }
        .stat-card-sub { font-size: 11px; color: var(--text-secondary); margin-top: 3px; }

        .overview-section { margin-bottom: 20px; }
        .overview-section-title { font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 600; margin-bottom: 10px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.06em; }

        .progress-item { margin-bottom: 10px; }
        .progress-label { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-secondary); margin-bottom: 5px; }
        .progress-bar-bg { background: var(--surface-2); border-radius: 6px; height: 6px; overflow: hidden; }
        .progress-bar-fill { height: 100%; border-radius: 6px; background: var(--accent); transition: width 0.6s ease; }

        .tag-grid { display: flex; flex-wrap: wrap; gap: 6px; }
        .tag {
          padding: 4px 10px; border-radius: 6px;
          font-size: 11px; font-weight: 500;
          background: var(--surface-2); border: 1px solid var(--border);
          color: var(--text-secondary);
        }
        .tag.active { background: rgba(59,111,255,0.15); border-color: rgba(59,111,255,0.4); color: var(--accent); }

        /* ── Toast ── */
        .toast {
          position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(20px);
          background: var(--surface-3); border: 1px solid var(--border-2);
          color: var(--text-primary); font-size: 12px; font-weight: 500;
          padding: 8px 18px; border-radius: 20px;
          opacity: 0; transition: all 0.25s ease; z-index: 999;
          pointer-events: none; white-space: nowrap;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        }
        .toast.toast-visible { opacity: 1; transform: translateX(-50%) translateY(0); }

        /* ── Setup screen empty state ── */
        .setup-empty {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center; gap: 16px; padding: 48px 32px;
          position: relative; z-index: 1;
        }
        .setup-empty-icon { font-size: 48px; opacity: 0.3; }
        .setup-empty-title { font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 600; color: var(--text-secondary); }
        .setup-empty-sub { font-size: 13px; color: var(--text-muted); max-width: 300px; line-height: 1.6; }
      `}</style>

      <Toast message={toastMsg} visible={toastVisible} />

      <div className="app-shell">
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="brand-row">
              <span className="brand-icon"><LightningIcon size={18} /></span>
              <span className="brand-title">Hacklabvify</span>
            </div>
            <div className="brand-sub">by Team CYBERNEX • AI Co-Founder</div>
          </div>

          <div className="sidebar-tabs">
            {['context', 'actions', 'saved'].map((tab) => (
              <button key={tab} className={`sidebar-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                {tab === 'context' ? 'Context' : tab === 'actions' ? 'Actions' : `Saved${savedInsights.length > 0 ? ` (${savedInsights.length})` : ''}`}
              </button>
            ))}
          </div>

          <div className="sidebar-body">
            {/* Context Tab */}
            {activeTab === 'context' && (
              <>
                {!contextSet ? (
                  <div>
                    <div className="section-label">Startup Context</div>
                    <form onSubmit={handleStartSession}>
                      <div className="form-group">
                        <label className="form-label">Startup Name</label>
                        <input className="form-input" type="text" value={startupName} onChange={(e) => setStartupName(e.target.value)} placeholder="Your startup name" required maxLength={50} />
                        <div className="char-count">{startupName.length}/50</div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Industry / Domain</label>
                        <input className="form-input" type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. FinTech, HealthTech, EdTech" required maxLength={60} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">One-line Tagline <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                        <input className="form-input" type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="e.g. Stripe for insurance claims" maxLength={80} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Stage</label>
                        <select className="form-select" value={stage} onChange={(e) => setStage(e.target.value)}>
                          {STAGE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <button type="submit" className="btn-primary" disabled={!startupName.trim() || !industry.trim()}>
                        <LightningIcon size={14} /> Launch Session
                      </button>
                    </form>
                  </div>
                ) : (
                  <div>
                    <div className="section-label">Active Session</div>
                    <div className="context-card">
                      <div className="context-card-header">
                        <span className="context-name">{startupName}</span>
                        <button className="btn-edit" onClick={() => { setContextSet(false); setMessages([]); setMsgCount(0); }}>Edit</button>
                      </div>
                      {tagline && <div className="context-tagline">"{tagline}"</div>}
                      <div className="context-pills">
                        <span className="pill">{industry}</span>
                        <span className="pill teal">{stage}</span>
                      </div>
                      <div className="session-stats">
                        <div className="stat-box">
                          <div className="stat-num">{messages.length}</div>
                          <div className="stat-label">Messages</div>
                        </div>
                        <div className="stat-box">
                          <div className="stat-num">{savedInsights.length}</div>
                          <div className="stat-label">Saved</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Actions Tab */}
            {activeTab === 'actions' && (
              <div>
                <div className="section-label">Quick Actions</div>
                {!contextSet ? (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                    Set up your startup context first to unlock actions.
                  </div>
                ) : (
                  <div className="quick-grid">
                    {QUICK_ACTIONS.map((action) => (
                      <button key={action.key} className="btn-action" onClick={() => handleQuickAction(action.key)} disabled={loading}>
                        <span className="btn-action-icon">{action.icon}</span>
                        <span className="btn-action-label">{action.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Saved Tab */}
            {activeTab === 'saved' && (
              <div>
                <div className="section-label">Saved Insights</div>
                {savedInsights.length === 0 ? (
                  <div className="empty-insights">
                    Save AI responses you want to revisit — hover a message and click Save.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {savedInsights.map((ins) => (
                      <div key={ins.id} className="insight-item">
                        <div className="insight-text">{ins.snippet}</div>
                        <div className="insight-actions">
                          <button className="btn-icon" onClick={() => handleCopyMessage(ins.full)}>
                            <CopyIcon /> Copy
                          </button>
                          <button className="btn-icon danger" onClick={() => handleDeleteInsight(ins.id)}>
                            <TrashIcon /> Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="sidebar-footer">
            <div>
              <div className="footer-text">Built for HackLabify V1.0</div>
              <div className="footer-text">Powered by Gemini</div>
            </div>
            {contextSet && (
              <div className="footer-actions">
                <button className="btn-icon" title="Export chat" onClick={handleExportChat}>
                  <ExportIcon />
                </button>
                <button className="btn-icon danger" title="Clear chat" onClick={handleClearChat}>
                  <TrashIcon />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ── Main Area ── */}
        <main className="main">
          <div className="ambient-glow" aria-hidden="true" />

          {/* Header */}
          <header className="chat-header">
            <div className="chat-header-left">
              <h1 className="chat-title">{contextSet ? startupName : 'AI Startup Copilot'}</h1>
              <p className="chat-subtitle">{contextSet ? `${industry} · ${stage} stage` : 'Your AI co-founder is ready'}</p>
            </div>
            <div className="chat-header-right">
              {contextSet && (
                <input
                  className="search-bar"
                  type="text"
                  placeholder="Search chat…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              )}
              <div className="live-badge">
                <span className="live-dot" />
                Live
              </div>
            </div>
          </header>

          {/* Main Tabs */}
          {contextSet && (
            <div className="main-tabs">
              <button className={`main-tab ${activeTab !== 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('context')}>
                Chat {msgCount > 0 && <span className="tab-badge">{msgCount}</span>}
              </button>
              <button className={`main-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                Overview
              </button>
            </div>
          )}

          {/* Overview Panel */}
          {activeTab === 'overview' && contextSet && (
            <div className="overview-panel">
              <div className="overview-grid">
                <div className="stat-card">
                  <div className="stat-card-label">Startup</div>
                  <div className="stat-card-val" style={{ fontSize: 18 }}>{startupName}</div>
                  <div className="stat-card-sub">{industry}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-label">Stage</div>
                  <div className="stat-card-val" style={{ fontSize: 18 }}>{stage}</div>
                  <div className="stat-card-sub">Current phase</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-label">Messages</div>
                  <div className="stat-card-val">{messages.length}</div>
                  <div className="stat-card-sub">This session</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-label">Saved Insights</div>
                  <div className="stat-card-val">{savedInsights.length}</div>
                  <div className="stat-card-sub">Bookmarked</div>
                </div>
              </div>

              <div className="overview-section">
                <div className="overview-section-title">Copilot Coverage</div>
                {[
                  { label: 'Market Research', key: 'market', pct: messages.some(m => m.content.includes('TAM')) ? 100 : 0 },
                  { label: 'Competitor Analysis', key: 'competitor', pct: messages.some(m => m.content.toLowerCase().includes('competitor')) ? 100 : 0 },
                  { label: 'Go-to-Market', key: 'gtm', pct: messages.some(m => m.content.toLowerCase().includes('go-to-market') || m.content.toLowerCase().includes('launch')) ? 100 : 0 },
                  { label: 'Fundraising', key: 'fundraising', pct: messages.some(m => m.content.toLowerCase().includes('pitch') || m.content.toLowerCase().includes('investor')) ? 100 : 0 },
                  { label: 'Risk Assessment', key: 'risk', pct: messages.some(m => m.content.toLowerCase().includes('risk')) ? 100 : 0 },
                ].map((item) => (
                  <div className="progress-item" key={item.key}>
                    <div className="progress-label">
                      <span>{item.label}</span>
                      <span style={{ color: item.pct ? 'var(--accent-2)' : 'var(--text-muted)' }}>{item.pct ? 'Done ✓' : 'Pending'}</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${item.pct}%`, background: item.pct ? 'var(--accent-2)' : 'var(--border)' }} />
                    </div>
                  </div>
                ))}
              </div>

              {tagline && (
                <div className="overview-section">
                  <div className="overview-section-title">Vision</div>
                  <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: 14, padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, borderLeft: '3px solid var(--accent)' }}>
                    "{tagline}"
                  </div>
                </div>
              )}

              <div className="overview-section">
                <div className="overview-section-title">Quick Launch</div>
                <div className="tag-grid">
                  {QUICK_ACTIONS.map((a) => (
                    <button key={a.key} className="tag" style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                      onClick={() => { setActiveTab('context'); handleQuickAction(a.key); }}>
                      {a.icon} {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Chat Thread */}
          {activeTab !== 'overview' && (
            <>
              <div className="chat-thread">
                {!contextSet ? (
                  <div className="setup-empty">
                    <div className="setup-empty-icon">⚡</div>
                    <div className="setup-empty-title">Ready to build something great?</div>
                    <div className="setup-empty-sub">Fill in your startup details in the sidebar to launch your AI co-founder session.</div>
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">⚡</div>
                    <h2 className="empty-heading">No results for "{searchQuery}"</h2>
                    <p className="empty-sub">Try a different search term.</p>
                  </div>
                ) : (
                  <>
                    {filteredMessages.map((msg, i) => (
                      <div key={i} className={`message-row ${msg.role}`}>
                        <div className="message-wrapper">
                          <div className={`bubble ${msg.role}`}>
                            {msg.role === 'assistant' ? parseMarkdown(msg.content) : msg.content}
                          </div>
                          <div className="msg-meta">
                            {msg.ts && <span className="msg-time">{formatTime(msg.ts)}</span>}
                            <div className="msg-actions">
                              <button className="msg-btn" onClick={() => handleCopyMessage(msg.content)}>
                                <CopyIcon /> Copy
                              </button>
                              {msg.role === 'assistant' && (
                                <button className="msg-btn" onClick={() => handleSaveInsight(msg.content)}>
                                  ★ Save
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="message-row assistant">
                        <div className="message-wrapper">
                          <div className="bubble assistant">
                            <div className="typing-indicator">
                              <span className="typing-dot" />
                              <span className="typing-dot" />
                              <span className="typing-dot" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </>
                )}
              </div>

              {/* Prompt Suggestions */}
              {contextSet && !loading && messages.length < 3 && (
                <div className="prompt-suggestions">
                  {[
                    `What's my biggest risk right now?`,
                    `How should I price ${startupName}?`,
                    `Who is my ideal first customer?`,
                    `What metrics matter most at ${stage} stage?`,
                  ].map((chip, i) => (
                    <button key={i} className="prompt-chip" onClick={() => callGemini(chip)}>{chip}</button>
                  ))}
                </div>
              )}

              {/* Input Bar */}
              <div className="input-bar">
                <div className="input-inner">
                  <textarea
                    ref={textareaRef}
                    className="chat-textarea"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={contextSet ? 'Ask your co-founder anything…' : 'Set up your startup context to begin…'}
                    disabled={!contextSet || loading}
                    rows={1}
                  />
                  <button className="btn-send" onClick={handleSend} disabled={!contextSet || loading || !input.trim()}>
                    <SendIcon />
                  </button>
                </div>
                <div className="input-hint">Enter to send · Shift+Enter for new line</div>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}