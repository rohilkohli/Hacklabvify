import React from 'react';

export function BorderBeam({
  children,
  className = '',
  duration = 6,
  borderWidth = 1.5,
  colorFrom = '#3B82F6',
  colorTo = '#10B981',
  borderRadius = '12px',
  style = {}
}) {
  return (
    <div
      className={`border-beam-container ${className}`}
      style={{
        position: 'relative',
        borderRadius: borderRadius,
        padding: `${borderWidth}px`,
        overflow: 'hidden',
        width: '100%',
        boxSizing: 'border-box',
        background: `linear-gradient(135deg, ${colorFrom}33, ${colorTo}33)`,
        boxShadow: `0 0 14px ${colorFrom}20`,
        ...style
      }}
    >
      <style>{`
        @keyframes borderBeamSpinMove {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* Spinning Conic Gradient bounded strictly by parent overflow: hidden */}
      <div
        style={{
          position: 'absolute',
          top: '-75%',
          left: '-75%',
          width: '250%',
          height: '250%',
          background: `conic-gradient(from 0deg, transparent 0deg, ${colorFrom} 70deg, ${colorTo} 140deg, transparent 210deg)`,
          animation: `borderBeamSpinMove ${duration}s linear infinite`,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Inner Content Layer masking the center */}
      <div
        style={{
          position: 'relative',
          borderRadius: `calc(${borderRadius} - ${borderWidth}px)`,
          overflow: 'hidden',
          width: '100%',
          height: '100%',
          zIndex: 2,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default BorderBeam;
