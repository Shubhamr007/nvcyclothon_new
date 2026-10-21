import React from 'react';
import PropTypes from 'prop-types';
import { AlertCircle, RefreshCw, MessageSquarePlus } from 'lucide-react';

export class AiAssistantErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[AiAssistantErrorBoundary] Uncaught rendering exception:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleStartNew = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onStartNew) {
      this.props.onStartNew();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center bg-red-950/20 border border-red-800/30 rounded-xl m-4">
          <div className="w-12 h-12 rounded-full bg-red-900/30 flex items-center justify-center text-red-400 mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-red-200 mb-1">
            Assistant Interface Error
          </h3>
          <p className="text-xs text-red-300/80 mb-4 max-w-sm">
            Something unexpected occurred while rendering the conversation. Your message history is safe.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-800/40 text-red-200 hover:bg-red-800/60 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try again
            </button>
            <button
              type="button"
              onClick={this.handleStartNew}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              New Conversation
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

AiAssistantErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  onReset: PropTypes.func,
  onStartNew: PropTypes.func,
};

