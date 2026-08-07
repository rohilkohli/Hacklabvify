import React from 'react';

export function BorderBeam({
  children,
  className = '',
  duration = 8,
  borderWidth = 1.5,
  colorFrom = '#3B82F6',
  colorTo = '#10B981',
  borderRadius = '28px',
  style = {}
}) {
  return (
    <div
      className={`border-beam-wrapper ${className}`}
      style={{
        position: 'relative',
        borderRadius: borderRadius,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        boxSizing: 'border-box',
        ...style
      }}
    >
      <style>{`
        @keyframes borderBeamRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* Animated Glowing Border Beam Overlay */}
      <div
        className="border-beam-line"
        style={{
          position: 'absolute',
          inset: -borderWidth,
          borderRadius: `calc(${borderRadius} + ${borderWidth}px)`,
          padding: `${borderWidth}px`,
          background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, ${colorFrom} 90deg, ${colorTo} 180deg, transparent 270deg)`,
          animation: `borderBeamRotate ${duration}s linear infinite`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          pointerEvents: 'none',
          zIndex: 3,
        }}
      />

      {children}
    </div>
  );
}

export default BorderBeam;
