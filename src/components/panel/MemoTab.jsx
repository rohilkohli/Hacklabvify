// src/components/panel/MemoTab.jsx
export function MemoTab({ financials, t, onCopyMemo, onAIPolish }) {
  const {
    memoMonth, setMemoMonth,
    memoHighs, setMemoHighs,
    memoLows, setMemoLows,
    memoAsks, setMemoAsks,
    monthlyRevenue, netBurn, runwayMonths,
  } = financials;

  return (
    <div className="context-section">
      <div className="context-section-header">
        <h4>{t.investorMemoTitle}</h4>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className="mini-link-btn" onClick={onCopyMemo}>{t.copyMemoBtn}</button>
          <button className="mini-link-btn" style={{ color: 'var(--accent)' }} onClick={onAIPolish}>{t.polishMemoBtn}</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div>
          <label className="field-label">Period / Month</label>
          <input type="text" className="context-input" value={memoMonth}
            onChange={(e) => setMemoMonth(e.target.value)} />
        </div>

        <div>
          <label className="field-label">🚀 Highs & Highlights</label>
          <textarea className="context-textarea" rows={2} value={memoHighs}
            onChange={(e) => setMemoHighs(e.target.value)} />
        </div>

        <div>
          <label className="field-label">📉 Lows & Challenges</label>
          <textarea className="context-textarea" rows={2} value={memoLows}
            onChange={(e) => setMemoLows(e.target.value)} />
        </div>

        <div>
          <label className="field-label">🤝 Key Asks</label>
          <textarea className="context-textarea" rows={2} value={memoAsks}
            onChange={(e) => setMemoAsks(e.target.value)} />
        </div>

        <div className="metrics-row" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-sm)', padding: '6px 8px' }}>
          <strong>${monthlyRevenue.toLocaleString()}/mo MRR</strong>
          <strong>${netBurn.toLocaleString()}/mo Burn</strong>
          <strong>{runwayMonths} mo Runway</strong>
        </div>
      </div>
    </div>
  );
}
