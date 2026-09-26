import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

// Catches otherwise-unhandled render errors (e.g. an API response missing a field
// some component assumes exists) so a single bad response can't blank the entire
// app with no recovery path. Must be a class component — React only supports
// error boundaries via getDerivedStateFromError/componentDidCatch, no hook exists.
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('Unhandled render error caught by ErrorBoundary:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-gray-50">
          <div className="p-4 bg-red-50 text-red-500 rounded-2xl mb-4">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-1">Something went wrong</h1>
          <p className="text-sm text-gray-400 font-medium max-w-sm mb-6">
            An unexpected error occurred. Please reload the page. If the problem
            continues, contact support.
          </p>
          <Button onClick={() => window.location.reload()} variant="primary">
            Reload Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
