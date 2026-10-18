import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "../../../components/ui/button";

export class TabErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Tab render error caught by TabErrorBoundary:", error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.tabKey !== this.props.tabKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-rose-200 bg-white p-8 shadow-sm text-center max-w-lg mx-auto my-12 space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-8 ring-rose-50/50">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Something went wrong loading this section
            </h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              {this.state.error?.message || "An unexpected error occurred while rendering this tab."}
            </p>
          </div>
          <div className="pt-2">
            <Button
              type="button"
              onClick={this.handleRetry}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-xl inline-flex items-center gap-2 shadow-sm"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry Tab</span>
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default TabErrorBoundary;
