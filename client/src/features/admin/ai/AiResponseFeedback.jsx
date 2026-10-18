import React, { useState, memo } from "react";
import { ThumbsUp, ThumbsDown, Check, X, AlertCircle, RefreshCw } from "lucide-react";
import { adminAiFeedback } from "../../../api/http";

const NEGATIVE_REASONS = [
  "Incorrect or factually inaccurate",
  "Irrelevant to my question",
  "Incomplete answer",
  "Difficult to understand",
  "Outdated information",
  "Other",
];

/**
 * AiResponseFeedback Component.
 * Enables user feedback (thumbs up / down with categorized negative feedback panel)
 * on individual AI assistant responses with persistent server synchronization.
 */
export const AiResponseFeedback = memo(function AiResponseFeedback({
  messageId,
  conversationId,
  accessToken,
}) {
  const [rating, setRating] = useState(null); // 'positive' | 'negative' | null
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [selectedReason, setSelectedReason] = useState(NEGATIVE_REASONS[0]);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [feedbackError, setFeedbackError] = useState(null);

  const handlePositiveClick = async () => {
    if (submitting || !accessToken) return;
    setSubmitting(true);
    setFeedbackError(null);
    setShowDetailPanel(false);

    try {
      await adminAiFeedback(accessToken, {
        rating: "positive",
        message_id: messageId,
        conversation_id: conversationId,
      });
      setRating("positive");
      setSubmitted(true);
    } catch (err) {
      setFeedbackError("Failed to save feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNegativeClick = () => {
    setRating("negative");
    setShowDetailPanel(true);
    setFeedbackError(null);
  };

  const handleNegativeSubmit = async (e) => {
    e?.preventDefault();
    if (submitting || !accessToken) return;
    setSubmitting(true);
    setFeedbackError(null);

    try {
      await adminAiFeedback(accessToken, {
        rating: "negative",
        reason: selectedReason,
        comments: comments.trim() || null,
        message_id: messageId,
        conversation_id: conversationId,
      });
      setSubmitted(true);
      setShowDetailPanel(false);
    } catch (err) {
      setFeedbackError("Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative mt-2">
      {/* THUMBS ACTION BUTTONS */}
      <div className="flex items-center gap-1 text-[11px]" role="group" aria-label="Rate response">
        <button
          type="button"
          onClick={handlePositiveClick}
          disabled={submitting}
          aria-label="Good response — thumbs up"
          aria-pressed={rating === "positive"}
          className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs transition ${
            rating === "positive"
              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-300 dark:border-emerald-800"
              : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          } disabled:opacity-50`}
          title="Helpful response"
        >
          <ThumbsUp className={`h-3 w-3 ${rating === "positive" ? "fill-current" : ""}`} />
        </button>

        <button
          type="button"
          onClick={handleNegativeClick}
          disabled={submitting}
          aria-label="Bad response — thumbs down"
          aria-pressed={rating === "negative"}
          className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs transition ${
            rating === "negative"
              ? "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 font-bold border border-rose-300 dark:border-rose-800"
              : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          } disabled:opacity-50`}
          title="Unhelpful or inaccurate response"
        >
          <ThumbsDown className={`h-3 w-3 ${rating === "negative" ? "fill-current" : ""}`} />
        </button>

        {submitted && !showDetailPanel && (
          <span className="ml-1 inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold animate-in fade-in duration-200">
            <Check className="h-3 w-3" />
            <span>Feedback saved</span>
          </span>
        )}
      </div>

      {/* COMPACT DETAILED FEEDBACK PANEL */}
      {showDetailPanel && (
        <form
          onSubmit={handleNegativeSubmit}
          className="mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-md animate-in fade-in zoom-in-95 duration-150 space-y-2.5 z-10"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-100">
            <span>Help us improve this answer</span>
            <button
              type="button"
              onClick={() => setShowDetailPanel(false)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5"
              aria-label="Close feedback panel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* REASON PILLS */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              What was the issue?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {NEGATIVE_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setSelectedReason(reason)}
                  className={`rounded-lg px-2 py-1 text-left text-[11px] font-medium border transition ${
                    selectedReason === reason
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 font-bold"
                      : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>

          {/* OPTIONAL COMMENTS */}
          <div>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Provide more details to help fix this issue (optional)…"
              rows={2}
              maxLength={1000}
              className="w-full resize-none rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 p-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {feedbackError && (
            <div className="flex items-center gap-1.5 text-[11px] text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-3 w-3 shrink-0" />
              <span>{feedbackError}</span>
            </div>
          )}

          {/* FOOTER ACTIONS */}
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowDetailPanel(false)}
              className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-2xs"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Submitting…</span>
                </>
              ) : (
                <span>Submit Feedback</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
});
