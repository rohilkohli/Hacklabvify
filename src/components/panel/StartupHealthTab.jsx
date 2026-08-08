// src/components/panel/StartupHealthTab.jsx
// Startup Health Radar tab for the Right Tools Panel.

const HEALTH_ITEMS = [
  { id: 'product', title: 'Product & PMF', score: 88, status: 'Strong', color: 'var(--success)' },
  { id: 'finance', title: 'Finance & Runway', score: 72, status: 'Moderate', color: 'var(--accent-amber)' },
  { id: 'growth', title: 'Growth & Acquisition', score: 81, status: 'Strong', color: 'var(--success)' },
  { id: 'tech', title: 'Technology & Security', score: 94, status: 'Excellent', color: 'var(--success)' },
  { id: 'marketing', title: 'Marketing & Positioning', score: 68, status: 'Needs Work', color: 'var(--accent-amber)' },
  { id: 'fundraising', title: 'Fundraising Readiness', score: 85, status: 'Strong', color: 'var(--success)' },
];

export function StartupHealthTab({ onAskHealthDiagnostic }) {
  const overallScore = Math.round(HEALTH_ITEMS.reduce((acc, d) => acc + d.score, 0) / HEALTH_ITEMS.length);

  return (
    <div className="tab-pane-container">
      {/* Overall Score Box */}
      <div className="context-section" style={{ textAlign: 'center', padding: '12px' }}>
        <div className="field-label">Overall Startup Health Score</div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 600, color: 'var(--accent)' }}>
          {overallScore} <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>/ 100</span>
        </div>
      </div>

      {/* 6 Dimension Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {HEALTH_ITEMS.map((item) => (
          <div
            key={item.id}
            className="slide-card-item"
            style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
            onClick={() => onAskHealthDiagnostic(`Give me a diagnostic and 3-step action plan to improve our ${item.title} score from ${item.score}/100.`)}
          >
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
              {item.title}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px' }}>
              <span style={{ color: item.color, fontWeight: 600 }}>{item.score} / 100</span>
              <span style={{ color: 'var(--text-muted)' }}>{item.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
