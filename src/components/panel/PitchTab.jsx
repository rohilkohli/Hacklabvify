// src/components/panel/PitchTab.jsx
export function PitchTab({ pitchSlides, onUpdateSlide, t }) {
  return (
    <div className="context-section">
      <div className="context-section-header">
        <h4>{t.pitchDeck}</h4>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '420px', overflowY: 'auto' }}>
        {pitchSlides.map((slide) => (
          <div key={slide.id} className="slide-card-item">
            <div className="slide-card-title">{slide.title}</div>
            <input
              type="text"
              className="context-input"
              style={{ fontSize: '10.5px', marginTop: '4px', padding: '4px 6px' }}
              value={slide.detail}
              onChange={(e) => onUpdateSlide(slide.id, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
