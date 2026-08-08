// src/components/chat/MessageBubble.jsx
// Render message bubble with structured outputs, collapsible reasoning, and task approvals.

import { useState } from 'react';
import { parseMarkdown, formatTimestamp } from '../../utils/markdown.jsx';
import { parseStructuredResponse } from '../../engine/response.engine.js';
import { BotAvatar } from '../icons.jsx';
import { useTaskStore } from '../../store/taskStore.js';

export function MessageBubble({ msg, onCopy, onBookmark }) {
  const isAssistant = msg.role === 'assistant';
  const [showReasoning, setShowReasoning] = useState(false);
  const { addMultipleTasks } = useTaskStore();

  const structured = isAssistant ? parseStructuredResponse(msg.content) : null;

  const handleApproveTasks = () => {
    if (structured?.nextSteps?.length > 0) {
      addMultipleTasks(structured.nextSteps, 'AI Advisory');
    }
  };

  return (
    <div className={`msg-row ${msg.role}`}>
      {isAssistant && <BotAvatar />}
      <div className="msg-wrapper">
        <div className="msg-bubble">
          {!isAssistant ? (
            msg.content
          ) : structured?.isStructured ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Executive Verdict */}
              {structured.summary && (
                <div style={{ background: 'var(--accent-dim)', borderLeft: '3.5px solid var(--accent)', padding: '10px 14px', borderRadius: '0 var(--r-sm) var(--r-sm) 0', fontSize: '13.5px', color: 'var(--text-primary)' }}>
                  🎯 <strong>Executive Verdict:</strong> {structured.summary}
                </div>
              )}

              {/* Collapsible Reasoning */}
              {structured.analysis && (
                <div>
                  <button
                    className="mini-link-btn"
                    style={{ width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', padding: '6px 10px' }}
                    onClick={() => setShowReasoning(!showReasoning)}
                  >
                    <span>💡 Detailed Strategic Reasoning</span>
                    <span>{showReasoning ? '▲' : '▼'}</span>
                  </button>
                  {showReasoning && (
                    <div style={{ marginTop: '6px', padding: '10px', background: 'var(--bg-card)', borderRadius: 'var(--r-sm)', fontSize: '13px' }}>
                      {parseMarkdown(structured.analysis)}
                    </div>
                  )}
                </div>
              )}

              {/* Risks */}
              {structured.risks && (
                <div className="md-callout">
                  <span className="md-callout-icon">⚠️</span>
                  <div>{parseMarkdown(structured.risks)}</div>
                </div>
              )}

              {/* Action Plan Tasks */}
              {structured.nextSteps?.length > 0 && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--r-md)', padding: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)', marginBottom: '6px' }}>
                    ⚡ 7-DAY EXECUTION MILESTONES
                  </div>
                  <ul style={{ paddingLeft: '16px', fontSize: '12.5px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {structured.nextSteps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                  <button
                    className="mini-link-btn"
                    style={{ marginTop: '8px', color: 'var(--accent)' }}
                    onClick={handleApproveTasks}
                  >
                    + Add Tasks to Planner
                  </button>
                </div>
              )}
            </div>
          ) : (
            parseMarkdown(msg.content)
          )}
        </div>

        <div className="msg-timestamp">{formatTimestamp(msg.ts)}</div>

        {isAssistant && (
          <div className="msg-actions">
            <button className="msg-action-btn" onClick={() => onCopy(msg.content)}>Copy</button>
            <button className="msg-action-btn" onClick={() => onBookmark(msg.content)}>Save</button>
          </div>
        )}
      </div>
    </div>
  );
}
