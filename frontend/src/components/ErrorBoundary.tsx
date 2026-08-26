import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** Where "Go to Home" navigates. Defaults to the app root. */
  resetTo?: string;
  /**
   * When any value in this array changes, a caught error clears itself
   * automatically. Used to scope a boundary to one dashboard tab: navigating
   * away from the tab that crashed and back (or to a different tab) should
   * not still show the old crash — pass the active tab name as the key.
   */
  resetKeys?: unknown[];
  /**
   * "page" (default) — full-bleed, for a boundary with nothing else on
   * screen (a whole portal/route).
   * "inline" — contained, for a boundary scoped to one region (a dashboard
   * tab, a section) where a full-height dark panel would blank out
   * navigation/chrome that is still working fine around it.
   */
  variant?: "page" | "inline";
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

  componentDidUpdate(prevProps: Props) {
    if (!this.state.error || !this.props.resetKeys) return;
    const changed = this.props.resetKeys.some((key, i) => key !== prevProps.resetKeys?.[i]);
    if (changed) this.setState({ error: null });
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

      const inline = this.props.variant === "inline";
      return (
        <div
          role="alert"
          style={{
            padding: inline ? 24 : 40,
            fontFamily: "'JetBrains Mono', monospace",
            background: inline ? "rgba(255,107,107,0.06)" : "#1a0008",
            color: "#ff6b6b",
            minHeight: inline ? undefined : "100dvh",
            borderRadius: inline ? 12 : undefined,
          }}
        >
          <h2 style={{ color: "#ff6b6b", marginBottom: 8, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: inline ? 16 : undefined }}>
            {inline ? "This section couldn't load" : "Render Error"}
          </h2>
          <p style={{ color: "rgba(255,107,107,0.7)", marginBottom: 24, fontSize: 13 }}>
            An unexpected error occurred. {inline ? "Try again, or switch tabs." : "Please reload or return to the home screen."}
          </p>
          {!inline && (
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
          )}
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
            {!inline && (
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
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
