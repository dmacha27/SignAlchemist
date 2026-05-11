import React from "react";

/**
 * ErrorBoundary component to catch and handle rendering errors in its child components
 *
 * Wrap this component around any components that may throw rendering errors
 * to prevent the entire app from crashing.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Chart render error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[220px] items-center justify-center rounded-[1rem] border border-rose-200 bg-rose-50/80 p-4 text-center shadow-sm dark:border-rose-900/70 dark:bg-rose-950/30">
          <div className="rounded-xl bg-white/80 px-4 py-3 text-sm font-medium text-rose-700 dark:bg-slate-950/60 dark:text-rose-200">
            Check parameters
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
