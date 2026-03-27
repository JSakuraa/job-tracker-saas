// T178: Error boundaries for graceful error handling

'use client';

import { Component, type ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card style={{ maxWidth: '500px', margin: '2rem auto' }}>
          <CardContent style={{ textAlign: 'center', padding: '2rem' }}>
            <h2 style={{ marginBottom: '1rem', fontFamily: 'var(--font-pixel)' }}>
              SOMETHING WENT WRONG
            </h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
              An unexpected error occurred. Please try again.
            </p>
            <Button onClick={this.handleReset}>TRY AGAIN</Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Hook-based error handler for async errors
interface AsyncErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export function AsyncErrorFallback({ error, resetErrorBoundary }: AsyncErrorFallbackProps) {
  return (
    <Card style={{ maxWidth: '500px', margin: '2rem auto' }}>
      <CardContent style={{ textAlign: 'center', padding: '2rem' }}>
        <h2 style={{ marginBottom: '1rem', fontFamily: 'var(--font-pixel)' }}>
          FAILED TO LOAD
        </h2>
        <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
          {error.message}
        </p>
        <Button onClick={resetErrorBoundary}>RETRY</Button>
      </CardContent>
    </Card>
  );
}
