import React from "react";
import { ShieldCheck, FileCheck, Landmark, Award, Sparkles } from "lucide-react";

export function FinanceTrustBar({ onTriggerAiPrompt }) {
  const TRUST_ACTIONS = [
    {
      id: "sponsor-uc",
      label: "Sponsor Fund Utilization (UC)",
      icon: FileCheck,
      prompt:
        "Draft an official Sponsor Fund Utilization Certificate (UC) for our Title and Associate Sponsors, detailing verified line-item allocations to highway safety ambulances, hydration stations, and RFID timing kits.",
    },
    {
      id: "tds-escrow",
      label: "Prize Money & TDS (Sec 194B)",
      icon: Award,
      prompt:
        "Draft a formal Prize Pool Escrow & TDS Compliance Statement under Section 194B of the Income Tax Act, confirming guaranteed prize money disbursement for 60km and 30km podium winners.",
    },
    {
      id: "non-profit-disclosure",
      label: "Non-Profit Transparency Memo",
      icon: Landmark,
      prompt:
        "Draft a formal Public Accountability and Non-Profit Disclosure Statement for the RDCA Executive Committee, certifying that 100% of surplus funds are retained in the Youth Cycling Development Reserve.",
    },
  ];

  return (
    <div className="rounded-2xl border border-indigo-900/60 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-4 sm:p-5 text-white shadow-md">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <h3 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
              Event Financial Governance & Trust Center
              <span className="rounded-md bg-indigo-500/20 border border-indigo-400/40 px-2 py-0.5 text-xs font-bold text-indigo-200">
                Statutory Verified
              </span>
            </h3>
          </div>
          <p className="text-xs font-medium text-slate-300 leading-relaxed max-w-2xl">
            Build unshakeable credibility with sponsors, statutory auditors, and riders by generating auditable compliance notes, tax certificates, and utilization statements.
          </p>
        </div>

        {/* 3 ONE-CLICK AI TRUST PROMPTS (JEWEL-TONE EXECUTIVE BUTTONS) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {TRUST_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => onTriggerAiPrompt?.(action.prompt)}
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-700/60 bg-indigo-950/60 hover:bg-indigo-900/70 hover:border-indigo-400/80 px-3.5 py-2 text-xs font-bold text-white transition shadow-xs hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-indigo-400 focus-visible:outline-offset-2"
                aria-label={`Generate ${action.label}`}
              >
                <Icon className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{action.label}</span>
                <Sparkles className="h-3.5 w-3.5 text-indigo-300 shrink-0 ml-0.5" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
