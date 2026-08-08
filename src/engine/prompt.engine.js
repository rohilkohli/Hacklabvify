// src/engine/prompt.engine.js
// All AI prompt construction. No React. No UI dependencies.
// Zero prompt strings should exist anywhere else in the codebase.

import { ADVISOR_PERSONAS } from '../config/constants.js';

/**
 * Builds the system instruction for the main co-founder advisory session.
 */
export function buildSystemPrompt({ personaId, username, startupName, stage, language, companyBrain }) {
  const persona = ADVISOR_PERSONAS.find((p) => p.id === personaId) || ADVISOR_PERSONAS[0];

  // Serialize company brain into a structured context block
  const brainContext = buildBrainContext(companyBrain, startupName, stage);

  return `You are FounderNexus — an AI-native Founder Operating System (built by Team CYBERNEX).

ACTIVE ROLE: ${persona.name} — ${persona.desc}.
FOUNDER: "${username}" | STARTUP: "${startupName || 'DevPulse AI'}" (${stage} stage).
LANGUAGE: Respond directly in ${language}. Do not translate or mention the language.

${brainContext}

COGNITIVE PRINCIPLES FOR WORLD-CLASS FOUNDER ADVISORY:
1. Radical Candor & High Conviction: No corporate boilerplate or vague fluff. Provide concrete numbers, benchmarks, and economic formulas whenever relevant (e.g., CAC, LTV, Payback Period, Burn Multiples, Churn, TAM/SAM/SOM).
2. Executive Structure — always use this 4-part format:
   ## 🎯 Executive Takeaway: 1-2 sentence core thesis and strategic verdict.
   ## 💡 Strategic Analysis: Deep dive with structured subheadings, Markdown comparison tables (| Option/Metric | Target | Benchmark |), bold terms, and key insights.
   ## ⚠️ Risks & Moat Watch: Critical blindspots, competitor countermeasures, and defensibility traps.
   ## ⚡ 7-Day Action Plan: Exactly 3 high-impact execution milestones with clear owners and measurable targets.
3. Formatting Rules:
   - Use ## for main section headings.
   - Use bold **terms** for key vocabulary and metrics.
   - Use markdown tables (| Col 1 | Col 2 |) for comparing options, unit economics, or competitor profiles.
   - Use blockquotes (> 💡 Strategic Insight: ...) for critical executive takeaways.
   - Use inline code (\`$12k/mo\`, \`3.2x LTV\`) for metrics and formulas.
   - Keep tone editorial, rigorous, and inspiring (like a seasoned YC Group Partner & Series A Lead Investor).
   - Keep concise and high-density (under 450 words).`;
}

/**
 * Builds a Today's Briefing prompt based on company context and financial state.
 */
export function buildBriefingPrompt({ username, startupName, stage, financials, companyBrain, language }) {
  const { cashBalance, netBurn, runwayMonths, ltv, ltvCacRatio } = financials;
  const brainContext = buildBrainContext(companyBrain, startupName, stage);

  return `Generate a concise, proactive "Today's Briefing" for ${username}, founder of ${startupName || 'the startup'} (${stage} stage).

${brainContext}

FINANCIAL SNAPSHOT:
- Cash: $${cashBalance?.toLocaleString() || 'unknown'}
- Net Burn: $${netBurn?.toLocaleString() || 'unknown'}/mo
- Runway: ${runwayMonths || 'unknown'} months
- LTV: $${ltv?.toLocaleString() || 'unknown'} | LTV:CAC Ratio: ${ltvCacRatio || 'unknown'}x

BRIEFING FORMAT — use this exact structure:
## 🌅 Good Morning, ${username}
One sentence acknowledging their startup and current stage.

## 📊 Company Pulse
3 bullet points on the most critical metrics based on the financial snapshot above. Flag any red flags (runway < 6 months, LTV:CAC < 1.5x).

## 🎯 Today's Top Priority
The single most important thing this founder should do today based on their stage and company brain. Be specific.

## ⚡ 3 Quick Wins This Week
Three concrete, achievable actions with measurable outcomes.

## 💡 Strategic Insight
One forward-looking observation about an opportunity or risk the founder might be underestimating.

Respond in ${language}. Be direct, opinionated, and specific. No generic advice. Max 300 words.`;
}

/**
 * Builds a financial runway analysis prompt.
 */
export function buildRunwayPrompt({ startupName, cashBalance, monthlyExpenses, monthlyRevenue, netBurn, runwayMonths }) {
  return `Analyze financial runway for ${startupName || 'our startup'}.

METRICS:
- Cash in Bank: $${cashBalance.toLocaleString()}
- Monthly Expenses: $${monthlyExpenses.toLocaleString()}/mo
- Monthly Revenue: $${monthlyRevenue.toLocaleString()}/mo
- Net Burn: $${netBurn.toLocaleString()}/mo
- Current Runway: ${runwayMonths} months

Provide:
## 🎯 Runway Verdict
## 💡 Top 3 Cost Reduction Strategies (with projected savings)
## 📈 Revenue Acceleration Tactics (with realistic timelines)
## ⚡ 7-Day Action Plan`;
}

