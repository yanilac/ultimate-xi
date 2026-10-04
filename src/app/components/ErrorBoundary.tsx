import { Component, type ReactNode } from "react";

/** Show what went wrong instead of a blank page if a screen crashes. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <main className="screen home">
        <h2>Something went wrong</h2>
        <p className="hint">The game hit an error. Starting over usually fixes it.</p>
        <pre className="crash">{`${error.name}: ${error.message}\n${navigator.userAgent}\n\n${error.stack ?? ""}`}</pre>
        <button
          className="btn btn--primary"
          onClick={() => {
            history.replaceState(null, "", location.pathname);
            location.reload();
          }}
        >
          Start over
        </button>
      </main>
    );
  }
}
