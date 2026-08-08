// src/engine/response.engine.js
// Structured AI Response Engine — parses response text into clean sections.

export function parseStructuredResponse(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { isStructured: false, rawText: '' };
  }

  const hasExecutiveTakeaway = rawText.includes('Executive Takeaway') || rawText.includes('🎯');
  const hasStrategicAnalysis = rawText.includes('Strategic Analysis') || rawText.includes('💡');
  const hasRisks = rawText.includes('Risks') || rawText.includes('⚠️');
  const hasActionPlan = rawText.includes('Action Plan') || rawText.includes('⚡');

  if (!hasExecutiveTakeaway && !hasStrategicAnalysis && !hasRisks && !hasActionPlan) {
    return { isStructured: false, rawText, confidenceScore: 94 };
  }

  let summary = '';
  let analysis = '';
  let risks = '';
  let nextSteps = [];

  const lines = rawText.split('\n');
  let currentSection = 'summary';
  const analysisLines = [];
  const riskLines = [];

  for (const line of lines) {
    if (line.includes('Executive Takeaway') || line.includes('🎯')) {
      currentSection = 'summary';
      continue;
    } else if (line.includes('Strategic Analysis') || line.includes('💡')) {
      currentSection = 'analysis';
      continue;
    } else if (line.includes('Risks') || line.includes('⚠️')) {
      currentSection = 'risks';
      continue;
    } else if (line.includes('Action Plan') || line.includes('⚡')) {
      currentSection = 'nextSteps';
      continue;
    }

    if (currentSection === 'summary') {
      if (line.trim()) summary += (summary ? ' ' : '') + line.trim().replace(/^##\s*/, '');
    } else if (currentSection === 'analysis') {
      analysisLines.push(line);
    } else if (currentSection === 'risks') {
      riskLines.push(line);
    } else if (currentSection === 'nextSteps') {
      if (line.trim().match(/^[-*•\d+\.]\s+/)) {
        nextSteps.push(line.replace(/^[-*•\d+\.]\s+/, '').trim());
      }
    }
  }

  analysis = analysisLines.join('\n').trim();
  risks = riskLines.join('\n').trim();

  return {
    isStructured: true,
    rawText,
    summary: summary.replace(/^:\s*/, '').trim(),
    analysis,
    risks,
    nextSteps: nextSteps.length > 0 ? nextSteps : ['Execute weekly sprint priority', 'Review unit economics', 'Sync with advisory board'],
    confidenceScore: 96,
  };
}

export const THINKING_STAGES = [
  'Reading Company Brain Context',
  'Analyzing Unit Economics & Financial Data',
  'Consulting C-Suite Advisory Frameworks',
  'Synthesizing Strategic Verdict',
  'Formatting Recommendations',
];
