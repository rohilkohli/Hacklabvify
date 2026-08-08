// src/components/panel/FinancialsTab.jsx
import { useCallback } from 'react';

export function FinancialsTab({ financials, t, onAskRunway, onAskUnitEcon, onAskCapTable }) {
  const {
    cashBalance, monthlyExpenses, monthlyRevenue,
    arpu, cac, grossMargin, monthlyChurn,
    safeInvestment, postMoneyCap, esopPoolPct,
    setCashBalance, setMonthlyExpenses, setMonthlyRevenue,
    setArpu, setCac, setGrossMargin, setMonthlyChurn,
    setSafeInvestment, setPostMoneyCap,
    netBurn, runwayMonths, gaugePercent,
    ltv, ltvCacRatio, cacPaybackMonths,
    safeDilutionPct, founderPostRoundPct,
    getRunwayColor, getLtvCacColor,
  } = financials;

  const ltvColor = getLtvCacColor();

  return (
    <>
      {/* Runway Calculator */}
      <div className="context-section">
        <div className="context-section-header">
          <h4>{t.runwayCalc}</h4>
          <button className="mini-link-btn" onClick={onAskRunway}>⚡ AI Optimize</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
          <div>
            <label className="field-label">Cash ($)</label>
            <input type="number" className="context-input" value={cashBalance}
              onChange={(e) => setCashBalance(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Expenses ($/mo)</label>
            <input type="number" className="context-input" value={monthlyExpenses}
              onChange={(e) => setMonthlyExpenses(e.target.value)} />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label className="field-label">Revenue ($/mo)</label>
            <input type="number" className="context-input" value={monthlyRevenue}
              onChange={(e) => setMonthlyRevenue(e.target.value)} />
          </div>
        </div>

        <div className="gauge-bar-outer">
          <div className="gauge-bar-inner" style={{ width: `${gaugePercent}%`, backgroundColor: getRunwayColor() }} />
        </div>
        <div style={{ marginTop: '6px', fontSize: '11.5px', color: getRunwayColor(), fontWeight: 500 }}>
          {t.runway}: {runwayMonths} mo · {t.burn}: ${netBurn.toLocaleString()}/mo
        </div>
      </div>

      {/* SaaS Unit Economics */}
      <div className="context-section">
        <div className="context-section-header">
          <h4>{t.unitEconTitle}</h4>
          <button className="mini-link-btn" onClick={onAskUnitEcon}>✦ Analyze</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
          <div>
            <label className="field-label">ARPU ($/mo)</label>
            <input type="number" className="context-input" value={arpu}
              onChange={(e) => setArpu(e.target.value)} />
          </div>
          <div>
            <label className="field-label">CAC ($)</label>
            <input type="number" className="context-input" value={cac}
              onChange={(e) => setCac(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Margin (%)</label>
            <input type="number" className="context-input" value={grossMargin}
              onChange={(e) => setGrossMargin(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Churn (%/mo)</label>
            <input type="number" step="0.5" className="context-input" value={monthlyChurn}
              onChange={(e) => setMonthlyChurn(e.target.value)} />
          </div>
        </div>

        <div className="metrics-row">
          <span>LTV: <strong style={{ color: 'var(--text-primary)' }}>${ltv.toLocaleString()}</strong></span>
          <span>Ratio: <strong style={{ color: ltvColor }}>{ltvCacRatio}x</strong></span>
          <span>Payback: <strong style={{ color: 'var(--text-primary)' }}>{cacPaybackMonths} mo</strong></span>
        </div>
      </div>

      {/* Cap Table & SAFE Dilution */}
      <div className="context-section">
        <div className="context-section-header">
          <h4>{t.capTableTitle}</h4>
          <button className="mini-link-btn" onClick={onAskCapTable}>✦ Review</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
          <div>
            <label className="field-label">SAFE Raise ($)</label>
            <input type="number" className="context-input" value={safeInvestment}
              onChange={(e) => setSafeInvestment(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Post-Cap ($)</label>
            <input type="number" className="context-input" value={postMoneyCap}
              onChange={(e) => setPostMoneyCap(e.target.value)} />
          </div>
        </div>

        <div className="equity-bar-outer">
          <div className="equity-seg-founder" style={{ width: `${founderPostRoundPct}%` }} title={`Founder: ${founderPostRoundPct}%`} />
          <div className="equity-seg-investor" style={{ width: `${safeDilutionPct}%` }} title={`Investors: ${safeDilutionPct}%`} />
          <div className="equity-seg-esop" style={{ width: `${esopPoolPct}%` }} title={`ESOP: ${esopPoolPct}%`} />
        </div>

        <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <span>👤 <strong>{founderPostRoundPct}%</strong></span>
          <span>💰 <strong>{safeDilutionPct}%</strong></span>
          <span>👥 ESOP <strong>{esopPoolPct}%</strong></span>
        </div>
      </div>

      {/* TAM/SAM/SOM */}
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
  );
}
