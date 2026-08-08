// src/components/panel/SavedTab.jsx
export function SavedTab({ savedInsights, onCopy, onDelete }) {
  return (
    <div className="context-section">
      <div className="context-section-header">
        <h4>Saved Insights ({savedInsights.length})</h4>
      </div>
      {savedInsights.length === 0 ? (
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '4px 0', lineHeight: 1.5 }}>
          No bookmarks yet. Click "Save" under any assistant message to capture insights here.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '380px', overflowY: 'auto' }}>
          {savedInsights.map((item) => (
            <div key={item.id} style={{
              background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--r-sm)', padding: '8px 10px',
            }}>
              <div style={{ fontSize: '11px', color: 'var(--text-primary)', lineHeight: 1.45 }}>{item.snippet}</div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px', justifyContent: 'flex-end' }}>
                <button className="mini-link-btn" onClick={() => onCopy(item.full)}>Copy</button>
                <button className="mini-link-btn" style={{ color: 'var(--accent-red)' }} onClick={() => onDelete(item.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
