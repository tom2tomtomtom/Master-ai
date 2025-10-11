'use client'

import React from 'react';
import { appLogger } from '@/lib/logger';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log with structured logging
    appLogger.errors.clientError('react-error-boundary', error, {
      componentStack: errorInfo.componentStack,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined
    });

    this.setState({
      error,
      errorInfo
    });

    // Log to window for easier debugging in development
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      (window as any).lastError = {
        error,
        errorInfo,
        timestamp: new Date().toISOString()
      };
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div style={{ padding: '20px', border: '1px solid red', margin: '20px' }}>
            <h2>🚨 Application Error Caught</h2>
            <p><strong>Error:</strong> {this.state.error?.message}</p>
            <p><strong>Stack:</strong></p>
            <pre style={{ fontSize: '12px', overflow: 'auto' }}>
              {this.state.error?.stack}
            </pre>
            <p><strong>Component Stack:</strong></p>
            <pre style={{ fontSize: '12px', overflow: 'auto' }}>
              {this.state.errorInfo?.componentStack}
            </pre>
            <button 
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              style={{ marginTop: '10px', padding: '5px 10px' }}
            >
              Try Again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;