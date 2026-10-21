import React, { useMemo } from "react";
import { X, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, Copy, Check } from "lucide-react";

export function FinanceAiAuditModal({ open, onClose, summary }) {
  const [copied, setCopied] = React.useState(false);

  const audit = useMemo(() => {
    const gross = summary.grossExpenses || 1;
    const prizeRatio = Math.round(((summary.categoryExpenses.prizes || 0) / gross) * 100);
    const safetyRatio = Math.round((((summary.categoryExpenses.routes || 0) + 20000) / gross) * 100);
    const logisticsRatio = Math.round(((summary.categoryExpenses.logistics || 0) / gross) * 100);
    const contingencyRatio = Math.round((((summary.categoryExpenses.operations || 0) * 0.4) / gross) * 100);

    const findings = [
      {
        title: "Prize Pool Allocation",
        status: prizeRatio <= 20 ? "pass" : "warn",
        metric: `${prizeRatio}% of total budget`,
        verdict:
          prizeRatio <= 20
            ? "Well-calibrated prize pool. Sufficient to attract elite riders without creating financial over-leverage."
            : "High prize allocation relative to operating budget. Ensure title sponsor funds are locked before announcing.",
      },
      {
        title: "Route Safety & Medical Coverage",
        status: safetyRatio >= 14 ? "pass" : "warn",
        metric: `${safetyRatio}% allocated to police & medical`,
        verdict:
          safetyRatio >= 14
            ? "Solid safety provisioning. Traffic police permissions and ambulance standby are properly funded."
            : "Route safety budget is somewhat lean for a 60km open highway course. Consider adding 1 extra trailing pilot vehicle.",
      },
      {
        title: "Rider Kit Unit Economics",
        status: "pass",
        metric: `₹460 kit cost vs ₹${summary.avgTicket} avg fee`,
        verdict: `Strong unit contribution margin (+₹${Math.max(100, summary.avgTicket - 460)}/rider). Every ticket sold directly expands net event liquidity.`,
      },
      {
        title: "Sponsorship Fixed Cost Coverage",
        status: summary.sponsorRevenue >= 450000 ? "pass" : "warn",
        metric: `₹${summary.sponsorRevenue.toLocaleString("en-IN")} secured`,
        verdict:
          summary.sponsorRevenue >= 450000
            ? "Sponsorships successfully insulate the event from weather or turnout risk by covering fixed infrastructure costs."
            : "Sponsorship coverage is below the recommended ₹5,00,000 threshold. Aim to confirm the associate hydration partner.",
      },
    ];

    const actionItems = [
      "Maintain a 5% contingency buffer specifically for race-day weather or route diversion permits.",
      "Finalize jersey vendor cutoff 18 days before the race to avoid rush air-freight surcharges.",
      "Bundle corporate delegation packages with logo placement on volunteer lanyards to boost B2B revenue.",
    ];

    return { findings, actionItems };
  }, [summary]);

  if (!open) return null;

  const handleCopy = () => {
    const text =
      `NV CYCLOTHON 2026 - FINANCIAL HEALTH AUDIT\n\n` +
      `• Gross Inflows: ₹${summary.grossRevenue.toLocaleString("en-IN")}\n` +
      `• Gross Outflows: ₹${summary.grossExpenses.toLocaleString("en-IN")}\n` +
      `• Net Surplus: ₹${summary.netProfit.toLocaleString("en-IN")} (${summary.profitMargin}% margin)\n` +
      `• Break-Even Turnout: ${summary.breakEvenRiders} riders\n\n` +
      `Key Takeaways:\n` +
      audit.findings.map((f) => `- ${f.title} (${f.metric}): ${f.verdict}`).join("\n");

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#F4F6F8] px-6 py-4 text-slate-900">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-[#0078d4]" />
            <div>
              <h3 className="font-bold text-sm sm:text-base">AI Budget Health Check & Risk Radar</h3>
              <p className="text-xs text-slate-500 font-medium">Heuristic audit of expense ratios, safety margins, and cashflow liquidity.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition p-1"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-5">
          {/* FINDINGS LIST */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              Operational Ratios Evaluation
            </h4>
            {audit.findings.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 flex items-center gap-2">
                    {item.status === "pass" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    )}
                    {item.title}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded">
                    {item.metric}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed pl-6">
                  {item.verdict}
                </p>
              </div>
            ))}
          </div>

          {/* ACTION RECOMMENDATIONS */}
          <div className="rounded-xl border border-blue-200 bg-[#deecf9]/40 p-4 space-y-2">
            <h4 className="text-xs font-bold text-[#005a9e] flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#0078d4]" />
              AI Recommendations for Race Director:
            </h4>
            <ul className="space-y-1.5 text-xs text-[#004578] font-medium">
              {audit.actionItems.map((act, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="font-bold text-[#0078d4] shrink-0">•</span>
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-[#FAF9F6] px-6 py-3.5">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 transition"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? "Copied Audit!" : "Copy Executive Summary"}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#0078d4] hover:bg-[#005a9e] px-5 py-2 text-xs font-bold text-white transition shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
