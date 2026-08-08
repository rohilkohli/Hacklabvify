// src/components/layout/ErrorBoundary.jsx
// Production-grade error boundary component using react-error-boundary.

import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { Logger } from '../../services/LoggerService.js';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', padding: '24px', background: 'var(--bg-primary, #1D1C19)',
      color: 'var(--text-primary, #F0EBE1)', textAlign: 'center', fontFamily: 'sans-serif'
    }}>
      <h2 style={{ fontSize: '24px', marginBottom: '12px', color: 'var(--accent-red, #E25B57)' }}>
        Something went wrong
      </h2>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary, #ADA79B)', maxWidth: '480px', marginBottom: '20px' }}>
        An unexpected error occurred in FounderNexus. Details have been logged.
      </p>
      <pre style={{
        background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-default, rgba(255,255,255,0.1))',
        borderRadius: '8px', padding: '12px 16px', fontSize: '12px', color: 'var(--accent-amber, #E08A34)',
        maxWidth: '600px', overflowX: 'auto', marginBottom: '24px', textOverflow: 'ellipsis'
      }}>
        {error?.message || 'Unknown error'}
      </pre>
      <button
        onClick={resetErrorBoundary}
        style={{
          background: 'var(--accent, #D97753)', border: 'none', color: '#FFF',
          padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer'
        }}
      >
        Try Again
      </button>
    </div>
  );
}

export function ErrorBoundary({ children }) {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => {
        Logger.error('Unhandled UI Exception caught by ErrorBoundary', { error, componentStack: info?.componentStack }, 'ErrorBoundary');
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}
