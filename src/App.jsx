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

const UI_TRANSLATIONS = {
  English: {
    heroTitle: 'FounderNexus',
    heroTagline: 'Thoughtful strategic intelligence for founders building with clarity and conviction.',
    marketResearch: 'Market Research',
    marketResearchDesc: 'TAM/SAM/SOM breakdown & target customer profiles',
    competitorAnalysis: 'Competitor Analysis',
    competitorDesc: 'Top 5 competitors & competitive moat definition',
    pitchDeck: 'Pitch Deck Outline',
    pitchDeckDesc: '10-slide narrative structure for angel/pre-seed investors',
    runwayCalc: 'Runway Optimization',
    runwayDesc: 'Burn rate analysis & extension tactics',
    founderPlaceholder: "What's your founder name?",
    startupPlaceholder: "What's your startup name? (e.g., Acme AI)",
    startSessionBtn: 'Start Co-Founder Session ✦',
    runway: 'Runway',
    burn: 'Burn',
    clear: 'Clear',
    home: 'Home',
    settings: 'Settings',
    inputPlaceholder: "Ask your co-founder anything (e.g., 'How do we lower CAC?')...",
    toolsTitle: 'Co-Founder Tools',
    tabFinancials: 'Financials',
    tabPitch: 'Pitch Deck',
    tabMemo: 'Investor Update',
    tabSaved: 'Saved',
    unitEconTitle: 'SaaS Unit Economics',
    capTableTitle: 'Cap Table & SAFE Dilution',
    investorMemoTitle: 'YC Monthly Investor Update',
    copyMemoBtn: '📋 Copy Memo',
    polishMemoBtn: '✦ AI Polish',
    quickTips: 'Quick tips for FounderNexus',
    tip1: 'Advisor Tone: Choose your persona in the right panel.',
    tip2: 'Financials: Model runway, CAC/LTV, and SAFE equity dilution.',
    tip3: 'Investor Updates: Generate polished monthly memos in 1 click.',
    orTypeQuestion: 'Or type your strategic question below',
    contextHint: '✦ Ask strategic questions or model your financial runway, unit economics, and pitch deck in real-time.',
  },
  Spanish: {
    heroTitle: 'FounderNexus',
    heroTagline: 'Inteligencia estratégica para fundadores que construyen con claridad y convicción.',
    marketResearch: 'Investigación de Mercado',
    marketResearchDesc: 'Desglose TAM/SAM/SOM y perfiles de clientes objetivo',
    competitorAnalysis: 'Análisis de Competencia',
    competitorDesc: 'Los 5 principales competidores y definición de foso defensivo',
    pitchDeck: 'Estructura de Pitch Deck',
    pitchDeckDesc: 'Estructura narrativa de 10 diapositivas para inversores',
    runwayCalc: 'Optimización de Runway',
    runwayDesc: 'Análisis de tasa de quema y tácticas de extensión',
    founderPlaceholder: '¿Cuál es tu nombre de fundador?',
    startupPlaceholder: '¿Cuál es el nombre de tu startup? (ej. Acme AI)',
    startSessionBtn: 'Iniciar Sesión de Co-Fundador ✦',
    runway: 'Runway',
    burn: 'Quema',
    clear: 'Limpiar',
    home: 'Inicio',
    settings: 'Ajustes',
    inputPlaceholder: 'Pregunta a tu co-fundador cualquier cosa (ej. "¿Cómo reducir CAC?")...',
    toolsTitle: 'Herramientas de Co-Fundador',
    tabFinancials: 'Finanzas',
    tabPitch: 'Pitch Deck',
    tabMemo: 'Reporte Inversor',
    tabSaved: 'Guardados',
    unitEconTitle: 'Unit Economics SaaS',
    capTableTitle: 'Cap Table y Dilución SAFE',
    investorMemoTitle: 'Actualización Mensual YC',
    copyMemoBtn: '📋 Copiar Memo',
    polishMemoBtn: '✦ Pulir con IA',
    quickTips: 'Consejos rápidos para FounderNexus',
    tip1: 'Tono de Asesor: Elige tu persona en el panel derecho.',
    tip2: 'Finanzas: Modela runway, CAC/LTV y dilución de acciones.',
    tip3: 'Reporte Inversor: Genera memos mensuales en 1 clic.',
    orTypeQuestion: 'O escribe tu pregunta estratégica abajo',
    contextHint: '✦ Haz preguntas estratégicas o modela tus finanzas y pitch en tiempo real.',
  },
  French: {
    heroTitle: 'FounderNexus',
    heroTagline: 'Intelligence stratégique pour fondateurs bâtissant avec clarté et conviction.',
    marketResearch: 'Étude de Marché',
    marketResearchDesc: 'Analyse TAM/SAM/SOM et profils clients cibles',
    competitorAnalysis: 'Analyse Concurrentielle',
    competitorDesc: 'Top 5 concurrents et définition du fossé stratégique',
    pitchDeck: 'Structure Pitch Deck',
    pitchDeckDesc: 'Trame narrative en 10 diapositives pour investisseurs',
    runwayCalc: 'Optimisation du Runway',
    runwayDesc: 'Analyse du taux de consommation et stratégies de survie',
    founderPlaceholder: 'Votre nom de fondateur ?',
    startupPlaceholder: 'Nom de votre startup ? (ex. Acme AI)',
    startSessionBtn: 'Démarrer la Session Co-Fondateur ✦',
    runway: 'Runway',
    burn: 'Burn',
    clear: 'Effacer',
    home: 'Accueil',
    settings: 'Paramètres',
    inputPlaceholder: 'Posez votre question stratégique...',
    toolsTitle: 'Outils Co-Fondateur',
    tabFinancials: 'Finances',
    tabPitch: 'Pitch Deck',
    tabMemo: 'Rapport Investisseurs',
    tabSaved: 'Favoris',
    unitEconTitle: 'Unit Economics SaaS',
    capTableTitle: 'Cap Table & Dilution SAFE',
    investorMemoTitle: 'Mémo Mensuel Investisseurs',
    copyMemoBtn: '📋 Copier le Mémo',
    polishMemoBtn: '✦ Polir avec IA',
    quickTips: 'Conseils rapides pour FounderNexus',
    tip1: 'Ton du conseiller : Choisissez votre persona dans le panneau droit.',
    tip2: 'Finances : Calculez runway, LTV/CAC et dilution SAFE.',
    tip3: 'Investisseurs : Rédigez vos mémos mensuels en 1 clic.',
    orTypeQuestion: 'Ou écrivez votre question stratégique ci-dessous',
    contextHint: '✦ Posez des questions stratégiques ou modélisez vos finances en temps réel.',
  },
  German: {
    heroTitle: 'FounderNexus',
    heroTagline: 'Strategische Intelligenz für Gründer mit Klarheit und Überzeugung.',
    marketResearch: 'Marktforschung',
    marketResearchDesc: 'TAM/SAM/SOM-Aufschlüsselung & Zielkundenprofile',
    competitorAnalysis: 'Wettbewerbsanalyse',
    competitorDesc: 'Top 5 Konkurrenten & strategischer Burggraben',
    pitchDeck: 'Pitch Deck Gliederung',
    pitchDeckDesc: '10-Folien-Investorenerzählung für Pre-Seed',
    runwayCalc: 'Runway-Optimierung',
    runwayDesc: 'Burn-Rate-Analyse & Verlängerungstaktiken',
    founderPlaceholder: 'Wie heißt du als Gründer?',
    startupPlaceholder: 'Name deines Startups? (z.B. Acme AI)',
    startSessionBtn: 'Co-Founder Session Starten ✦',
    runway: 'Runway',
    burn: 'Burn',
    clear: 'Löschen',
    home: 'Startseite',
    settings: 'Einstellungen',
    inputPlaceholder: 'Frag deinen KI-Mitgründer alles...',
    toolsTitle: 'Mitgründer-Tools',
    tabFinancials: 'Finanzen',
    tabPitch: 'Pitch Deck',
    tabMemo: 'Investoren-Update',
    tabSaved: 'Gespeichert',
    unitEconTitle: 'SaaS Unit Economics',
    capTableTitle: 'Cap Table & SAFE Verwässerung',
    investorMemoTitle: 'Monatliches YC Update',
    copyMemoBtn: '📋 Memo kopieren',
    polishMemoBtn: '✦ KI Verfeinerung',
    quickTips: 'Schnelltipps für FounderNexus',
    tip1: 'Berater-Ton: Wähle deine Persona im rechten Bereich.',
    tip2: 'Finanzen: Berechne Burn-Rate, LTV/CAC und Verwässerung.',
    tip3: 'Investoren: Erstelle monatliche Updates mit einem Klick.',
    orTypeQuestion: 'Oder schreibe deine strategische Frage unten',
    contextHint: '✦ Stelle strategische Fragen oder modelliere Finanzen und Pitch in Echtzeit.',
  },
  Hindi: {
    heroTitle: 'FounderNexus',
    heroTagline: 'स्पष्टता और दृढ़ विश्वास के साथ निर्माण करने वाले संस्थापकों के लिए रणनीतिक बुद्धिमत्ता।',
    marketResearch: 'मार्केट रिसर्च',
    marketResearchDesc: 'TAM/SAM/SOM विश्लेषण और लक्षित ग्राहक प्रोफ़ाइल',
    competitorAnalysis: 'प्रतियोगी विश्लेषण',
    competitorDesc: 'शीर्ष 5 प्रतिस्पर्धी और सुरक्षात्मक खाई (Moat)',
    pitchDeck: 'पिच डेक रूपरेखा',
    pitchDeckDesc: 'निवेशकों के लिए 10-स्लाइड की कथा संरचना',
    runwayCalc: 'रनवे अनुकूलन',
    runwayDesc: 'बर्न रेट विश्लेषण और विस्तार रणनीति',
    founderPlaceholder: 'आपका नाम क्या है?',
    startupPlaceholder: 'आपके स्टार्टअप का नाम? (जैसे Acme AI)',
    startSessionBtn: 'सह-संस्थापक सत्र प्रारंभ करें ✦',
    runway: 'रनवे',
    burn: 'बर्न',
    clear: 'साफ़ करें',
    home: 'होम',
    settings: 'सेटिंग्स',
    inputPlaceholder: 'अपने सह-संस्थापक से कुछ भी पूछें...',
    toolsTitle: 'सह-संस्थापक उपकरण',
    tabFinancials: 'वित्तीय स्थिति',
    tabPitch: 'पिच डेक',
    tabMemo: 'निवेशक अपडेट',
    tabSaved: 'सहेजे गए',
    unitEconTitle: 'SaaS यूनिट इकोनॉमिक्स',
    capTableTitle: 'कैप टेबल और इक्विटी डाइल्यूशन',
    investorMemoTitle: 'मासिक निवेशक मेमो',
    copyMemoBtn: '📋 मेमो कॉपी करें',
    polishMemoBtn: '✦ AI से बेहतर बनाएं',
    quickTips: 'FounderNexus के लिए त्वरित सुझाव',
    tip1: 'सलाहकार का लहजा: दाएँ पैनल में अपना सलाहकार चुनें।',
    tip2: 'वित्तीय मॉडल: रनवे, LTV/CAC और डाइल्यूशन की गणना करें।',
    tip3: 'निवेशक मेमो: 1-क्लिक में मासिक रिपोर्ट तैयार करें।',
    orTypeQuestion: 'या नीचे अपना रणनीतिक प्रश्न लिखें',
    contextHint: '✦ रणनीतिक प्रश्न पूछें या अपने वित्तीय मॉडल और पिच को वास्तविक समय में तैयार करें।',
  },
  Japanese: {
    heroTitle: 'FounderNexus',
    heroTagline: '明確さと確信を持って構築する創業者のための戦略的インテリジェンス。',
    marketResearch: '市場調査',
    marketResearchDesc: 'TAM/SAM/SOM分析およびターゲット顧客像',
    competitorAnalysis: '競合分析',
    competitorDesc: '上位5社の競合と競争優位性の定義',
    pitchDeck: 'ピッチデック構成',
    pitchDeckDesc: '投資家向けの10スライドのストーリー構成',
    runwayCalc: 'ランウェイ最適化',
    runwayDesc: 'バーンレート分析と資金持続戦術',
    founderPlaceholder: '創業者のお名前は？',
    startupPlaceholder: 'スタートアップ名（例: Acme AI）',
    startSessionBtn: '共同創業者セッションを開始 ✦',
    runway: 'ランウェイ',
    burn: 'バーン',
    clear: 'クリア',
    home: 'ホーム',
    settings: '設定',
    inputPlaceholder: '共同創業者のAIに何でも質問してください...',
    toolsTitle: '共同創業者ツール',
    tabFinancials: '財務モデル',
    tabPitch: 'ピッチデック',
    tabMemo: '投資家レポート',
    tabSaved: '保存済み',
    unitEconTitle: 'SaaS ユニットエコノミクス',
    capTableTitle: 'キャップテーブル & 株式希薄化',
    investorMemoTitle: '月次投資家アップデート',
    copyMemoBtn: '📋 メモをコピー',
    polishMemoBtn: '✦ AIでブラッシュアップ',
    quickTips: 'FounderNexusのクイックヒント',
    tip1: 'アドバイザーのトーン: 右パネルでペルソナを選択。',
    tip2: '財務モデル: ランウェイ、LTV/CAC、希薄化を試算。',
    tip3: '投資家レポート: 1クリックで月次報告書を作成。',
    orTypeQuestion: 'または下に戦略的な質問を入力してください',
    contextHint: '✦ 戦略的な質問をしたり、財務ランウェイやピッチ構成をリアルタイムで分析できます。',
  },
  'Chinese (Simplified)': {
    heroTitle: 'FounderNexus',
    heroTagline: '为充满信念与远见的创业者打造的战略智能伙伴。',
    marketResearch: '市场调研',
    marketResearchDesc: 'TAM/SAM/SOM 拆解及目标客户画像',
    competitorAnalysis: '竞争对手分析',
    competitorDesc: '前5大竞争对手及竞争壁垒定义',
    pitchDeck: '商业计划书大纲',
    pitchDeckDesc: '面向天使/种子轮投资人的10页叙事架构',
    runwayCalc: '跑道优化',
    runwayDesc: '烧钱率分析与跑道延长策略',
    founderPlaceholder: '创始人姓名？',
    startupPlaceholder: '初创公司名称？（如 Acme AI）',
    startSessionBtn: '启动联合创始人会话 ✦',
    runway: '跑道',
    burn: '月烧钱',
    clear: '清除',
    home: '首页',
    settings: '设置',
    inputPlaceholder: '向您的 AI 联合创始人提问（如“如何降低 CAC？”）...',
    toolsTitle: '联合创始人工具箱',
    tabFinancials: '财务模型',
    tabPitch: '商业计划书',
    tabMemo: '投资人月报',
    tabSaved: '收藏',
    unitEconTitle: 'SaaS 商业单元经济模型',
    capTableTitle: '股权结构表与 SAFE 稀释测算',
    investorMemoTitle: 'YC 投资人月度简报',
    copyMemoBtn: '📋 复制月报',
    polishMemoBtn: '✦ AI 润色优化',
    quickTips: 'FounderNexus 快速提示',
    tip1: '顾问基调：在右侧面板选择不同导师角色。',
    tip2: '财务建模：实时测算跑道、LTV/CAC 及股权稀释。',
    tip3: '投资人月报：一键生成标准投资人汇报邮件。',
    orTypeQuestion: '或在下方输入您的战略问题',
    contextHint: '✦ 实时向 AI 联合创始人咨询战略决策或测算财务跑道与商业计划书。',
  },
  Portuguese: {
    heroTitle: 'FounderNexus',
    heroTagline: 'Inteligência estratégica para fundadores que constroem com clareza e convicção.',
    marketResearch: 'Pesquisa de Mercado',
    marketResearchDesc: 'Detalhamento TAM/SAM/SOM e perfis de clientes',
    competitorAnalysis: 'Análise de Concorrentes',
    competitorDesc: 'Top 5 concorrentes e definição de fosso competitivo',
    pitchDeck: 'Estrutura de Pitch Deck',
    pitchDeckDesc: 'Estrutura narrativa de 10 slides para investidores',
    runwayCalc: 'Otimização de Runway',
    runwayDesc: 'Análise de taxa de queima e táticas de extensão',
    founderPlaceholder: 'Qual é o seu nome de fundador?',
    startupPlaceholder: 'Nome da sua startup? (ex: Acme AI)',
    startSessionBtn: 'Iniciar Sessão de Co-Fundador ✦',
    runway: 'Runway',
    burn: 'Queima',
    clear: 'Limpar',
    home: 'Início',
    settings: 'Configurações',
    inputPlaceholder: 'Pergunte qualquer coisa ao seu co-fundador...',
    toolsTitle: 'Ferramentas de Co-Fundador',
    tabFinancials: 'Finanças',
    tabPitch: 'Pitch Deck',
    tabMemo: 'Update Investidores',
    tabSaved: 'Salvos',
    unitEconTitle: 'Unit Economics SaaS',
    capTableTitle: 'Cap Table e Diluição SAFE',
    investorMemoTitle: 'Update Mensal YC',
    copyMemoBtn: '📋 Copiar Memo',
    polishMemoBtn: '✦ Polir com IA',
    quickTips: 'Dicas rápidas para o FounderNexus',
    tip1: 'Tom do Consultor: Escolha sua persona no painel direito.',
    tip2: 'Finanças: Modele runway, LTV/CAC e diluição de equity.',
    tip3: 'Investidores: Gere updates mensais com 1 clique.',
    orTypeQuestion: 'Ou digite sua pergunta estratégica abaixo',
    contextHint: '✦ Faça perguntas estratégicas ou modele seu runway e pitch em tempo real.',
  }
};

