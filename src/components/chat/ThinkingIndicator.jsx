// src/components/chat/ThinkingIndicator.jsx
// Multi-stage AI thinking progress indicator.

import { useState, useEffect } from 'react';
import { THINKING_STAGES } from '../../engine/response.engine.js';
import { BotAvatar } from '../icons.jsx';

export function ThinkingIndicator() {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev < THINKING_STAGES.length - 1 ? prev + 1 : prev));
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="msg-row assistant">
      <BotAvatar thinking={true} />
      <div className="msg-wrapper">
        <div className="msg-bubble" style={{ padding: '8px 4px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.04em' }}>
              ✦ REASONING IN PROGRESS...
            </div>
            {THINKING_STAGES.map((stage, idx) => {
              const isDone = idx < stageIndex;
              const isCurrent = idx === stageIndex;
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isCurrent ? 'var(--text-primary)' : isDone ? 'var(--accent)' : 'var(--text-muted)' }}>
                  <span>{isDone ? '✓' : isCurrent ? '⚡' : '○'}</span>
                  <span>{stage}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
