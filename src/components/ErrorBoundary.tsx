'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            maxWidth: 500,
            margin: '4rem auto',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚧</div>
          <h2 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>
            Something went wrong
          </h2>
          <p
            style={{
              color: 'var(--text-secondary)',
              marginBottom: '1.5rem',
              fontSize: '0.9rem',
            }}
          >
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              padding: '0.6rem 1.5rem',
              borderRadius: '10px',
              background: 'var(--accent-primary)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
