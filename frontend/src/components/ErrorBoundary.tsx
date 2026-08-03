import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** Where "Go to Home" navigates. Defaults to the app root. */
  resetTo?: string;
}

interface State {
  error: Error | null;
}

/**
 * Error boundary — catches render errors and shows a readable fallback.
 * Mount one per portal layout (scoped to that portal's <Outlet />) so a
 * crash in one tab doesn't blank the whole app, plus one global instance
 * around the router as a last-resort catch-all.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  handleReset = () => {
    this.setState({ error: null });
    window.location.href = this.props.resetTo ?? "/";
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          style={{
            padding: 40,
            fontFamily: "'JetBrains Mono', monospace",
            background: "#1a0008",
            color: "#ff6b6b",
            minHeight: "100vh",
          }}
        >
          <h2 style={{ color: "#ff6b6b", marginBottom: 8, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Render Error
          </h2>
          <p style={{ color: "rgba(255,107,107,0.7)", marginBottom: 24, fontSize: 13 }}>
            An unexpected error occurred. Please reload or return to the home screen.
          </p>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              fontSize: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,107,107,0.15)",
              borderRadius: 8,
              padding: 16,
              marginBottom: 24,
            }}
          >
            {this.state.error.message}
            {"\n\n"}
            {this.state.error.stack}
          </pre>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={this.handleRetry}
              style={{
                background: "transparent",
                color: "#ff6b6b",
                border: "1px solid rgba(255,107,107,0.4)",
                borderRadius: 8,
                padding: "10px 24px",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
            <button
              onClick={this.handleReset}
              style={{
                background: "#6E0F2D",
                color: "#FFF",
                border: "none",
                borderRadius: 8,
                padding: "10px 24px",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Go to Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
