import React, { useState, useCallback, memo } from "react";
import { Sparkles, Check, X, HelpCircle, Loader2 } from "lucide-react";
import { adminAiModeratePost } from "../../../api/http";

export const AiModerationBadge = memo(function AiModerationBadge({
  item,
  accessToken,
  onAutoApply,
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleScan = useCallback(async () => {
    if (!accessToken || !item?.message) return;
    setLoading(true);
    try {
      const res = await adminAiModeratePost(accessToken, {
        id: item.id,
        message: item.message,
        name: item.name,
        bib_number: item.bib_number,
      });
      setResult(res);
    } catch {
      setResult({
        status: "pending",
        reason: "Automated analysis unavailable.",
        confidence: 0.5,
      });
    } finally {
      setLoading(false);
    }
  }, [accessToken, item]);

  if (!result) {
    return (
      <button
        type="button"
        onClick={handleScan}
        disabled={loading}
        title="Analyze message with AI assistant"
        className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50/70 px-2 py-0.5 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs"
      >
        {loading ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin text-indigo-600" />
            <span>Scanning…</span>
          </>
        ) : (
          <>
            <Sparkles className="h-3 w-3 text-indigo-600" />
            <span>AI Check</span>
          </>
        )}
      </button>
    );
  }

  const isApprove = result.status === "approved";
  const isReject = result.status === "rejected";

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-semibold border ${
        isApprove
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : isReject
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : "border-amber-200 bg-amber-50 text-amber-800"
      }`}
      title={result.reason || "Local AI Evaluation"}
    >
      <Sparkles className="h-3 w-3 shrink-0" />
      <span>
        AI: {isApprove ? "Recommend Approve" : isReject ? "Recommend Reject" : "Needs Review"}
      </span>
      {typeof result.confidence === "number" && (
        <span className="opacity-75 font-mono">({Math.round(result.confidence * 100)}%)</span>
      )}
      {(isApprove || isReject) && onAutoApply && (
        <button
          type="button"
          onClick={() => onAutoApply(result.status)}
          className="ml-1 underline font-bold hover:opacity-80"
          title={`Click to accept AI recommendation (${result.status})`}
        >
          Apply
        </button>
      )}
    </div>
  );
});

export default AiModerationBadge;
