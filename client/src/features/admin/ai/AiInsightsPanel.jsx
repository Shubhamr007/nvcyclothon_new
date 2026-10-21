import React, { useState, useCallback, memo } from "react";
import { Sparkles, RefreshCw, Copy, Check, Lightbulb, TrendingUp, AlertTriangle } from "lucide-react";
import { adminAiAnalyticsSummary } from "../../../api/http";
import { useAppSelector } from "../../../store/hooks";
import { Button } from "../../../components/ui/button";

export const AiInsightsPanel = memo(function AiInsightsPanel() {
  const accessToken = useAppSelector((state) => state.auth?.accessToken);
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);

    try {
      const res = await adminAiAnalyticsSummary(accessToken);
      setSummaryData(res);
    } catch (err) {
      setError(err?.message || "Failed to generate executive insights. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const handleCopy = useCallback(() => {
    if (!summaryData) return;
    const text = [
      `NV CYCLOTHON 2026 — AI EXECUTIVE BRIEF`,
      `======================================`,
      `VERDICT: ${summaryData.headline}`,
      ``,
      `KEY HIGHLIGHTS:`,
      ...(summaryData.highlights || []).map((h) => `• ${h}`),
      ``,
      `RECOMMENDATIONS:`,
      ...(summaryData.recommendations || []).map((r) => `→ ${r}`),
    ].join("\n");

    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [summaryData]);

  return (
    <div className="rounded-2xl border border-blue-100 bg-linear-to-br from-[#deecf9]/30 via-white to-blue-50/20 p-5 shadow-xs transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-blue-100/70 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0078d4] text-white shadow-xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">AI Intelligence Brief</h3>
              <span className="rounded-md bg-[#deecf9] border border-[#c7e0f4] px-1.5 py-0.5 text-[10px] font-sans font-bold text-[#005a9e]">
                EXECUTIVE BRIEF
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Automated race operations insights powered by local telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {summaryData && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-8 text-xs border-slate-200 bg-white hover:bg-slate-50"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1 text-slate-500" />
                  <span>Copy Brief</span>
                </>
              )}
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={loading}
            className="h-8 text-xs font-semibold bg-[#0078d4] hover:bg-[#005a9e] text-white shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Synthesizing…" : summaryData ? "Regenerate" : "Generate Brief"}</span>
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-800">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {loading && !summaryData && (
        <div className="mt-4 flex flex-col items-center justify-center py-8 text-center">
          <div className="h-8 w-8 rounded-full border-2 border-[#0078d4] border-t-transparent animate-spin mb-2" />
          <p className="text-xs font-semibold text-slate-700">Synthesizing race telemetry…</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Evaluating category demand, capacity quotas, and payment velocity</p>
        </div>
      )}

      {!loading && !summaryData && !error && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-dashed border-blue-200/80 bg-white/60 px-4 py-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500 shrink-0" />
            <span>Click <strong>Generate Brief</strong> to analyze capacity quotas, route distribution, and revenue pace.</span>
          </div>
        </div>
      )}

      {summaryData && (
        <div className="mt-4 space-y-4">
          {/* Executive Headline */}
          <div className="rounded-xl border border-blue-200/70 bg-white p-3.5 shadow-2xs">
            <p className="text-[10px] font-bold tracking-wider uppercase text-[#0078d4] font-mono">
              EXECUTIVE VERDICT
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900 leading-snug">
              {summaryData.headline}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Highlights */}
            <div className="rounded-xl border border-slate-200/70 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                <span>Performance Highlights</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {(summaryData.highlights || []).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#0078d4] font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="rounded-xl border border-slate-200/70 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                <span>Committee Recommendations</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {(summaryData.recommendations || []).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">→</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default AiInsightsPanel;
