import React from "react";
import { AlertCircle, Clock, CreditCard, RefreshCw, ShieldAlert, X } from "lucide-react";

/**
 * Modern, accessible, mobile-friendly error notification banner.
 *
 * @param {Object} props
 * @param {Object} props.error - Normalized error object ({ code, title, message, retryable, actionText })
 * @param {Function} [props.onRetry] - Optional retry handler
 * @param {Function} [props.onDismiss] - Optional dismiss handler
 * @param {string} [props.className] - Additional styling
 */
export function ErrorAlert({ error, onRetry, onDismiss, showCode = false, className = "" }) {
  if (!error) return null;

  const code = error.code || "ERR_UNKNOWN";
  const title = error.title || "Action Could Not Be Completed";
  const message = error.userMessage || error.message || "An unexpected error occurred. Please try again.";
  const actionText = error.actionText || "Try Again";
  const canRetry = Boolean(onRetry) && error.retryable !== false;

  // Contextual icon selector
  const renderIcon = () => {
    if (code.includes("RATE")) {
      return <Clock className="h-5 w-5 shrink-0 text-amber-500" aria-hidden="true" />;
    }
    if (code.includes("PAYMENT")) {
      return <CreditCard className="h-5 w-5 shrink-0 text-rose-500" aria-hidden="true" />;
    }
    if (code.includes("VALIDATION") || code.includes("DUPLICATE")) {
      return <ShieldAlert className="h-5 w-5 shrink-0 text-orange-500" aria-hidden="true" />;
    }
    return <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" aria-hidden="true" />;
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`relative mt-4 w-full rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 text-left shadow-sm backdrop-blur-sm transition-all sm:p-5 dark:border-rose-400/20 dark:bg-rose-950/40 ${className}`}
    >
      <div className="flex items-start gap-3.5">
        <div className="mt-0.5">{renderIcon()}</div>

        <div className="min-w-0 flex-1">
          {/* Header row with Title and optional Error Code Badge */}
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-black tracking-tight text-neutral-900 dark:text-white uppercase">
              {title}
            </h4>
            {showCode && (
              <span
                className="inline-flex items-center rounded-md border border-rose-500/30 bg-rose-500/15 px-2 py-0.5 text-[10px] font-black tracking-wider text-rose-700 dark:text-rose-300 uppercase"
                aria-label={`Error code: ${code}`}
              >
                CODE: {code}
              </span>
            )}
          </div>

          {/* User-friendly sanitized explanation */}
          <p className="mt-1.5 text-xs leading-relaxed text-neutral-700 dark:text-neutral-200">
            {message}
          </p>

          {/* Actions row: mobile-friendly touch targets */}
          {canRetry && (
            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-black tracking-wider text-white transition hover:bg-neutral-800 active:scale-95 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{actionText}</span>
              </button>
            </div>
          )}
        </div>

        {/* Optional Dismiss Button */}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss error notification"
            className="rounded-lg p-1 text-neutral-500 transition hover:bg-rose-500/20 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
