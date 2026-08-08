// src/config/constants.js
// All application-wide constants. No React. No UI dependencies.

export const GEMINI_MODEL = 'gemini-2.5-flash';
export const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export const getGeminiUrl = (apiKey, model = GEMINI_MODEL) =>
  `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

export const STAGE_OPTIONS = ['Idea', 'MVP', 'Beta', 'Revenue', 'Scaling'];

export const LANGUAGES = [
  { code: 'English', label: 'English' },
  { code: 'Spanish', label: 'Español' },
  { code: 'French', label: 'Français' },
  { code: 'German', label: 'Deutsch' },
  { code: 'Hindi', label: 'Hindi' },
  { code: 'Japanese', label: '日本語' },
  { code: 'Chinese (Simplified)', label: '简体中文' },
  { code: 'Portuguese', label: 'Português' },
];

export const ADVISOR_PERSONAS = [
  {
    id: 'yc_partner',
    name: 'YC Partner',
    icon: '✦',
    desc: 'Radical candor, PMF velocity, retention cohorts & unit economics focus',
  },
  {
    id: 'risk_expert',
    name: 'Risk & Legal Expert',
    icon: '🛡️',
    desc: 'IP protection, terms of service, AI liability, GDPR/SOC2 compliance & governance',
  },
  {
    id: 'growth_guru',
    name: 'Growth Lead',
    icon: '📈',
    desc: 'Viral loops, product-led growth (PLG), CAC/LTV & sales funnel acceleration',
  },
];

export const QUICK_SUGGESTIONS = [
  { label: '✦ Top 3 Actions', prompt: 'Give me the top 3 immediate actionable execution steps for our startup this week.' },
  { label: '🔍 Market Research', prompt: 'Give me a comprehensive Market Research overview (TAM/SAM/SOM, trends, target customer segments).' },
  { label: '🏆 Competitors & Moat', prompt: 'Analyze the top 5 competitors, key differentiators, and our competitive moat.' },
  { label: '💰 Pitch Deck Outline', prompt: 'Create a complete 10-slide pitch deck outline with slide titles and key bullet points.' },
  { label: '📊 Runway Analysis', prompt: 'Analyze our unit economics, CAC/LTV, burn rate, and runway optimization strategies.' },
];

export const PRESET_STARTUPS = [
  { name: 'DevPulse AI', industry: 'DevTools & AI', stage: 'MVP', tagline: 'Automated PR code reviews and security audits' },
  { name: 'MediMind', industry: 'HealthTech & AI', stage: 'Idea', tagline: 'AI clinical triage assistant for rural health clinics' },
  { name: 'PayFlow Global', industry: 'FinTech', stage: 'Revenue', tagline: 'Cross-border B2B payouts for remote engineering teams' },
];

export const INITIAL_PITCH_SLIDES = [
  { id: 1, title: '1. Problem', detail: 'Founders lack immediate, data-driven co-founder advisory for critical strategic decisions.' },
  { id: 2, title: '2. Solution', detail: 'FounderNexus: AI Co-Founder providing real-time market research, pitch outlines & financial runway modeling.' },
  { id: 3, title: '3. Market Size (TAM)', detail: 'TAM: $45B Global Startup Software Market | SAM: $8.2B Founder Tooling | SOM: $1.2B AI Copilots.' },
  { id: 4, title: '4. Product & Demo', detail: 'Dual-Column IDE Co-Founder Workspace, speech-to-text, live runway modeler & 1-click strategy playbooks.' },
  { id: 5, title: '5. Business Model', detail: 'B2B SaaS Tiered Subscriptions ($49/mo Pro, $199/mo Scale, Enterprise Custom API).' },
  { id: 6, title: '6. Competitive Moat', detail: 'Persistent Company Brain with deep context integration and live financial unit economics.' },
  { id: 7, title: '7. Go-To-Market', detail: 'Product-led growth, developer community viral loops, YC/Techstars accelerator partnerships.' },
  { id: 8, title: '8. Financial Projections', detail: 'ARR Growth: Year 1 $350k, Year 2 $1.8M, Year 3 $5.5M with 82% Gross Margins.' },
  { id: 9, title: '9. Team', detail: 'Team CYBERNEX — AI Engineers & Product Designers specialized in LLM Agent System Architectures.' },
  { id: 10, title: '10. The Ask', detail: 'Seeking $500k Pre-Seed to accelerate model fine-tuning, distribution partnerships & team expansion.' },
];

// Default financial values used on first load
export const FINANCIAL_DEFAULTS = {
  cashBalance: 120000,
  monthlyExpenses: 15000,
  monthlyRevenue: 4000,
  arpu: 120,
  cac: 350,
  grossMargin: 82,
  monthlyChurn: 3.5,
  founderInitialPct: 85,
  esopPoolPct: 15,
  safeInvestment: 500000,
  postMoneyCap: 5000000,
};

// Default memo values
export const MEMO_DEFAULTS = {
  memoMonth: 'August 2026',
  memoHighs: 'Hit $18k MRR (+24% MoM); signed 3 enterprise pilot LOIs with YC alumni companies.',
  memoLows: 'Enterprise sales cycle taking 45 days; hiring fullstack engineer took longer than expected.',
  memoAsks: 'Introductions to Series A fintech VCs; warm intros to VPs of Engineering at Series B-D companies.',
};
