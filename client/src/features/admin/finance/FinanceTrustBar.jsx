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
    <div className="rounded-2xl border border-[#c7e0f4] bg-linear-to-r from-[#deecf9]/40 via-[#faf9f6] to-blue-50/50 p-4 sm:p-5 text-slate-900 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#deecf9] text-[#0078d4] border border-[#c7e0f4] font-bold">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <h3 className="text-base font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              Event Financial Governance & Trust Center
              <span className="rounded-md bg-[#deecf9] border border-[#c7e0f4] px-2 py-0.5 text-xs font-bold text-[#005a9e]">
                Statutory Verified
              </span>
            </h3>
          </div>
          <p className="text-xs font-medium text-slate-600 leading-relaxed max-w-2xl">
            Build unshakeable credibility with sponsors, statutory auditors, and riders by generating auditable compliance notes, tax certificates, and utilization statements.
          </p>
        </div>

        {/* 3 ONE-CLICK AI TRUST PROMPTS */}
        <div className="flex flex-wrap items-center gap-2.5">
          {TRUST_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => onTriggerAiPrompt?.(action.prompt)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-[#0078d4]/50 px-3.5 py-2 text-xs font-bold text-slate-800 transition shadow-xs hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[#0078d4] focus-visible:outline-offset-2"
                aria-label={`Generate ${action.label}`}
              >
                <Icon className="h-4 w-4 text-[#0078d4] shrink-0" />
                <span>{action.label}</span>
                <Sparkles className="h-3.5 w-3.5 text-[#0078d4] shrink-0 ml-0.5" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
