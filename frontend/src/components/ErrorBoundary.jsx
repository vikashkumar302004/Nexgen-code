import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#060810] text-white p-6 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/50">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-[#8b949e] max-w-md mb-8">
            The Codify interface encountered an unexpected error. This usually happens due to malformed API data or layout conflicts.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] rounded-lg font-semibold transition-all shadow-lg active:scale-95"
          >
            Reload Interface
          </button>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-8 p-4 bg-black/40 rounded-xl text-left text-xs text-red-400 overflow-auto max-w-2xl border border-white/5">
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