const PRESET_STARTUPS = [
  { name: 'DevPulse AI', industry: 'DevTools & AI', stage: 'MVP', tagline: 'Automated PR code reviews and security audits' },
  { name: 'MediMind', industry: 'HealthTech & AI', stage: 'Idea', tagline: 'AI clinical triage assistant for rural health clinics' },
  { name: 'PayFlow Global', industry: 'FinTech', stage: 'Revenue', tagline: 'Cross-border B2B payouts for remote engineering teams' }
];

const ADVISOR_PERSONAS = [
  { id: 'yc_partner', name: 'YC Partner', icon: '✦', desc: 'Radical candor, PMF velocity, retention cohorts & unit economics focus' },
  { id: 'risk_expert', name: 'Risk & Legal Expert', icon: '🛡️', desc: 'IP protection, terms of service, AI liability, GDPR/SOC2 compliance & governance' },
  { id: 'growth_guru', name: 'Growth Lead', icon: '📈', desc: 'Viral loops, product-led growth (PLG), CAC/LTV & sales funnel acceleration' }
];

const QUICK_SUGGESTIONS = [
  { label: '✦ Top 3 Actions', prompt: 'Give me the top 3 immediate actionable execution steps for our startup this week.' },
  { label: '🔍 Market Research', prompt: 'Give me a comprehensive Market Research overview (TAM/SAM/SOM, trends, target customer segments).' },
  { label: '🏆 Competitors & Moat', prompt: 'Analyze the top 5 competitors, key differentiators, and our competitive moat.' },
  { label: '💰 Pitch Deck Outline', prompt: 'Create a complete 10-slide pitch deck outline with slide titles and key bullet points.' },
  { label: '📊 Runway Analysis', prompt: 'Analyze our unit economics, CAC/LTV, burn rate, and runway optimization strategies.' }
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

// ── Markdown Parser (Executive Claude Output Renderer) ───────────
function parseMarkdown(text) {
  if (!text) return null;
  const elements = [];
  let key = 0;

  const parseInline = (str) => {
    if (!str) return '';
    const parts = [];
    const regex = /(\*\*(.+?)\*\*|`([^`]+)`)/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(str.slice(lastIndex, match.index).replace(/\*/g, ''));
      }
      if (match[2]) {
        parts.push(<strong key={`b-${key++}`} className="md-bold">{match[2]}</strong>);
      } else if (match[3]) {
        parts.push(<code key={`c-${key++}`} className="md-code-inline">{match[3]}</code>);
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < str.length) {
      parts.push(str.slice(lastIndex).replace(/\*/g, ''));
    }
    return parts.length === 0 ? '' : parts.length === 1 ? parts[0] : parts;
  };

  const blocks = text.split(/\n{2,}/);
  blocks.forEach((block) => {
    const trimmed = block.trim();
    if (!trimmed) return;
    const lines = trimmed.split('\n');

    // 1. Code Block ```
    if (lines[0].startsWith('```') && lines[lines.length - 1].endsWith('```')) {
      const codeContent = lines.slice(1, lines.length - 1).join('\n');
      elements.push(
        <pre key={`pre-${key++}`} className="md-code-block">
          <code>{codeContent}</code>
        </pre>
      );
      return;
    }

    // 2. Table Block (| Col 1 | Col 2 |)
    if (lines.length >= 2 && lines[0].includes('|') && (lines[1].includes('---') || lines[1].includes('|'))) {
      const headerCells = lines[0].split('|').map((s) => s.trim()).filter(Boolean);
      const rowLines = lines.slice(lines[1].includes('---') ? 2 : 1);
      elements.push(
        <div key={`tbl-wrap-${key++}`} className="md-table-wrapper">
          <table className="md-table">
            <thead>
              <tr>
                {headerCells.map((h, hi) => <th key={hi}>{parseInline(h.replace(/\*\*/g, ''))}</th>)}
              </tr>
            </thead>
            <tbody>
              {rowLines.map((row, ri) => {
                const cells = row.split('|').map((s) => s.trim()).filter(Boolean);
                if (cells.length === 0) return null;
                return (
                  <tr key={ri}>
                    {cells.map((c, ci) => <td key={ci}>{parseInline(c)}</td>)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
      return;
    }

    // 3. Blockquote (> ...)
    if (lines.every((l) => l.trim().startsWith('>'))) {
      const quoteText = lines.map((l) => l.trim().replace(/^>\s?/, '')).join(' ');
      elements.push(
        <blockquote key={`bq-${key++}`} className="md-callout">
          <span className="md-callout-icon">💡</span>
          <div>{parseInline(quoteText)}</div>
        </blockquote>
      );
      return;
    }

    // 4. Single Heading
    if (/^#{1,3}\s/.test(lines[0]) && lines.length === 1) {
      const ht = lines[0].replace(/^#{1,3}\s+/, '').replace(/\*\*/g, '');
      elements.push(<h3 key={`h-${key++}`} className="md-heading">{ht}</h3>);
      return;
    }

    // 5. Numbered List (1. ...)
    const isNumBullet = (l) => /^\d+\.\s/.test(l.trim());
    if (lines.every(isNumBullet)) {
      elements.push(
        <ol key={`ol-${key++}`} className="md-num-list">
          {lines.map((l, i) => (
            <li key={i}>{parseInline(l.trim().replace(/^\d+\.\s+/, ''))}</li>
          ))}
        </ol>
      );
      return;
    }

    // 6. Unordered Bullet List (* or -)
    const isBullet = (l) => /^[-•*]\s/.test(l.trim());
    if (lines.every(isBullet)) {
      elements.push(
        <ul key={`ul-${key++}`} className="md-list">
          {lines.map((l, i) => (
            <li key={i}>{parseInline(l.trim().replace(/^[-•*]\s+/, ''))}</li>
          ))}
        </ul>
      );
      return;
    }

    // 7. Mixed Lines inside a block
    const subElements = [];
    let curList = [];
    let curListType = null;

    const flushCurrentList = () => {
      if (curList.length > 0) {
        if (curListType === 'ol') {
          subElements.push(
            <ol key={`ol-${key++}`} className="md-num-list">
              {curList.map((item, i) => <li key={i}>{parseInline(item)}</li>)}
            </ol>
          );
        } else {
          subElements.push(
            <ul key={`ul-${key++}`} className="md-list">
              {curList.map((item, i) => <li key={i}>{parseInline(item)}</li>)}
            </ul>
          );
        }
        curList = [];
        curListType = null;
      }
    };

    lines.forEach((line) => {
      const t = line.trim();
      if (!t) return;

      if (isBullet(t)) {
        if (curListType && curListType !== 'ul') flushCurrentList();
        curListType = 'ul';
        curList.push(t.replace(/^[-•*]\s+/, ''));
      } else if (isNumBullet(t)) {
        if (curListType && curListType !== 'ol') flushCurrentList();
        curListType = 'ol';
        curList.push(t.replace(/^\d+\.\s+/, ''));
      } else if (/^#{1,3}\s/.test(t)) {
        flushCurrentList();
        subElements.push(<h3 key={`h-${key++}`} className="md-heading">{t.replace(/^#{1,3}\s+/, '').replace(/\*\*/g, '')}</h3>);
      } else if (t.startsWith('>')) {
        flushCurrentList();
        subElements.push(
          <blockquote key={`bq-${key++}`} className="md-callout">
            <span className="md-callout-icon">💡</span>
            <div>{parseInline(t.replace(/^>\s?/, ''))}</div>
          </blockquote>
        );
      } else {
        flushCurrentList();
        subElements.push(<p key={`p-${key++}`} className="md-paragraph">{parseInline(t)}</p>);
      }
    });
    flushCurrentList();

    elements.push(...subElements);
  });

  return elements;
}

// ── Icons ────────────────────────────────────────────────────────
function SunIcon() {
  return (
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
  );
}

function MoonIcon() {
  return (
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

function UpArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

function MicIcon({ active }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill={active ? "#C96442" : "none"} stroke={active ? "#C96442" : "currentColor"} strokeWidth="2">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

{/* CLAUDE DESIGN: Editorial Asterisk / Seal Bot Avatar */}
function BotAvatar({ thinking = false }) {
  return (
    <div className={`claude-avatar${thinking ? ' thinking' : ''}`} title="FounderNexus Co-Founder">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14" strokeLinecap="round" />
      </svg>
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
  const [langOpen, setLangOpen] = useState(false);
  const langDropdownRef = useRef(null);

  const [username, setUsername] = useState(() => localStorage.getItem('hv_user') || 'Rohil Kohli');
  const [startupName, setStartupName] = useState(() => localStorage.getItem('hv_startupName') || 'DevPulse AI');
  const [stage, setStage] = useState(() => localStorage.getItem('hv_stage') || 'MVP');
  const [sessionActive, setSessionActive] = useState(() => localStorage.getItem('hv_session') === 'true');
  const [customApiKey, setCustomApiKey] = useState(() => localStorage.getItem('hv_custom_api_key') || '');
  const [persona, setPersona] = useState(() => localStorage.getItem('hv_persona') || 'yc_partner');
  const [activeRightTab, setActiveRightTab] = useState('financials'); // 'financials' | 'pitch' | 'memo' | 'saved'
  const [showGuideBanner, setShowGuideBanner] = useState(true);
  const [guideExpanded, setGuideExpanded] = useState(false);

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

  // FEATURE 1: SaaS Unit Economics State
  const [arpu, setArpu] = useState(() => Number(localStorage.getItem('hv_arpu')) || 120);
  const [cac, setCac] = useState(() => Number(localStorage.getItem('hv_cac')) || 350);
  const [grossMargin, setGrossMargin] = useState(() => Number(localStorage.getItem('hv_margin')) || 82);
  const [monthlyChurn, setMonthlyChurn] = useState(() => Number(localStorage.getItem('hv_churn')) || 3.5);

  // FEATURE 2: Cap Table & SAFE Dilution Modeler State
  const [founderInitialPct, setFounderInitialPct] = useState(() => Number(localStorage.getItem('hv_founder_pct')) || 85);
  const [esopPoolPct, setEsopPoolPct] = useState(() => Number(localStorage.getItem('hv_esop_pct')) || 15);
  const [safeInvestment, setSafeInvestment] = useState(() => Number(localStorage.getItem('hv_safe_amt')) || 500000);
  const [postMoneyCap, setPostMoneyCap] = useState(() => Number(localStorage.getItem('hv_post_cap')) || 5000000);

  // FEATURE 3: YC Monthly Investor Update & Memo State
  const [memoMonth, setMemoMonth] = useState(() => localStorage.getItem('hv_memo_month') || 'August 2026');
  const [memoHighs, setMemoHighs] = useState(() => localStorage.getItem('hv_memo_highs') || 'Hit $18k MRR (+24% MoM); signed 3 enterprise pilot LOIs with YC alumni companies.');
  const [memoLows, setMemoLows] = useState(() => localStorage.getItem('hv_memo_lows') || 'Enterprise sales cycle taking 45 days; hiring fullstack engineer took longer than expected.');
  const [memoAsks, setMemoAsks] = useState(() => localStorage.getItem('hv_memo_asks') || 'Introductions to Series A fintech VCs; warm intros to VPs of Engineering at Series B-D companies.');

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

  // Close language dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  useEffect(() => { localStorage.setItem('hv_arpu', arpu); }, [arpu]);
  useEffect(() => { localStorage.setItem('hv_cac', cac); }, [cac]);
  useEffect(() => { localStorage.setItem('hv_margin', grossMargin); }, [grossMargin]);
  useEffect(() => { localStorage.setItem('hv_churn', monthlyChurn); }, [monthlyChurn]);
  useEffect(() => { localStorage.setItem('hv_founder_pct', founderInitialPct); }, [founderInitialPct]);
  useEffect(() => { localStorage.setItem('hv_esop_pct', esopPoolPct); }, [esopPoolPct]);
  useEffect(() => { localStorage.setItem('hv_safe_amt', safeInvestment); }, [safeInvestment]);
  useEffect(() => { localStorage.setItem('hv_post_cap', postMoneyCap); }, [postMoneyCap]);
  useEffect(() => { localStorage.setItem('hv_memo_month', memoMonth); }, [memoMonth]);
  useEffect(() => { localStorage.setItem('hv_memo_highs', memoHighs); }, [memoHighs]);
  useEffect(() => { localStorage.setItem('hv_memo_lows', memoLows); }, [memoLows]);
  useEffect(() => { localStorage.setItem('hv_memo_asks', memoAsks); }, [memoAsks]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2200);
  }, []);

  const activePersonaObj = ADVISOR_PERSONAS.find((p) => p.id === persona) || ADVISOR_PERSONAS[0];
  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.English;

  const systemContext = `You are FounderNexus AI Startup Copilot (Problem Statement 10 by Team CYBERNEX).
ROLE: ${activePersonaObj.name} — ${activePersonaObj.desc}.
FOUNDER: "${username}" | STARTUP: "${startupName || 'DevPulse AI'}" (${stage} stage).
LANGUAGE: Respond directly in ${language}.

COGNITIVE PRINCIPLES FOR WORLD-CLASS FOUNDER ADVISORY:
1. Radical Candor & High Conviction: No corporate boilerplate or vague fluff. Provide concrete numbers, benchmarks, and economic formulas whenever relevant (e.g., CAC, LTV, Payback Period, Burn Multiples, Churn, TAM/SAM/SOM).
2. Executive Structure:
   - ## 🎯 Executive Takeaway: 1-2 sentence core thesis and strategic verdict.
   - ## 💡 Strategic Analysis: Deep dive with structured subheadings, Markdown comparison tables (| Option/Metric | Target | Benchmark |), bold terms, and key insights.
   - ## ⚠️ Risks & Moat Watch: Critical blindspots, competitor countermeasures, and defensibility traps.
   - ## ⚡ 7-Day Action Plan: Exactly 3 high-impact execution milestones with clear owners and measurable targets.
3. Formatting Rules:
   - Use ## for main section headings.
   - Use bold **terms** for key vocabulary and metrics.
   - Use markdown tables (| Col 1 | Col 2 |) for comparing options, unit economics, or competitor profiles.
   - Use blockquotes (> 💡 Strategic Insight: ...) for critical executive takeaways.
   - Use inline code (\`$12k/mo\`, \`3.2x LTV\`) for metrics and formulas.
   - Keep tone editorial, rigorous, and inspiring (like a seasoned YC Group Partner & Series A Lead Investor).
   - Keep concise and high-density (under 400 words).`;

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

    let fullPrompt = userMessage.trim();
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
          generationConfig: { maxOutputTokens: 2048, temperature: 0.65, topP: 0.95 },
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
  }, [messages, loading, systemContext, customApiKey, attachedFile]);

  const handleStartMission = (e) => {
    if (e) e.preventDefault();
    if (!username.trim()) return;
    const chosenName = startupName.trim() || 'DevPulse AI';
    setStartupName(chosenName);
    setSessionActive(true);
    if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Welcome **${username.trim()}**! I am your AI Startup Co-Founder for **${chosenName}** (${stage} stage). How can I assist your strategy today?`,
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
      content: `Welcome **${username || 'Founder'}**! Loaded **${preset.name}** (${preset.industry} • ${preset.stage} stage). "${preset.tagline}". Choose a strategy prompt below or ask any question.`,
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
    showToast('Session launched');
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
    showToast('Insight saved');
  };

  const handleDeleteBookmark = (id) => {
    setSavedInsights((prev) => prev.filter((i) => i.id !== id));
    showToast('Bookmark removed');
  };

  const handleClearSession = () => {
    setMessages([{
      role: 'assistant',
      content: `Session reset. Ready to assist **${startupName || 'DevPulse AI'}**. Ask a strategy question or view Financials, Pitch, and Investor Memos in the right panel.`,
      ts: Date.now(),
    }]);
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

  // Financial calculations
  const netBurn = Math.max(0, monthlyExpenses - monthlyRevenue);
  const runwayMonths = netBurn > 0 ? (cashBalance / netBurn).toFixed(1) : '∞';
  const runwayNum = Number(runwayMonths) || 0;
  const gaugePercent = netBurn === 0 ? 100 : Math.min(100, Math.max(5, (runwayNum / 24) * 100));

  // FEATURE 1: Unit Economics Math
  const ltv = monthlyChurn > 0 ? Math.round((arpu * (grossMargin / 100)) / (monthlyChurn / 100)) : 0;
  const ltvCacRatio = cac > 0 ? (ltv / cac).toFixed(1) : '0.0';
  const cacPaybackMonths = (arpu * (grossMargin / 100)) > 0 ? (cac / (arpu * (grossMargin / 100))).toFixed(1) : '0.0';

  // FEATURE 2: SAFE Dilution Math
  const safeDilutionPct = postMoneyCap > 0 ? Math.min(100, (safeInvestment / postMoneyCap) * 100).toFixed(1) : '0.0';
  const founderPostRoundPct = Math.max(0, 100 - Number(safeDilutionPct) - esopPoolPct).toFixed(1);

  const getGaugeColor = () => {
    if (netBurn === 0 || runwayNum >= 12) return 'var(--success)';
    if (runwayNum >= 6) return 'var(--accent-amber)';
    return 'var(--accent-red)';
  };

  const getRunwayPillColor = () => {
    if (netBurn === 0 || runwayNum >= 12) return 'var(--success)';
    if (runwayNum >= 6) return 'var(--accent-amber)';
    return 'var(--accent-red)';
  };

  const getRunwayBorderColor = () => {
    if (netBurn === 0 || runwayNum >= 12) return 'var(--success)';
    if (runwayNum >= 6) return 'var(--accent-amber)';
    return 'var(--accent-red)';
  };

  const handleAskFinancialOptimization = () => {
    const prompt = `Analyze financial runway for ${startupName || 'our startup'}. Cash: $${cashBalance.toLocaleString()}, Expenses: $${monthlyExpenses.toLocaleString()}/mo, Revenue: $${monthlyRevenue.toLocaleString()}/mo. Net Burn: $${netBurn.toLocaleString()}/mo, Runway: ${runwayMonths} months. Provide ## Runway Analysis, ## Top 3 Cost Reduction Strategies, ## Revenue Acceleration Tactics, and ## ⚡ Your Next 3 Actions.`;
    callGemini(prompt);
  };

  const handleAskUnitEconomicsOptimization = () => {
    const prompt = `Analyze our SaaS unit economics for ${startupName || 'our startup'}:
- ARPU: $${arpu}/mo
- CAC: $${cac}
- Gross Margin: ${grossMargin}%
- Monthly Churn: ${monthlyChurn}%
- Calculated LTV: $${ltv.toLocaleString()}
- LTV:CAC Ratio: ${ltvCacRatio}x
- CAC Payback Period: ${cacPaybackMonths} months

Provide ## 🎯 Unit Economics Verdict, ## 💡 Pricing & CAC Optimization (with comparison table), ## ⚠️ Churn Risks & Retention Levers, and ## ⚡ 7-Day Action Plan.`;
    callGemini(prompt);
  };

  const handleAskCapTableReview = () => {
    const prompt = `Review our cap table & SAFE fundraising round for ${startupName || 'our startup'}:
- Pre-Round Founder Ownership: ${founderInitialPct}%
- Reserved ESOP Option Pool: ${esopPoolPct}%
- SAFE Investment Amount: $${safeInvestment.toLocaleString()}
- Post-Money Valuation Cap: $${postMoneyCap.toLocaleString()}
- Calculated Investor Dilution: ${safeDilutionPct}%
- Founder Post-Round Ownership: ${founderPostRoundPct}%

Provide ## 🎯 Cap Table Verdict, ## 💡 Valuation & Dilution Analysis, ## ⚠️ Investor Terms & Governance Watch, and ## ⚡ 7-Day Fundraising Action Plan.`;
    callGemini(prompt);
  };

  const handleAskAIPolishMemo = () => {
    const prompt = `Draft a world-class YC-style Monthly Investor Update email for ${startupName || 'our startup'} (${stage} stage):
- Period: ${memoMonth}
- Cash Balance: $${cashBalance.toLocaleString()} | Monthly Burn: $${netBurn.toLocaleString()}/mo | Runway: ${runwayMonths} months
- Key Highlights & Wins: "${memoHighs}"
- Key Lows & Challenges: "${memoLows}"
- Core Asks: "${memoAsks}"

Format as a ready-to-send executive email with clear sections: 🚀 Highs, 📉 Lows, 📊 Metrics Snapshot, and 🤝 The Asks.`;
    callGemini(prompt);
  };

  const handleCopyInvestorMemo = () => {
    const memoText = `Subject: ${startupName || 'Startup'} Investor Update — ${memoMonth}

Hi Investors & Mentors,

Here is our monthly update for ${startupName || 'DevPulse AI'} (${memoMonth}):

🚀 HIGHS & WINS
${memoHighs}

📉 LOWS & CHALLENGES
${memoLows}

📊 KEY FINANCIAL METRICS
- MRR / Revenue: $${monthlyRevenue.toLocaleString()}/mo
- Monthly Net Burn: $${netBurn.toLocaleString()}/mo
- Cash in Bank: $${cashBalance.toLocaleString()}
- Runway: ${runwayMonths} months

🤝 OUR ASKS
${memoAsks}

Thanks for your continued support!
${username} & Team ${startupName || 'Startup'}`;

    navigator.clipboard.writeText(memoText);
    showToast('Investor memo copied to clipboard');
  };

  const handleUpdateSlideDetail = (id, newDetail) => {
    setPitchSlides((prev) => prev.map((s) => s.id === id ? { ...s, detail: newDetail } : s));
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`app-root theme-${theme}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@300;400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=JetBrains+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ══════════════════════════════════════════════════════════
           CLAUDE.AI DESIGN SYSTEM TOKENS (WARM NEUTRAL & TERRACOTTA)
        ══════════════════════════════════════════════════════════ */
        :root {
          --font-serif: 'Newsreader', 'Lora', Georgia, serif;
          --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          --font-mono: 'JetBrains Mono', monospace;
          --sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px;
          --sp-5: 20px; --sp-6: 24px; --sp-8: 32px;
          --r-sm: 8px; --r-md: 12px; --r-lg: 16px; --r-xl: 20px; --r-full: 9999px;
        }

        /* ── DARK MODE (Warm Charcoal & Terracotta) ── */
        .theme-dark {
          --bg-primary: #1D1C19;
          --bg-sidebar: #171614;
          --bg-surface: #242320;
          --bg-card: rgba(43, 42, 38, 0.52);
          --bg-card-hover: rgba(54, 52, 47, 0.72);
          --bg-input: rgba(36, 35, 32, 0.65);
          --bg-user-msg: rgba(48, 46, 42, 0.62);
          --bg-card-glass: rgba(29, 28, 25, 0.60);
          --bg-sidebar-glass: rgba(23, 22, 20, 0.42);
          --bg-header-glass: rgba(29, 28, 25, 0.35);
          --border-subtle: rgba(255, 255, 255, 0.08);
          --border-default: rgba(255, 255, 255, 0.13);
          --border-focus: #D97753;
          --accent: #D97753;
          --accent-hover: #E58562;
          --accent-dim: rgba(217, 119, 83, 0.15);
          --accent-glow: rgba(217, 119, 83, 0.10);
          --accent-amber: #E08A34;
          --accent-red: #E25B57;
          --text-primary: #F0EBE1;
          --text-secondary: #ADA79B;
          --text-muted: #7A746A;
          --text-code: #E8A783;
          --success: #52A46F;
          --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.22);
          --shadow-card: 0 2px 6px rgba(0, 0, 0, 0.28);
          --shadow-elevated: 0 20px 50px rgba(0, 0, 0, 0.50);
          /* Terracotta orange waves in dark mode */
          --wave-line-color: rgba(217, 119, 83, 0.42);
          --wave-glow-color: rgba(217, 119, 83, 0.16);
        }

        /* ── LIGHT MODE (Ivory Cream & Terracotta) ── */
        .theme-light {
          --bg-primary: #FAF8F5;
          --bg-sidebar: #F4F1EA;
          --bg-surface: #FAF8F5;
          --bg-card: rgba(255, 255, 255, 0.60);
          --bg-card-hover: rgba(248, 245, 238, 0.85);
          --bg-input: rgba(255, 255, 255, 0.65);
          --bg-user-msg: rgba(238, 234, 222, 0.70);
          --bg-card-glass: rgba(250, 248, 245, 0.68);
          --bg-sidebar-glass: rgba(244, 241, 234, 0.45);
          --bg-header-glass: rgba(250, 248, 245, 0.38);
          --border-subtle: rgba(0, 0, 0, 0.06);
          --border-default: rgba(0, 0, 0, 0.10);
          --border-focus: #C96442;
          --accent: #C96442;
          --accent-hover: #B55434;
          --accent-dim: rgba(201, 100, 66, 0.11);
          --accent-glow: rgba(201, 100, 66, 0.05);
          --accent-amber: #B86B1E;
          --accent-red: #C23B38;
          --text-primary: #1A1915;
          --text-secondary: #635E55;
          --text-muted: #948D80;
          --text-code: #B8502E;
          --success: #367A4F;
          --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05);
          --shadow-card: 0 2px 6px rgba(0, 0, 0, 0.06);
          --shadow-elevated: 0 16px 44px rgba(0, 0, 0, 0.09);
          /* Black waves in light mode */
          --wave-line-color: rgba(18, 17, 15, 0.35);
          --wave-glow-color: rgba(0, 0, 0, 0.10);
        }

        html, body, #root, .app-root { height: 100%; overflow: hidden; }
        body {
          font-family: var(--font-sans);
          background: var(--bg-primary);
          color: var(--text-primary);
          transition: background 0.2s ease, color 0.2s ease;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* ── Scrollbars ── */
        * { scrollbar-width: thin; scrollbar-color: var(--border-default) transparent; }
        *::-webkit-scrollbar { width: 5px; height: 5px; }
        *::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 4px; }
        *::-webkit-scrollbar-track { background: transparent; }

        *:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
        *:focus:not(:focus-visible) { outline: none; }
        button, select, [role="button"], label[for] { cursor: pointer; }

        /* ═══════════════════════════════════════════
           BACKGROUND (Serene Claude Canvas)
        ═══════════════════════════════════════════ */
        .grid-background {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-color: var(--bg-primary);
        }
        .waves-container {
          position: absolute; inset: 0; z-index: 1; opacity: 0.95;
          mix-blend-mode: normal;
        }
        .waves-container canvas { width: 100%; height: 100%; display: block; }

        /* ═══════════════════════════════════════════
           TOP CONTROLS (Theme & Custom Language Dropdown Pill)
        ═══════════════════════════════════════════ */
        .top-theme-btn {
          position: absolute; top: 1.15rem; left: 1.4rem; z-index: 100;
          width: 38px; height: 38px; border-radius: 50%;
          background: var(--bg-card-glass); border: 1px solid var(--border-default);
          backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
          color: var(--text-secondary); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: var(--shadow-sm);
          transition: all 0.18s ease;
        }
        .top-theme-btn:hover { border-color: var(--accent); color: var(--accent); transform: scale(1.04); }

        .top-lang-dropdown {
          position: absolute; top: 1.15rem; right: 1.4rem; z-index: 150;
        }
        .top-lang-pill {
          display: flex; align-items: center; gap: 7px;
          padding: 8px 16px; border-radius: var(--r-full);
          border: 1px solid var(--border-default);
          background-color: var(--bg-card-glass);
          backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
          color: var(--text-secondary);
          font-family: var(--font-sans); font-size: 0.82rem; font-weight: 550;
          cursor: pointer; box-shadow: var(--shadow-sm);
          outline: none; transition: all 0.18s ease;
        }
        .top-lang-pill:hover, .top-lang-pill.open {
          border-color: var(--accent); color: var(--text-primary);
          background-color: var(--bg-card-hover);
        }
        .top-lang-chevron {
          font-size: 11px; color: var(--accent);
          transition: transform 0.18s ease; display: inline-block;
        }
        .top-lang-chevron.open {
          transform: rotate(180deg);
        }
        .top-lang-menu {
          position: absolute; top: calc(100% + 7px); right: 0; min-width: 155px;
          background: var(--bg-card-glass); border: 1px solid var(--border-default);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border-radius: var(--r-md); padding: 6px; box-shadow: var(--shadow-elevated);
          display: flex; flex-direction: column; gap: 3px;
          animation: menuSlideDown 0.16s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes menuSlideDown {
          from { opacity: 0; transform: translateY(-5px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .top-lang-option {
          background: transparent; border: none; width: 100%;
          padding: 8px 12px; border-radius: var(--r-sm);
          font-size: 12.5px; font-weight: 500; color: var(--text-secondary);
          cursor: pointer; text-align: left; display: flex; align-items: center;
          justify-content: space-between; font-family: var(--font-sans);
          transition: all 0.12s ease;
        }
        .top-lang-option:hover {
          background: var(--bg-card-hover); color: var(--text-primary);
        }
        .top-lang-option.active {
          background: var(--accent-dim); color: var(--accent); font-weight: 600;
        }

        /* ═══════════════════════════════════════════
           MAIN CONTAINER (Claude Workspace Layout with Backdrop Filter)
        ═══════════════════════════════════════════ */
        .app-window-wrapper {
          position: relative; z-index: 10;
          display: flex; align-items: center; justify-content: center;
          height: 100vh; width: 100vw; padding: 14px 18px;
        }

        .main-container-card {
          width: 98%; max-width: 1380px; height: 93vh; max-height: 920px;
          border-radius: var(--r-xl); display: flex; overflow: hidden;
          position: relative; z-index: 10;
          background: var(--bg-card-glass);
          backdrop-filter: blur(28px) saturate(190%);
          -webkit-backdrop-filter: blur(28px) saturate(190%);
          border: 1px solid var(--border-default);
          box-shadow: var(--shadow-elevated);
          transition: border-color 0.2s ease, background 0.2s ease;
        }

        /* ═══════════════════════════════════════════
           START SCREEN / ONBOARDING (Claude Style)
        ═══════════════════════════════════════════ */
        .login-view-container {
          width: 100%; height: 100%; overflow-y: auto; padding: 44px 28px;
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; text-align: center;
          background: transparent;
        }

        .login-header { width: 100%; max-width: 620px; margin-bottom: 26px; }
        .login-header h1 {
          font-family: var(--font-serif);
          font-size: clamp(42px, 5.5vw, 64px);
          font-weight: 500; letter-spacing: -0.035em;
          margin-bottom: 12px; color: var(--text-primary);
          line-height: 1.05;
        }
        .login-header p {
          font-size: 15.5px; line-height: 1.65; font-weight: 400;
          color: var(--text-secondary); margin: 0 auto; max-width: 500px;
          font-family: var(--font-sans);
        }

        .login-tips {
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
          width: 100%; max-width: 580px; margin-bottom: 24px;
        }
        .tip-item {
          background: var(--bg-card); border: 1px solid var(--border-default);
          border-radius: var(--r-md); padding: 14px 16px;
          font-size: 12.5px; line-height: 1.5; color: var(--text-secondary); text-align: left;
          transition: all 0.16s ease; box-shadow: var(--shadow-sm);
        }
        .tip-btn { width: 100%; cursor: pointer; font-family: var(--font-sans); }
        .tip-btn:hover {
          border-color: var(--accent); background: var(--bg-card-hover);
          color: var(--text-primary); transform: translateY(-1.5px);
        }

        .login-form-group {
          display: flex; flex-direction: column; gap: 12px;
          width: 100%; max-width: 480px;
        }

        .input-login {
          width: 100%; background: var(--bg-input); border: 1px solid var(--border-default);
          border-radius: var(--r-md); padding: 12px 16px; font-size: 14px;
          color: var(--text-primary); outline: none; font-family: var(--font-sans);
          transition: border-color 0.18s ease, box-shadow 0.18s ease;
        }
        .input-login::placeholder { color: var(--text-muted); }
        .input-login:focus { border-color: var(--border-focus); box-shadow: 0 0 0 3px var(--accent-glow); }
        .input-login option { background: var(--bg-surface); color: var(--text-primary); }

        .glow-start-btn {
          width: 100%; background: var(--accent); border: 1px solid var(--accent);
          border-radius: var(--r-md); padding: 13px 22px;
          font-size: 14.5px; font-weight: 600; color: #FFFFFF;
          cursor: pointer; transition: all 0.18s ease; margin-top: 6px;
          font-family: var(--font-sans); box-shadow: var(--shadow-card);
          letter-spacing: 0.01em;
        }
        .glow-start-btn:hover { background: var(--accent-hover); transform: translateY(-1.5px); }

        /* ═══════════════════════════════════════════
           DUAL COLUMN WORKSPACE (Translucent Frosted Layers)
        ═══════════════════════════════════════════ */
        .chat-left-col {
          flex: 1.35; display: flex; flex-direction: column;
          border-right: 1px solid var(--border-subtle);
          background: transparent; height: 100%;
        }

        .context-tools-col {
          flex: 0.88; display: flex; flex-direction: column;
          background: var(--bg-sidebar-glass); height: 100%;
          overflow-y: auto; padding: var(--sp-4) var(--sp-5); gap: var(--sp-4);
        }

        /* ═══════════════════════════════════════════
           HEADER BAR (Minimal Claude Frosted Glass)
        ═══════════════════════════════════════════ */
        .chat-header {
          min-height: 52px; padding: 0 var(--sp-5);
          border-bottom: 1px solid var(--border-subtle);
          background: var(--bg-header-glass);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0; gap: var(--sp-3);
        }

        .codelab-title { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .codelab-title h2 {
          font-family: var(--font-serif); font-size: 17px; font-weight: 550;
          color: var(--text-primary); white-space: nowrap; overflow: hidden;
          text-overflow: ellipsis; max-width: 200px; letter-spacing: -0.01em;
        }

        .header-metrics { display: flex; gap: 7px; align-items: center; }
        .header-metric-badge {
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: var(--r-full); padding: 4px 12px;
          font-family: var(--font-sans); font-size: 11.5px;
          display: flex; align-items: center; gap: 6px;
          color: var(--text-secondary); box-shadow: var(--shadow-sm);
        }
        .metric-label { color: var(--text-muted); font-size: 10.5px; font-weight: 600; text-transform: uppercase; }
        .metric-value { font-family: var(--font-mono); font-weight: 600; font-size: 12px; }

        .header-controls { display: flex; align-items: center; gap: 6px; }
        .user-badge {
          font-size: 11.5px; color: var(--text-secondary);
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: var(--r-full); padding: 4px 12px; font-weight: 550;
        }
        .text-btn {
          background: transparent; border: none; color: var(--text-secondary);
          font-size: 12px; font-weight: 500; padding: 5px 9px; border-radius: var(--r-sm);
          cursor: pointer; transition: all 0.15s ease; font-family: var(--font-sans);
        }
        .text-btn:hover { background: var(--bg-card-hover); color: var(--text-primary); }

        /* ═══════════════════════════════════════════
           GUIDE BANNER
        ═══════════════════════════════════════════ */
        .guide-banner {
          margin: 10px 18px 0; border: 1px solid var(--border-subtle);
          border-radius: var(--r-md); background: var(--bg-card);
          overflow: hidden; transition: all 0.18s ease;
        }
        .guide-banner-collapsed {
          padding: 9px 16px; display: flex; align-items: center;
          justify-content: space-between; cursor: pointer;
        }
        .guide-banner-title {
          font-size: 12.5px; font-weight: 500; color: var(--text-secondary);
          display: flex; align-items: center; gap: 7px;
        }
        .guide-banner-arrow {
          font-size: 14px; color: var(--accent);
          transition: transform 0.18s ease; display: inline-block;
        }
        .guide-banner-arrow.expanded { transform: rotate(90deg); }
        .guide-dismiss {
          background: transparent; border: none; color: var(--text-muted);
          cursor: pointer; font-size: 12px; padding: 2px 6px;
        }
        .guide-dismiss:hover { color: var(--text-primary); }
        .guide-banner-content {
          padding: 12px 16px 14px; border-top: 1px solid var(--border-subtle);
          display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;
          font-size: 12px; color: var(--text-secondary); line-height: 1.5;
        }

        /* ═══════════════════════════════════════════
           CHAT TIMELINE (Claude Editorial Document Layout)
        ═══════════════════════════════════════════ */
        .chat-area {
          flex: 1; overflow-y: auto; padding: 20px 28px;
          display: flex; flex-direction: column; gap: 20px;
        }

        .msg-row {
          display: flex; gap: 14px; width: 100%;
          animation: msgFadeIn 0.20s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes msgFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .msg-row.user { justify-content: flex-end; }
        .msg-row.assistant { justify-content: flex-start; }

        .claude-avatar {
          width: 30px; height: 30px; border-radius: var(--r-sm);
          background: var(--bg-card); border: 1px solid var(--border-default);
          display: flex; align-items: center; justify-content: center;
          color: var(--accent); flex-shrink: 0; margin-top: 2px;
          transition: all 0.2s ease; box-shadow: var(--shadow-sm);
        }
        .claude-avatar.thinking {
          border-color: var(--accent);
          animation: avatarPulse 1.4s ease-in-out infinite;
        }
        @keyframes avatarPulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.08); opacity: 1; }
        }

        .msg-wrapper { max-width: 88%; display: flex; flex-direction: column; }
        .msg-row.user .msg-wrapper { align-items: flex-end; }

        /* USER MESSAGE PILL */
        .msg-row.user .msg-bubble {
          background: var(--bg-user-msg);
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
          border-radius: 16px 16px 4px 16px;
          padding: 11px 18px; font-size: 14px; line-height: 1.58;
          font-family: var(--font-sans); box-shadow: var(--shadow-sm);
        }

        /* ASSISTANT MESSAGE: Flat Editorial Document */
        .msg-row.assistant .msg-bubble {
          background: transparent;
          color: var(--text-primary);
          padding: 2px 4px; font-size: 14.5px; line-height: 1.72;
          font-family: var(--font-sans);
        }

        .md-heading {
          font-family: var(--font-serif); font-size: 17.5px; font-weight: 550;
          color: var(--text-primary); margin: 20px 0 8px; letter-spacing: -0.01em;
        }
        .md-paragraph { margin-bottom: 10px; color: var(--text-primary); line-height: 1.70; }
        .md-bold { font-weight: 600; color: var(--text-primary); }

        .md-code-inline {
          font-family: var(--font-mono); font-size: 12.5px;
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: 4px; padding: 2px 6px; color: var(--text-code);
        }

        .md-code-block {
          font-family: var(--font-mono); font-size: 12.5px;
          background: var(--bg-card); border: 1px solid var(--border-default);
          border-radius: var(--r-md); padding: 14px 16px;
          overflow-x: auto; margin: 14px 0; color: var(--text-code);
          line-height: 1.60;
        }

        .md-callout {
          background: var(--accent-dim); border-left: 3.5px solid var(--accent);
          border-radius: 0 var(--r-sm) var(--r-sm) 0;
          padding: 12px 16px; margin: 14px 0;
          display: flex; gap: 10px; align-items: flex-start;
          font-size: 13.5px; color: var(--text-primary); line-height: 1.60;
        }
        .md-callout-icon { font-size: 15px; flex-shrink: 0; margin-top: 1px; }

        .md-table-wrapper {
          overflow-x: auto; margin: 14px 0 18px;
          border-radius: var(--r-md); border: 1px solid var(--border-default);
          background: var(--bg-card); box-shadow: var(--shadow-sm);
        }
        .md-table {
          width: 100%; border-collapse: collapse; font-size: 12.5px;
          text-align: left;
        }
        .md-table th {
          background: var(--bg-card-hover); padding: 10px 14px;
          font-weight: 600; color: var(--accent); border-bottom: 1px solid var(--border-default);
          font-family: var(--font-sans);
        }
        .md-table td {
          padding: 9px 14px; border-bottom: 1px solid var(--border-subtle);
          color: var(--text-primary); font-family: var(--font-sans);
        }
        .md-table tr:last-child td { border-bottom: none; }
        .md-table tr:hover td { background: var(--bg-card-hover); }

        .md-list { margin: 8px 0 12px 20px; display: flex; flex-direction: column; gap: 6px; }
        .md-list li { line-height: 1.62; color: var(--text-primary); }

        .md-num-list { margin: 8px 0 12px 22px; display: flex; flex-direction: column; gap: 6px; }
        .md-num-list li { line-height: 1.62; color: var(--text-primary); }

        .msg-timestamp {
          font-size: 10.5px; color: var(--text-muted); margin-top: 5px;
          font-family: var(--font-sans);
        }

        .msg-actions {
          display: flex; gap: 6px; margin-top: 8px; opacity: 0;
          transition: opacity 0.18s ease;
        }
        .msg-row.assistant:hover .msg-actions { opacity: 1; }
        .msg-action-btn {
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          color: var(--text-secondary); font-size: 11px; padding: 3px 9px;
          border-radius: var(--r-sm); cursor: pointer; transition: all 0.15s ease;
          font-family: var(--font-sans); font-weight: 500;
        }
        .msg-action-btn:hover { border-color: var(--accent); color: var(--accent); }

        /* ═══════════════════════════════════════════
           EMPTY STATE (Claude Starter Prompts)
        ═══════════════════════════════════════════ */
        .empty-state {
          display: flex; flex-direction: column; align-items: center;
          gap: 16px; padding: 28px 0 16px;
        }
        .starter-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 100%;
        }
        .starter-card {
          background: var(--bg-card); border: 1px solid var(--border-default);
          border-radius: var(--r-lg); padding: 16px 18px;
          cursor: pointer; transition: all 0.16s ease;
          text-align: left; font-family: var(--font-sans);
          color: var(--text-secondary); font-size: 12.5px; line-height: 1.5;
          box-shadow: var(--shadow-sm);
        }
        .starter-card:hover {
          border-color: var(--accent); background: var(--bg-card-hover);
          color: var(--text-primary); transform: translateY(-1.5px);
        }
        .starter-card-icon { font-size: 18px; margin-bottom: 8px; display: block; }
        .starter-card-title {
          font-weight: 600; font-size: 14px; color: var(--text-primary);
          margin-bottom: 3px; font-family: var(--font-serif);
        }
        .empty-state-hint {
          font-size: 12.5px; color: var(--text-muted); font-style: italic;
        }

        /* ═══════════════════════════════════════════
           STRATEGY SUGGESTIONS
        ═══════════════════════════════════════════ */
        .suggestions-container {
          padding: 10px 20px; display: flex; gap: 8px; overflow-x: auto;
          border-top: 1px solid var(--border-subtle); flex-shrink: 0;
        }
        .suggestions-container::-webkit-scrollbar { height: 2px; }
        .suggestion-chip {
          background: var(--bg-card); border: 1px solid var(--border-default);
          border-radius: var(--r-full); padding: 6px 14px;
          font-size: 12px; font-weight: 550; color: var(--text-secondary);
          cursor: pointer; white-space: nowrap; flex-shrink: 0;
          transition: all 0.16s ease; font-family: var(--font-sans);
          box-shadow: var(--shadow-sm);
        }
        .suggestion-chip:hover {
          border-color: var(--accent); color: var(--accent);
          background: var(--accent-dim); transform: translateY(-1px);
        }
        .suggestion-chip:disabled { opacity: 0.45; cursor: not-allowed; }

        /* ═══════════════════════════════════════════
           COMPOSER / INPUT (Claude Rounded Card)
        ═══════════════════════════════════════════ */
        .chat-footer { padding: 14px 22px 18px; flex-shrink: 0; }
        .input-pill {
          display: flex; align-items: flex-end; gap: 10px;
          background: var(--bg-input); border: 1px solid var(--border-default);
          border-radius: 16px; padding: 10px 12px 10px 16px;
          min-height: 56px; transition: border-color 0.18s ease, box-shadow 0.18s ease;
          box-shadow: var(--shadow-sm);
        }
        .input-pill:focus-within { border-color: var(--border-focus); box-shadow: 0 0 0 3px var(--accent-glow); }

        .action-btn {
          background: transparent; border: none; color: var(--text-secondary);
          width: 34px; height: 34px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0; transition: color 0.15s ease, background 0.15s ease;
          margin-bottom: 2px;
        }
        .action-btn:hover { color: var(--accent); background: var(--bg-card-hover); }

        .chat-input-textarea {
          flex: 1; background: transparent; border: none; outline: none;
          color: var(--text-primary); font-size: 14px; line-height: 1.55;
          resize: none; font-family: var(--font-sans);
          padding: 7px 0; max-height: 130px;
        }
        .chat-input-textarea::placeholder { color: var(--text-muted); }

        .send-btn-round {
          background: var(--accent); border: none; color: #FFFFFF;
          width: 34px; height: 34px; border-radius: var(--r-sm);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0; transition: all 0.16s ease;
          margin-bottom: 2px; box-shadow: var(--shadow-sm);
        }
        .send-btn-round:hover:not(:disabled) { background: var(--accent-hover); transform: scale(1.04); }
        .send-btn-round:disabled { opacity: 0.35; cursor: not-allowed; }

        /* ═══════════════════════════════════════════
           RIGHT PANEL (Co-Founder Tools)
        ═══════════════════════════════════════════ */
        .context-title {
          font-family: var(--font-serif); font-size: 16px; font-weight: 550;
          color: var(--text-primary); letter-spacing: -0.01em;
        }

        .mini-link-btn {
          background: var(--bg-card); border: 1px solid var(--border-default);
          color: var(--text-secondary); font-family: var(--font-sans);
          font-size: 10.5px; font-weight: 550; cursor: pointer; padding: 4px 9px;
          border-radius: var(--r-sm); transition: all 0.15s ease;
        }
        .mini-link-btn:hover { border-color: var(--accent); color: var(--accent); }

        .right-tab-bar {
          display: flex; gap: 4px; background: var(--bg-primary);
          padding: 4px; border-radius: var(--r-md);
          border: 1px solid var(--border-subtle);
        }
        .right-tab-btn {
          flex: 1; background: transparent; border: none;
          padding: 7px 5px; border-radius: var(--r-sm);
          font-size: 11px; font-weight: 550; color: var(--text-secondary);
          cursor: pointer; transition: all 0.16s ease; text-align: center;
          font-family: var(--font-sans); white-space: nowrap;
        }
        .right-tab-btn.active {
          background: var(--bg-card); color: var(--text-primary);
          box-shadow: var(--shadow-sm); font-weight: 600;
        }
        .right-tab-btn:hover:not(.active) { color: var(--text-primary); }

        .context-section {
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: var(--r-md); padding: 14px 16px;
          transition: border-color 0.18s ease; box-shadow: var(--shadow-sm);
        }
        .context-section:hover { border-color: var(--border-default); }

        .context-section-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 10px;
        }
        .context-section-header h4 {
          font-size: 11.5px; font-weight: 650; text-transform: uppercase;
          letter-spacing: 0.06em; color: var(--text-muted);
        }

        .context-input, .context-textarea {
          width: 100%; background: var(--bg-input); border: 1px solid var(--border-default);
          border-radius: var(--r-sm); padding: 8px 11px;
          font-size: 12.5px; color: var(--text-primary); outline: none;
          transition: border-color 0.15s ease; font-family: var(--font-sans);
        }
        .context-input:focus, .context-textarea:focus { border-color: var(--border-focus); }
        .context-input::placeholder, .context-textarea::placeholder { color: var(--text-muted); }

        .persona-chip-group { display: flex; gap: 7px; }
        .persona-chip {
          flex: 1; background: var(--bg-card); border: 1px solid var(--border-default);
          border-radius: var(--r-md); padding: 9px 12px;
          font-size: 11.5px; font-weight: 550; color: var(--text-secondary);
          text-align: center; cursor: pointer; transition: all 0.16s ease;
          font-family: var(--font-sans); box-shadow: var(--shadow-sm);
        }
        .persona-chip.active {
          background: var(--accent-dim); border-color: var(--accent);
          color: var(--accent); font-weight: 600;
        }
        .persona-chip:hover:not(.active) { border-color: var(--border-focus); color: var(--text-primary); }

        .context-hint {
          font-size: 11.5px; color: var(--text-secondary);
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: var(--r-md); padding: 12px; line-height: 1.55;
        }

        .gauge-bar-outer {
          height: 7px; background: var(--border-subtle); border-radius: 4px;
          overflow: hidden; margin: 9px 0 5px;
        }
        .gauge-bar-inner { height: 100%; border-radius: 4px; transition: width 0.3s ease; }

        /* Cap Table Equity Multi-segment Bar */
        .equity-bar-outer {
          display: flex; height: 11px; border-radius: 4px;
          overflow: hidden; margin: 9px 0 7px;
          background: var(--border-subtle);
        }
        .equity-seg-founder { background: var(--accent); height: 100%; transition: width 0.3s ease; }
        .equity-seg-investor { background: var(--accent-amber); height: 100%; transition: width 0.3s ease; }
        .equity-seg-esop { background: var(--success); height: 100%; transition: width 0.3s ease; }

        .tam-pyramid { display: flex; flex-direction: column; gap: 5px; margin-top: 4px; }
        .tam-layer {
          padding: 7px 12px; border-radius: var(--r-sm); font-size: 12px; font-weight: 550;
        }
        .tam-layer-1 { background: var(--accent-dim); color: var(--accent); }
        .tam-layer-2 { background: var(--bg-card); color: var(--text-secondary); border: 1px solid var(--border-subtle); }
        .tam-layer-3 { background: var(--bg-primary); color: var(--text-muted); }

        .slide-card-item {
          background: var(--bg-input); border: 1px solid var(--border-subtle);
          border-radius: var(--r-sm); padding: 8px 10px;
        }
        .slide-card-title { font-size: 11.5px; font-weight: 600; color: var(--text-primary); }

        /* ═══════════════════════════════════════════
           MODALS & TOASTS
        ═══════════════════════════════════════════ */
        .modal-overlay {
          position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.55);
          backdrop-filter: blur(6px); display: flex; align-items: center;
          justify-content: center; padding: 20px;
        }
        .modal-content {
          background: var(--bg-card); border: 1px solid var(--border-default);
          border-radius: var(--r-lg); width: 100%; max-width: 440px;
          padding: 24px; display: flex; flex-direction: column; gap: 14px;
          box-shadow: var(--shadow-elevated);
        }

        .toast {
          position: fixed; bottom: 22px; right: 22px; z-index: 300;
          background: var(--bg-card); border: 1px solid var(--border-default);
          color: var(--text-primary); padding: 9px 18px;
          border-radius: var(--r-md); font-size: 12.5px; font-weight: 550;
          opacity: 0; transform: translateY(8px);
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: var(--shadow-card);
          font-family: var(--font-sans);
        }
        .toast-visible { opacity: 1; transform: translateY(0); }

        /* ═══════════════════════════════════════════
           LOADING STATE
        ═══════════════════════════════════════════ */
        .loading-dots { display: flex; gap: 4px; align-items: center; padding: 4px 0; }
        .loading-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--accent); animation: dotPulse 1.2s ease-in-out infinite;
        }
        .loading-dot:nth-child(2) { animation-delay: 0.2s; }
        .loading-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dotPulse {
          0%, 100% { transform: scale(0.7); opacity: 0.35; }
          50% { transform: scale(1.1); opacity: 1; }
        }
      `}</style>

      {/* ─── Background Canvas ────────────────────────── */}
      <div className="grid-background">
        <InteractiveWaves />
      </div>

      {/* Floating Theme Toggle */}
      <button className="top-theme-btn" onClick={toggleTheme} title="Toggle Theme">
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>

      {/* Floating Custom Language Dropdown Pill */}
      <div className="top-lang-dropdown" ref={langDropdownRef}>
        <button
          className={`top-lang-pill ${langOpen ? 'open' : ''}`}
          onClick={() => setLangOpen((prev) => !prev)}
          title="Select Language"
        >
          <span style={{ fontSize: '12px' }}>🌐</span>
          <span>{LANGUAGES.find((l) => l.code === language)?.label || language}</span>
          <span className={`top-lang-chevron ${langOpen ? 'open' : ''}`}>▾</span>
        </button>

        {langOpen && (
          <div className="top-lang-menu">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                className={`top-lang-option ${language === l.code ? 'active' : ''}`}
                onClick={() => {
                  setLanguage(l.code);
                  setLangOpen(false);
                  showToast(`Language: ${l.label}`);
                }}
              >
                <span>{l.label}</span>
                {language === l.code && <span style={{ color: 'var(--accent)', fontSize: '11px' }}>✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <Toast message={toastMsg} visible={toastVisible} />

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '17px', fontWeight: 500, color: 'var(--text-primary)' }}>API Settings</div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Enter a custom Google Gemini API Key to override default key configuration. Stored locally in your browser.
            </div>
            <div className="login-form-group">
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>API Key</label>
              <input type="password" className="input-login" placeholder="AIzaSy..." value={tempApiKey} onChange={(e) => setTempApiKey(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button className="text-btn" onClick={() => { setCustomApiKey(''); setTempApiKey(''); setShowSettingsModal(false); showToast('Key cleared'); }}>Clear Key</button>
              <button className="glow-start-btn" style={{ width: 'auto', padding: '6px 16px', margin: 0 }} onClick={() => { setCustomApiKey(tempApiKey.trim()); setShowSettingsModal(false); showToast(tempApiKey.trim() ? 'Key saved' : 'Using default'); }}>Save Settings</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container Card */}
      <div className="app-window-wrapper">
        <div className="main-container-card">

          {/* VIEW 1: Start Mission / Startup Setup Screen */}
          {!sessionActive ? (
            <div className="login-view-container">
              <div className="login-header">
                <h1>{t.heroTitle}</h1>
                <p>{t.heroTagline}</p>
              </div>

              <div className="login-tips">
                <button type="button" className="tip-item tip-btn" onClick={() => handleLaunchWithPrompt('Give me a comprehensive Market Research overview (TAM/SAM/SOM, trends, target customer segments).')}>
                  <strong>{t.marketResearch}</strong>: {t.marketResearchDesc}
                </button>
                <button type="button" className="tip-item tip-btn" onClick={() => handleLaunchWithPrompt('Analyze the top 5 competitors, key differentiators, and our competitive moat.')}>
                  <strong>{t.competitorAnalysis}</strong>: {t.competitorDesc}
                </button>
                <button type="button" className="tip-item tip-btn" onClick={() => handleLaunchWithPrompt('Create a complete 10-slide pitch deck outline with slide titles and key bullet points.')}>
                  <strong>{t.pitchDeck}</strong>: {t.pitchDeckDesc}
                </button>
                <button type="button" className="tip-item tip-btn" onClick={() => handleLaunchWithPrompt('Analyze our unit economics, CAC/LTV, burn rate, and runway optimization strategies.')}>
                  <strong>{t.runwayCalc}</strong>: {t.runwayDesc}
                </button>
              </div>

              <form onSubmit={handleStartMission} className="login-form-group">
                <input
                  type="text"
                  className="input-login"
                  placeholder={t.founderPlaceholder}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />

                <input
                  type="text"
                  className="input-login"
                  placeholder={t.startupPlaceholder}
                  value={startupName}
                  onChange={(e) => setStartupName(e.target.value)}
                  required
                />

                <select
                  className="input-login"
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                >
                  {STAGE_OPTIONS.map((st) => (
                    <option key={st} value={st}>{st} Stage</option>
                  ))}
                </select>

                <button type="submit" className="glow-start-btn">{t.startSessionBtn}</button>
              </form>

              <div style={{ marginTop: '18px', display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {PRESET_STARTUPS.map((p) => (
                  <button key={p.name} className="suggestion-chip" onClick={() => handleApplyPreset(p)}>
                    ✦ {p.name} ({p.stage})
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
                    <span style={{ color: 'var(--accent)', fontSize: '15px' }}>✦</span>
                    <h2>{startupName || 'FounderNexus'}</h2>
                  </div>

                  {/* Header Live Metric Badges */}
                  <div className="header-metrics">
                    <span className="header-metric-badge" style={{ borderColor: getRunwayBorderColor(), color: getRunwayPillColor() }}>
                      <span className="metric-label">{t.runway}</span>
                      <span className="metric-value">{runwayMonths} mo</span>
                    </span>
                    <span className="header-metric-badge">
                      <span className="metric-label">{t.burn}</span>
                      <span className="metric-value">${netBurn.toLocaleString()}/mo</span>
                    </span>
                  </div>

                  <div className="header-controls">
                    <span className="user-badge">{username}</span>
                    <button className="text-btn" onClick={handleClearSession}>{t.clear}</button>
                    <button className="text-btn" onClick={handleLogout}>{t.home}</button>
                    <button className="text-btn" onClick={() => setShowSettingsModal(true)} title="API Settings">{t.settings}</button>
                  </div>
                </header>

                {/* Chat Messages Timeline */}
                <div className="chat-area">
                  {showGuideBanner && (
                    <div className="guide-banner">
                      <div className="guide-banner-collapsed" onClick={() => setGuideExpanded(!guideExpanded)}>
                        <div className="guide-banner-title">
                          <span>✦</span>
                          <span>{t.quickTips}</span>
                          <span className={`guide-banner-arrow ${guideExpanded ? 'expanded' : ''}`}>›</span>
                        </div>
                        <button className="guide-dismiss" onClick={(e) => { e.stopPropagation(); setShowGuideBanner(false); }}>✕</button>
                      </div>
                      {guideExpanded && (
                        <div className="guide-banner-content">
                          <div>1. {t.tip1}</div>
                          <div>2. {t.tip2}</div>
                          <div>3. {t.tip3}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {messages.map((msg, idx) => (
                    <div key={idx} className={`msg-row ${msg.role}`}>
                      {msg.role === 'assistant' && <BotAvatar />}
                      <div className="msg-wrapper">
                        <div className="msg-bubble">
                          {msg.role === 'assistant' ? parseMarkdown(msg.content) : msg.content}
                        </div>
                        <div className="msg-timestamp">{formatTimestamp(msg.ts)}</div>
                        {msg.role === 'assistant' && (
                          <div className="msg-actions">
                            <button className="msg-action-btn" onClick={() => handleCopyMessage(msg.content)}>Copy</button>
                            <button className="msg-action-btn" onClick={() => handleBookmarkMessage(msg.content)}>Save</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Empty state starter cards */}
                  {messages.length === 1 && !loading && (
                    <div className="empty-state">
                      <div className="starter-grid">
                        <button className="starter-card" onClick={() => callGemini('Give me a comprehensive Market Research overview (TAM/SAM/SOM, trends, target customer segments).')} disabled={loading}>
                          <span className="starter-card-icon">🔍</span>
                          <div className="starter-card-title">{t.marketResearch}</div>
                          <div>{t.marketResearchDesc}</div>
                        </button>
                        <button className="starter-card" onClick={() => callGemini('Analyze the top 5 competitors, key differentiators, and our competitive moat.')} disabled={loading}>
                          <span className="starter-card-icon">🏆</span>
                          <div className="starter-card-title">{t.competitorAnalysis}</div>
                          <div>{t.competitorDesc}</div>
                        </button>
                        <button className="starter-card" onClick={() => callGemini('Create a complete 10-slide pitch deck outline with slide titles and key bullet points.')} disabled={loading}>
                          <span className="starter-card-icon">💰</span>
                          <div className="starter-card-title">{t.pitchDeck}</div>
                          <div>{t.pitchDeckDesc}</div>
                        </button>
                        <button className="starter-card" onClick={() => callGemini(`Analyze financial runway for ${startupName || 'our startup'}. Cash: $${cashBalance.toLocaleString()}, Expenses: $${monthlyExpenses.toLocaleString()}/mo, Revenue: $${monthlyRevenue.toLocaleString()}/mo.`)} disabled={loading}>
                          <span className="starter-card-icon">📊</span>
                          <div className="starter-card-title">{t.runwayCalc}</div>
                          <div>{t.runwayDesc}</div>
                        </button>
                      </div>
                      <div className="empty-state-hint">{t.orTypeQuestion}</div>
                    </div>
                  )}

                  {loading && (
                    <div className="msg-row assistant">
                      <BotAvatar thinking={true} />
                      <div className="msg-wrapper">
                        <div className="msg-bubble" style={{ padding: '8px 4px' }}>
                          <div className="loading-dots">
                            <div className="loading-dot" />
                            <div className="loading-dot" />
                            <div className="loading-dot" />
                          </div>
                        </div>
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

                {/* Input Composer Pill */}
                <footer className="chat-footer">
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
                      placeholder={t.inputPlaceholder}
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
                    <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-sans)' }}>
                      📎 {attachedFile.name}
                      <button style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer' }} onClick={() => setAttachedFile(null)}>✕</button>
                    </div>
                  )}
                </footer>
              </div>

              {/* Right Column: Co-Founder Tooling Panel */}
              <div className="context-tools-col">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <h3 className="context-title">{t.toolsTitle}</h3>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="mini-link-btn" onClick={() => handleExportSession('txt')}>TXT</button>
                    <button className="mini-link-btn" onClick={() => handleExportSession('md')}>MD</button>
                    <button className="mini-link-btn" onClick={() => handleExportSession('json')}>JSON</button>
                  </div>
                </div>

                {/* Advisor Persona Switcher */}
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
                  <button className={`right-tab-btn ${activeRightTab === 'financials' ? 'active' : ''}`} onClick={() => setActiveRightTab('financials')}>
                    📊 {t.tabFinancials}
                  </button>
                  <button className={`right-tab-btn ${activeRightTab === 'pitch' ? 'active' : ''}`} onClick={() => setActiveRightTab('pitch')}>
                    🎴 {t.tabPitch}
                  </button>
                  <button className={`right-tab-btn ${activeRightTab === 'memo' ? 'active' : ''}`} onClick={() => setActiveRightTab('memo')}>
                    📝 {t.tabMemo}
                  </button>
                  <button className={`right-tab-btn ${activeRightTab === 'saved' ? 'active' : ''}`} onClick={() => setActiveRightTab('saved')}>
                    🔖 {t.tabSaved} ({savedInsights.length})
                  </button>
                </div>

                {/* TAB 1: Financials, Unit Economics & Cap Table */}
                {activeRightTab === 'financials' && (
                  <>
                    {/* Sub-tool 1: Runway Calculator */}
                    <div className="context-section">
                      <div className="context-section-header">
                        <h4>{t.runwayCalc}</h4>
                        <button className="mini-link-btn" onClick={handleAskFinancialOptimization}>⚡ AI Optimize</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>Cash ($)</label>
                          <input type="number" className="context-input" value={cashBalance} onChange={(e) => setCashBalance(Number(e.target.value))} />
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>Expenses ($/mo)</label>
                          <input type="number" className="context-input" value={monthlyExpenses} onChange={(e) => setMonthlyExpenses(Number(e.target.value))} />
                        </div>
                        <div style={{ gridColumn: '1/-1' }}>
                          <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>Revenue ($/mo)</label>
                          <input type="number" className="context-input" value={monthlyRevenue} onChange={(e) => setMonthlyRevenue(Number(e.target.value))} />
                        </div>
                      </div>

                      <div className="gauge-bar-outer">
                        <div className="gauge-bar-inner" style={{ width: `${gaugePercent}%`, backgroundColor: getGaugeColor() }} />
                      </div>

                      <div style={{ marginTop: '6px', fontSize: '11.5px', color: getGaugeColor(), fontWeight: 500 }}>
                        {t.runway}: {runwayMonths} mo · {t.burn}: ${netBurn.toLocaleString()}/mo
                      </div>
                    </div>

                    {/* Sub-tool 2: SaaS Unit Economics & LTV:CAC Engine */}
                    <div className="context-section">
                      <div className="context-section-header">
                        <h4>{t.unitEconTitle}</h4>
                        <button className="mini-link-btn" onClick={handleAskUnitEconomicsOptimization}>✦ Analyze</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>ARPU ($/mo)</label>
                          <input type="number" className="context-input" value={arpu} onChange={(e) => setArpu(Number(e.target.value))} />
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>CAC ($)</label>
                          <input type="number" className="context-input" value={cac} onChange={(e) => setCac(Number(e.target.value))} />
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>Margin (%)</label>
                          <input type="number" className="context-input" value={grossMargin} onChange={(e) => setGrossMargin(Number(e.target.value))} />
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>Churn (%/mo)</label>
                          <input type="number" step="0.5" className="context-input" value={monthlyChurn} onChange={(e) => setMonthlyChurn(Number(e.target.value))} />
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-sm)', padding: '6px 8px', marginTop: '4px', fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>LTV: <strong style={{ color: 'var(--text-primary)' }}>${ltv.toLocaleString()}</strong></span>
                        <span>Ratio: <strong style={{ color: Number(ltvCacRatio) >= 3 ? 'var(--success)' : Number(ltvCacRatio) >= 1.5 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>{ltvCacRatio}x</strong></span>
                        <span>Payback: <strong style={{ color: 'var(--text-primary)' }}>{cacPaybackMonths} mo</strong></span>
                      </div>
                    </div>

                    {/* Sub-tool 3: Cap Table & SAFE Dilution Modeler */}
                    <div className="context-section">
                      <div className="context-section-header">
                        <h4>{t.capTableTitle}</h4>
                        <button className="mini-link-btn" onClick={handleAskCapTableReview}>✦ Review</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>SAFE Raise ($)</label>
                          <input type="number" className="context-input" value={safeInvestment} onChange={(e) => setSafeInvestment(Number(e.target.value))} />
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>Post-Cap ($)</label>
                          <input type="number" className="context-input" value={postMoneyCap} onChange={(e) => setPostMoneyCap(Number(e.target.value))} />
                        </div>
                      </div>

                      {/* Visual Multi-Segment Equity Bar */}
                      <div className="equity-bar-outer">
                        <div className="equity-seg-founder" style={{ width: `${founderPostRoundPct}%` }} title={`Founder: ${founderPostRoundPct}%`} />
                        <div className="equity-seg-investor" style={{ width: `${safeDilutionPct}%` }} title={`Investors: ${safeDilutionPct}%`} />
                        <div className="equity-seg-esop" style={{ width: `${esopPoolPct}%` }} title={`ESOP Pool: ${esopPoolPct}%`} />
                      </div>

                      <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                        <span>👤 Founder: <strong>{founderPostRoundPct}%</strong></span>
                        <span>💰 Investors: <strong>{safeDilutionPct}%</strong></span>
                        <span>👥 ESOP: <strong>{esopPoolPct}%</strong></span>
                      </div>
                    </div>

                    {/* Sub-tool 4: TAM/SAM/SOM */}
                    <div className="context-section">
                      <div className="context-section-header">
                        <h4>TAM / SAM / SOM Market</h4>
                      </div>
                      <div className="tam-pyramid">
                        <div className="tam-layer tam-layer-1">TAM: $45.0B Global Market</div>
                        <div className="tam-layer tam-layer-2">SAM: $8.2B Founder Tooling</div>
                        <div className="tam-layer tam-layer-3">SOM: $1.2B AI Copilots</div>
                      </div>
                    </div>
                  </>
                )}

                {/* TAB 2: Pitch Deck Outline */}
                {activeRightTab === 'pitch' && (
                  <div className="context-section">
                    <div className="context-section-header">
                      <h4>{t.pitchDeck}</h4>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '420px', overflowY: 'auto' }}>
                      {pitchSlides.map((slide) => (
                        <div key={slide.id} className="slide-card-item">
                          <div className="slide-card-title">{slide.title}</div>
                          <input
                            type="text"
                            className="context-input"
                            style={{ fontSize: '10.5px', marginTop: '4px', padding: '4px 6px' }}
                            value={slide.detail}
                            onChange={(e) => handleUpdateSlideDetail(slide.id, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: YC Monthly Investor Update & Memo Generator */}
                {activeRightTab === 'memo' && (
                  <div className="context-section">
                    <div className="context-section-header">
                      <h4>{t.investorMemoTitle}</h4>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="mini-link-btn" onClick={handleCopyInvestorMemo}>{t.copyMemoBtn}</button>
                        <button className="mini-link-btn" style={{ color: 'var(--accent)' }} onClick={handleAskAIPolishMemo}>{t.polishMemoBtn}</button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>Period / Month</label>
                        <input type="text" className="context-input" value={memoMonth} onChange={(e) => setMemoMonth(e.target.value)} />
                      </div>

                      <div>
                        <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>🚀 Highs & Highlights</label>
                        <textarea className="context-textarea" rows={2} value={memoHighs} onChange={(e) => setMemoHighs(e.target.value)} />
                      </div>

                      <div>
                        <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>📉 Lows & Challenges</label>
                        <textarea className="context-textarea" rows={2} value={memoLows} onChange={(e) => setMemoLows(e.target.value)} />
                      </div>

                      <div>
                        <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>🤝 Key Asks</label>
                        <textarea className="context-textarea" rows={2} value={memoAsks} onChange={(e) => setMemoAsks(e.target.value)} />
                      </div>

                      <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-sm)', padding: '6px 8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Live Metrics: <strong>${monthlyRevenue.toLocaleString()}/mo MRR</strong> · <strong>${netBurn.toLocaleString()}/mo Burn</strong> · <strong>{runwayMonths} mo Runway</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: Saved Insights */}
                {activeRightTab === 'saved' && (
                  <div className="context-section">
                    <div className="context-section-header">
                      <h4>Saved Insights ({savedInsights.length})</h4>
                    </div>
                    {savedInsights.length === 0 ? (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0', lineHeight: 1.5 }}>
                        No bookmarks yet. Click "Save" under any assistant message to capture insights here.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '380px', overflowY: 'auto' }}>
                        {savedInsights.map((item) => (
                          <div key={item.id} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-sm)', padding: '8px 10px' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-primary)', lineHeight: 1.45 }}>{item.snippet}</div>
                            <div style={{ display: 'flex', gap: '6px', marginTop: '6px', justifyContent: 'flex-end' }}>
                              <button className="mini-link-btn" onClick={() => handleCopyMessage(item.full)}>Copy</button>
                              <button className="mini-link-btn" style={{ color: 'var(--accent-red)' }} onClick={() => handleDeleteBookmark(item.id)}>Remove</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="context-hint">
                  <p>{t.contextHint}</p>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
