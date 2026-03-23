import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-night-900 flex flex-col items-center justify-center px-6 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="font-display font-bold text-xl text-[#e8eaf6] mb-2">Something went wrong</h1>
          <p className="text-[#8890b8] text-sm mb-6 max-w-xs">
            An unexpected error occurred. Please refresh the page and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-brand-300 to-blue-500 text-night-900 font-bold rounded-xl text-sm"
          >
            Refresh Page
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="mt-6 text-left text-[10px] text-red-400 bg-night-800 p-4 rounded-xl overflow-auto max-w-full max-h-48">
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
