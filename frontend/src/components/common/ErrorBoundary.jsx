import React from "react";
import { Line } from "react-chartjs-2";

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
      this.state.hasError = false;
      return (
        <div className="relative">
          <Line
            data={{ datasets: [] }}
            options={{
              responsive: true,
              scales: {
                x: { grid: { color: "#e5e5e5" } },
                y: { grid: { color: "#e5e5e5" } },
              },
              plugins: {
                legend: { display: false },
              },
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white dark:bg-gray-900 p-2 rounded shadow text-red-600">
              Check parameters
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
