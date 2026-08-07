import React from 'react';

export function BorderBeam({
  children,
  className = '',
  duration = 7,
  borderWidth = 1.5,
  colorFrom = '#F59E0B',
  colorTo = '#EC4899',
  borderRadius = '20px',
  style = {}
}) {
  return (
    <div
      className={`border-beam-wrapper ${className}`}
      style={{
        position: 'relative',
        borderRadius: borderRadius,
        width: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        ...style
      }}
    >
      <style>{`
        @keyframes borderBeamRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Single Moving Glowing Light Streak Beam along perimeter border */}
      <div
        style={{
          position: 'absolute',
          inset: -borderWidth,
          borderRadius: `calc(${borderRadius} + ${borderWidth}px)`,
          padding: `${borderWidth}px`,
          background: `conic-gradient(from 0deg, transparent 0deg, transparent 290deg, ${colorFrom} 335deg, ${colorTo} 360deg)`,
          animation: `borderBeamRotate ${duration}s linear infinite`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          pointerEvents: 'none',
          zIndex: 10,
          filter: `drop-shadow(0 0 4px ${colorFrom}) drop-shadow(0 0 8px ${colorTo})`,
        }}
      />

      {children}
    </div>
  );
}

export default BorderBeam;