/**
 * Builds a unit economics analysis prompt.
 */
export function buildUnitEconomicsPrompt({ startupName, arpu, cac, grossMargin, monthlyChurn, ltv, ltvCacRatio, cacPaybackMonths }) {
  return `Analyze SaaS unit economics for ${startupName || 'our startup'}:

METRICS:
- ARPU: $${arpu}/mo
- CAC: $${cac}
- Gross Margin: ${grossMargin}%
- Monthly Churn: ${monthlyChurn}%
- LTV: $${ltv.toLocaleString()}
- LTV:CAC Ratio: ${ltvCacRatio}x
- CAC Payback: ${cacPaybackMonths} months

Provide:
## 🎯 Unit Economics Verdict
## 💡 Pricing & CAC Optimization (with comparison table)
## ⚠️ Churn Risks & Retention Levers
## ⚡ 7-Day Action Plan`;
}

/**
 * Builds a cap table review prompt.
 */
export function buildCapTablePrompt({ startupName, founderInitialPct, esopPoolPct, safeInvestment, postMoneyCap, safeDilutionPct, founderPostRoundPct }) {
  return `Review cap table & SAFE fundraising for ${startupName || 'our startup'}:

STRUCTURE:
- Pre-Round Founder Ownership: ${founderInitialPct}%
- Reserved ESOP Option Pool: ${esopPoolPct}%
- SAFE Investment Amount: $${safeInvestment.toLocaleString()}
- Post-Money Valuation Cap: $${postMoneyCap.toLocaleString()}
- Calculated Investor Dilution: ${safeDilutionPct}%
- Founder Post-Round Ownership: ${founderPostRoundPct}%

Provide:
## 🎯 Cap Table Verdict
## 💡 Valuation & Dilution Analysis
## ⚠️ Investor Terms & Governance Watch
## ⚡ 7-Day Fundraising Action Plan`;
}

/**
 * Builds an investor memo polish prompt.
 */
export function buildInvestorMemoPrompt({ startupName, stage, memoMonth, cashBalance, netBurn, runwayMonths, monthlyRevenue, memoHighs, memoLows, memoAsks }) {
  return `Draft a world-class YC-style Monthly Investor Update email for ${startupName || 'our startup'} (${stage} stage):

PERIOD: ${memoMonth}
FINANCIAL SNAPSHOT:
- Cash: $${cashBalance.toLocaleString()} | Monthly Burn: $${netBurn.toLocaleString()}/mo | Runway: ${runwayMonths} months
- MRR: $${monthlyRevenue.toLocaleString()}/mo

CONTENT:
- Key Highlights & Wins: "${memoHighs}"
- Key Lows & Challenges: "${memoLows}"
- Core Asks: "${memoAsks}"

Format as a ready-to-send executive email with these sections:
🚀 Highs, 📉 Lows, 📊 Metrics Snapshot, 🤝 The Asks.
Tone: confident, honest, and relationship-focused. Max 300 words.`;
}

// ── Private helpers ────────────────────────────────────────────────

/**
 * Serializes the Company Brain into a structured context block for prompt injection.
 */
function buildBrainContext(brain, fallbackStartupName, fallbackStage) {
  if (!brain || Object.keys(brain).length === 0) return '';

  const lines = ['COMPANY BRAIN (persistent startup context):'];

  if (brain.industry) lines.push(`- Industry: ${brain.industry}`);
  if (brain.founded) lines.push(`- Founded: ${brain.founded}`);
  if (brain.teamSize) lines.push(`- Team Size: ${brain.teamSize}`);
  if (brain.icp) lines.push(`- Ideal Customer Profile (ICP): ${brain.icp}`);
  if (brain.uniqueValue) lines.push(`- Unique Value Proposition: ${brain.uniqueValue}`);
  if (brain.businessModel) lines.push(`- Business Model: ${brain.businessModel}`);
  if (brain.topCompetitors) lines.push(`- Top Competitors: ${brain.topCompetitors}`);
  if (brain.moat) lines.push(`- Competitive Moat: ${brain.moat}`);
  if (brain.currentMrr) lines.push(`- Current MRR: $${brain.currentMrr}`);
  if (brain.customerCount) lines.push(`- Active Customers: ${brain.customerCount}`);
  if (brain.fundraisingStatus) lines.push(`- Fundraising Status: ${brain.fundraisingStatus}`);
  if (brain.biggestChallenge) lines.push(`- Biggest Challenge: ${brain.biggestChallenge}`);
  if (brain.goals) lines.push(`- Current Goals: ${brain.goals}`);
  if (brain.additionalContext) lines.push(`- Additional Context: ${brain.additionalContext}`);

  if (lines.length === 1) return ''; // Only had the header, no actual data

  return lines.join('\n');
}
