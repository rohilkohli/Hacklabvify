// src/components/common/CommandPalette.jsx
// Raycast-style Command Palette component (Cmd + K).

import { useState, useEffect, useRef } from 'react';

export function CommandPalette({ isOpen, onClose, onSelectAction }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const COMMAND_ITEMS = [
    { id: 'tab-brain', title: "Company Brain Profile (14 Knowledge Fields)", category: 'Tools', action: () => onSelectAction('tab', 'brain') },
    { id: 'tab-board', title: "Virtual Executive Board (C-Suite Multi-Agent)", category: 'Tools', action: () => onSelectAction('tab', 'board') },
    { id: 'tab-financials', title: "Financial Runway & Unit Economics Modeler", category: 'Tools', action: () => onSelectAction('tab', 'financials') },
    { id: 'tab-tasks', title: "Task Planner Engine (1-Click Action Items)", category: 'Tools', action: () => onSelectAction('tab', 'tasks') },
    { id: 'tab-health', title: "Startup Health Radar (6-Dimension Scorecard)", category: 'Tools', action: () => onSelectAction('tab', 'health') },
    { id: 'tab-pitch', title: "Pitch Deck Builder (10-Slide Outline)", category: 'Tools', action: () => onSelectAction('tab', 'pitch') },
    { id: 'tab-memo', title: "Investor Update Memo Generator", category: 'Tools', action: () => onSelectAction('tab', 'memo') },

    { id: 'prompt-top3', title: "Top 3 Immediate Execution Actions", category: 'Playbooks', action: () => onSelectAction('prompt', 'Give me the top 3 immediate actionable execution steps for our startup this week.') },
    { id: 'prompt-market', title: "Comprehensive Market Research (TAM/SAM/SOM)", category: 'Playbooks', action: () => onSelectAction('prompt', 'Give me a comprehensive Market Research overview (TAM/SAM/SOM, trends, target customer segments).') },
    { id: 'prompt-competitors', title: "Analyze Top 5 Competitors & Moat", category: 'Playbooks', action: () => onSelectAction('prompt', 'Analyze the top 5 competitors, key differentiators, and our competitive moat.') },
    { id: 'prompt-pitch', title: "Create 10-Slide Pitch Deck Outline", category: 'Playbooks', action: () => onSelectAction('prompt', 'Create a complete 10-slide pitch deck outline with slide titles and key bullet points.') },
    { id: 'prompt-runway', title: "Analyze Runway & Burn Multiples", category: 'Playbooks', action: () => onSelectAction('prompt', 'Analyze our unit economics, CAC/LTV, burn rate, and runway optimization strategies.') },
  ];

  const filteredItems = COMMAND_ITEMS.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : onSelectAction('openPalette');
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onSelectAction]);

  const handleInputKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      e.preventDefault();
      filteredItems[selectedIndex].action();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="cmd-overlay" onClick={onClose}>
      <div className="cmd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-header">
          <span style={{ color: 'var(--accent)', fontSize: '16px' }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="cmd-input"
            placeholder="Type a command, search tools, or launch a playbook... (Esc to close)"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleInputKeyDown}
          />
          <button className="cmd-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="cmd-body">
          {filteredItems.length === 0 ? (
            <div className="cmd-empty">No commands found matching "{query}"</div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  className={`cmd-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => { item.action(); onClose(); }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="cmd-item-left">
                    <span className="cmd-item-title">{item.title}</span>
                  </div>
                  <span className="cmd-item-category">{item.category}</span>
                </div>
              );
            })
          )}
        </div>

        <div className="cmd-footer">
          <span>Navigation: <kbd>↑</kbd> <kbd>↓</kbd></span>
          <span>Select: <kbd>↵</kbd></span>
          <span>Dismiss: <kbd>Esc</kbd></span>
        </div>
      </div>
    </div>
  );
}
