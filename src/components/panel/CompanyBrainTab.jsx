// src/components/panel/CompanyBrainTab.jsx
// The Company Brain — persistent, structured knowledge base about the startup.
// Context entered here is automatically injected into every AI response.

import { BrainIcon } from '../icons.jsx';

const BRAIN_FIELDS = [
  { key: 'industry', label: 'Industry / Vertical', placeholder: 'e.g., B2B SaaS, HealthTech, FinTech' },
  { key: 'founded', label: 'Founded', placeholder: 'e.g., 2024' },
  { key: 'teamSize', label: 'Team Size', placeholder: 'e.g., 3 full-time' },
  { key: 'icp', label: 'Ideal Customer Profile (ICP)', placeholder: 'e.g., CTOs at 50–200 person SaaS companies' },
  { key: 'uniqueValue', label: 'Unique Value Proposition', placeholder: 'What makes you 10x better?' },
  { key: 'businessModel', label: 'Business Model', placeholder: 'e.g., B2B SaaS, $49/mo per seat' },
  { key: 'topCompetitors', label: 'Top Competitors', placeholder: 'e.g., Linear, Jira, Notion' },
  { key: 'moat', label: 'Competitive Moat', placeholder: 'e.g., Network effects, proprietary data' },
  { key: 'currentMrr', label: 'Current MRR ($)', placeholder: 'e.g., 18000' },
  { key: 'customerCount', label: 'Active Customers', placeholder: 'e.g., 42' },
  { key: 'fundraisingStatus', label: 'Fundraising Status', placeholder: 'e.g., Raising $500k Pre-Seed' },
  { key: 'biggestChallenge', label: 'Biggest Challenge Right Now', placeholder: 'Be honest — what keeps you up at night?' },
  { key: 'goals', label: 'Current Goals (90-Day)', placeholder: 'e.g., Hit $30k MRR, close 5 enterprise pilots' },
  { key: 'additionalContext', label: 'Additional Context', placeholder: 'Anything else the AI should know about your startup' },
];

export function CompanyBrainTab({ brain, onUpdateField, completionScore, t }) {
  const filledFields = Object.values(brain).filter((v) => v && v.trim() !== '').length;
  const totalFields = BRAIN_FIELDS.length;

  const scoreColor = completionScore >= 70
    ? 'var(--success)'
    : completionScore >= 30
    ? 'var(--accent-amber)'
    : 'var(--accent-red)';

  return (
    <>
      {/* Header card */}
      <div className="context-section">
        <div className="context-section-header">
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BrainIcon />
            {t.companyBrainTitle}
          </h4>
          <span style={{ fontSize: '10px', color: scoreColor, fontWeight: 700 }}>
            {completionScore}% complete
          </span>
        </div>

        {/* Completion bar */}
        <div className="gauge-bar-outer" style={{ marginBottom: '8px' }}>
          <div className="gauge-bar-inner" style={{ width: `${completionScore}%`, backgroundColor: scoreColor }} />
        </div>

        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '2px' }}>
          {t.companyBrainDesc}
        </p>
      </div>

      {/* Brain fields */}
      <div className="context-section">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '460px', overflowY: 'auto', paddingRight: '2px' }}>
          {BRAIN_FIELDS.map(({ key, label, placeholder }) => {
            const isLong = key === 'icp' || key === 'uniqueValue' || key === 'biggestChallenge' || key === 'goals' || key === 'additionalContext';
            const isFilled = brain[key] && brain[key].trim() !== '';

            return (
              <div key={key}>
                <label className="field-label" style={{ color: isFilled ? 'var(--accent)' : undefined }}>
                  {isFilled ? '✓ ' : ''}{label}
                </label>
                {isLong ? (
                  <textarea
                    className="context-textarea"
                    rows={2}
                    placeholder={placeholder}
                    value={brain[key] || ''}
                    onChange={(e) => onUpdateField(key, e.target.value)}
                  />
                ) : (
                  <input
                    type="text"
                    className="context-input"
                    placeholder={placeholder}
                    value={brain[key] || ''}
                    onChange={(e) => onUpdateField(key, e.target.value)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="context-hint" style={{ fontSize: '11px' }}>
        <strong>🧠 Pro tip:</strong> The more context you add here, the more specific and actionable every AI response becomes. Your AI co-founder knows your startup as well as you tell it.
      </div>
    </>
  );
}
