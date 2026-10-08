import React, { Component } from "react";
import { AlertTriangle, Home, RefreshCw, ChevronDown } from "lucide-react";

/**
 * Global React Error Boundary for NV Cyclothon.
 * Catches uncaught runtime exceptions in component trees, prevents white-screen crashes,
 * and displays an accessible, mobile-friendly recovery interface.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log crash details in non-production or for telemetry
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          resetError: this.handleReset,
        });
      }

      return (
        <section
          role="region"
          aria-labelledby="crash-boundary-heading"
          className="flex min-h-[60vh] w-full flex-col items-center justify-center px-4 py-12 text-center sm:px-6"
        >
          <div className="w-full max-w-lg rounded-3xl border border-neutral-200/80 bg-white/90 p-6 shadow-xl backdrop-blur-md sm:p-10 dark:border-white/10 dark:bg-[#071313]/90">
            {/* Visual Icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ff5f3d]/15 text-[#ff5f3d]">
              <AlertTriangle className="h-8 w-8" aria-hidden="true" />
            </div>

            {/* Error Code Pill */}
            <div className="mt-5">
              <span className="inline-flex items-center rounded-full border border-[#ff5f3d]/30 bg-[#ff5f3d]/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#ff5f3d]">
                CODE: ERR_CLIENT_CRASH
              </span>
            </div>

            {/* Title & Friendly Description */}
            <h1
              id="crash-boundary-heading"
              className="mt-4 text-2xl font-black uppercase tracking-tight text-neutral-900 sm:text-3xl dark:text-white"
            >
              A Bump in the Road
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
              The page encountered an unexpected issue while rendering. Don't worry — your previous entries and event data are safe.
            </p>

            {/* Action Buttons (Mobile-Friendly touch targets >= 44px) */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#071313] px-5 py-3 text-xs font-black tracking-wider text-white uppercase transition hover:bg-[#ff5f3d] active:scale-95 dark:bg-[#d9ff38] dark:text-[#071313] dark:hover:bg-[#c2e62e]"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                <span>Reload Page</span>
              </button>

              <a
                href="/"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border-2 border-neutral-300 bg-transparent px-5 py-3 text-xs font-black tracking-wider text-neutral-800 uppercase transition hover:border-neutral-900 active:scale-95 dark:border-white/20 dark:text-white dark:hover:border-white"
              >
                <Home className="h-4 w-4" aria-hidden="true" />
                <span>Back to Home</span>
              </a>
            </div>

            {/* Collapsible Details for Debugging */}
            {this.state.error && (
              <details className="mt-6 text-left border-t border-neutral-200/80 pt-4 dark:border-white/10">
                <summary className="flex cursor-pointer items-center justify-between text-xs font-bold text-neutral-500 transition hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-white">
                  <span>Technical Diagnostic Info</span>
                  <ChevronDown className="h-4 w-4" />
                </summary>
                <pre className="mt-2 max-h-40 overflow-auto rounded-xl bg-neutral-900 p-3 text-[11px] font-mono leading-tight text-rose-300 dark:bg-black/80">
                  {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
                </pre>
              </details>
            )}
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}
