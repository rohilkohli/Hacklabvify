// src/components/panel/RightPanel.jsx
// Right column orchestrator. Manages tab switching and routes to sub-panels.

import { useState, useCallback } from 'react';
import { ADVISOR_PERSONAS } from '../../config/constants.js';
import { FinancialsTab } from './FinancialsTab.jsx';
import { PitchTab } from './PitchTab.jsx';
import { MemoTab } from './MemoTab.jsx';
import { SavedTab } from './SavedTab.jsx';
import { CompanyBrainTab } from './CompanyBrainTab.jsx';

export function RightPanel({
  t,
  persona, setPersona,
  financials,
  brain, onUpdateBrainField, brainCompletionScore,
  savedInsights, onCopyMessage, onDeleteBookmark,
  onExportSession, startupName, stage, activePersonaObj, pitchSlides,
  onAskRunway, onAskUnitEcon, onAskCapTable, onAskMemo, onCopyMemo,
  onToast,
}) {
  const [activeTab, setActiveTab] = useState('brain');

  const handlePersonaChange = useCallback((p) => {
    setPersona(p.id);
    onToast?.(`Tone: ${p.name}`);
  }, [setPersona, onToast]);

  return (
    <div className="context-tools-col">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
        <h3 className="context-title">{t.toolsTitle}</h3>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className="mini-link-btn" onClick={() => onExportSession('txt', { startup: startupName, stage, persona, pitchSlides })}>TXT</button>
          <button className="mini-link-btn" onClick={() => onExportSession('md', { startup: startupName, stage, persona, pitchSlides })}>MD</button>
          <button className="mini-link-btn" onClick={() => onExportSession('json', { startup: startupName, stage, persona, pitchSlides })}>JSON</button>
        </div>
      </div>

      {/* Advisor Persona Switcher */}
      <div className="persona-chip-group">
        {ADVISOR_PERSONAS.map((p) => (
          <div
            key={p.id}
            className={`persona-chip ${persona === p.id ? 'active' : ''}`}
            onClick={() => handlePersonaChange(p)}
            title={p.desc}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handlePersonaChange(p)}
          >
            {p.icon} {p.name}
          </div>
        ))}
      </div>

      {/* Tab Bar */}
      <div className="right-tab-bar" role="tablist">
        {[
          { id: 'brain', label: t.tabBrain },
          { id: 'financials', label: `📊 ${t.tabFinancials}` },
          { id: 'pitch', label: `🎴 ${t.tabPitch}` },
          { id: 'memo', label: `📝 ${t.tabMemo}` },
          { id: 'saved', label: `🔖 ${t.tabSaved} (${savedInsights.length})` },
        ].map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            className={`right-tab-btn ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'brain' && (
        <CompanyBrainTab
          brain={brain}
          onUpdateField={onUpdateBrainField}
          completionScore={brainCompletionScore}
          t={t}
        />
      )}

      {activeTab === 'financials' && (
        <FinancialsTab
          financials={financials}
          t={t}
          onAskRunway={onAskRunway}
          onAskUnitEcon={onAskUnitEcon}
          onAskCapTable={onAskCapTable}
        />
      )}

      {activeTab === 'pitch' && (
        <PitchTab
          pitchSlides={pitchSlides}
          onUpdateSlide={financials.updateSlideDetail}
          t={t}
        />
      )}

      {activeTab === 'memo' && (
        <MemoTab
          financials={financials}
          t={t}
          onCopyMemo={onCopyMemo}
          onAIPolish={onAskMemo}
        />
      )}

      {activeTab === 'saved' && (
        <SavedTab
          savedInsights={savedInsights}
          onCopy={onCopyMessage}
          onDelete={onDeleteBookmark}
        />
      )}

      <div className="context-hint">
        <p>{t.contextHint}</p>
      </div>
    </div>
  );
}
