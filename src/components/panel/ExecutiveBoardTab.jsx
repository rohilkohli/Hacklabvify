// src/components/panel/ExecutiveBoardTab.jsx
// Virtual Executive Board tab for the Right Tools Panel.

import { useState } from 'react';
import { useBoardStore } from '../../store/boardStore.js';
import { useTaskStore } from '../../store/taskStore.js';
import { useSessionStore } from '../../store/sessionStore.js';
import { AGENT_MODES } from '../../config/agents.config.js';

export function ExecutiveBoardTab({ onToast }) {
  const {
    agents, mode, setMode, primaryAgentId, setPrimaryAgentId,
    activeTopic, isConsulting, boardResponses, consensusVerdict,
    actionableTasks, runBoardConsultation
  } = useBoardStore();

  const { addMultipleTasks } = useTaskStore();
  const { startupName, stage } = useSessionStore();
  const [topicInput, setTopicInput] = useState('');

  const PRESET_TOPICS = [
    'Should we pivot from self-serve SMB to enterprise B2B sales?',
    'How do we lower CAC by 40% while maintaining lead volume?',
    'CTO vs CFO: Should we double cloud compute budget for AI features?',
    'Are we ready to raise a $500k Pre-Seed round this month?',
  ];

  const handleStartConsultation = (query) => {
    const q = query || topicInput;
    if (!q.trim() || isConsulting) return;
    runBoardConsultation(q, { startupName, stage });
    if (!query) setTopicInput('');
  };

  const handleApproveTasks = () => {
    if (actionableTasks.length === 0) return;
    addMultipleTasks(actionableTasks, 'Executive Board');
    onToast?.('Tasks added to Task Planner!');
  };

  return (
    <div className="tab-pane-container">
      {/* Collaboration Mode Bar */}
      <div className="mode-selector-bar">
        {[
          { id: AGENT_MODES.BOARD_MEETING, label: '👑 Board' },
          { id: AGENT_MODES.PANEL, label: '👥 Panel' },
          { id: AGENT_MODES.DEBATE, label: '⚔️ Debate' },
          { id: AGENT_MODES.ADVISOR, label: '👤 1-on-1' },
        ].map((m) => (
          <button
            key={m.id}
            className={`mode-selector-btn ${mode === m.id ? 'active' : ''}`}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Roster Badges */}
      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', margin: '8px 0' }}>
        {agents.slice(0, 6).map((a) => (
          <span key={a.id} className="user-badge" style={{ fontSize: '10.5px' }}>
            {a.icon} {a.title}
          </span>
        ))}
      </div>

      {/* Consultation Input */}
      <div className="context-section">
        <label className="field-label">Convene C-Suite on Strategic Question</label>
        <textarea
          className="context-textarea"
          rows={2}
          placeholder="e.g., 'Should we reduce pricing for new users?'"
          value={topicInput}
          onChange={(e) => setTopicInput(e.target.value)}
          disabled={isConsulting}
        />
        <button
          className="glow-start-btn"
          style={{ width: '100%', marginTop: '8px', padding: '9px 14px' }}
          onClick={() => handleStartConsultation()}
          disabled={!topicInput.trim() || isConsulting}
        >
          {isConsulting ? 'Consulting C-Suite...' : 'Convene Board ✦'}
        </button>

        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '8px' }}>
          {PRESET_TOPICS.map((topic, i) => (
            <button
              key={i}
              className="suggestion-chip"
              style={{ fontSize: '11px', padding: '4px 9px' }}
              onClick={() => handleStartConsultation(topic)}
              disabled={isConsulting}
            >
              ✦ {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Consensus Output */}
      {consensusVerdict && (
        <div className="context-section" style={{ borderColor: 'var(--accent)' }}>
          <div className="context-section-header">
            <h4 style={{ color: 'var(--accent)' }}>🎯 Board Consensus Verdict</h4>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {consensusVerdict}
          </div>

          {actionableTasks.length > 0 && (
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
              <div className="field-label">Board Action Items</div>
              <ul style={{ paddingLeft: '16px', fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {actionableTasks.map((t, idx) => (
                  <li key={idx}>{t}</li>
                ))}
              </ul>
              <button
                className="mini-link-btn"
                style={{ marginTop: '8px', color: 'var(--accent)' }}
                onClick={handleApproveTasks}
              >
                + Add to Task Planner
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
