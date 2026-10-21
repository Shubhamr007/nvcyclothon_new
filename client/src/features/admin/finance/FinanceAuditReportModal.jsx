import React, { useState } from "react";
import { X, Download, Printer, Copy, Check, FileText, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

export function FinanceAuditReportModal({ open, onClose, summary, onDownloadExcel, downloadingExcel }) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const isSurplus = summary.netProfit >= 0;
  const todayStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleCopy = () => {
    const categories = summary.expense_categories || summary.expenseCategories || [];
    const expLines = categories.length > 0
      ? categories.map((c) => `- ${c.title}: ₹${(summary.categoryExpenses?.[c.id] ?? (c.items || []).reduce((s, it) => s + (Number(it.amount) || 0), 0)).toLocaleString("en-IN")}`).join("\n")
      : `- Total Event Disbursements: ₹${summary.grossExpenses.toLocaleString("en-IN")}`;

    const text =
      `REWA DISTRICT CYCLING ASSOCIATION (RDCA)\n` +
      `3RD EDITION NV CYCLOTHON 2026 — CA & BOARD AUDIT STATEMENT\n` +
      `Ref: RDCA/NVC-2026/FIN-AUDIT-01 | Date: ${todayStr}\n\n` +
      `SCHEDULE A: REALIZED GROSS RECEIPTS\n` +
      `- Participant Ticket Registrations (${summary.paidCount || 0} Paid): ₹${(summary.regRevenue || 0).toLocaleString("en-IN")}\n` +
      `- Corporate & Club Delegations: ₹${(summary.delegationRevenue || 0).toLocaleString("en-IN")}\n` +
      `- Confirmed Brand Partnerships & Sponsors: ₹${(summary.sponsorRevenue || 0).toLocaleString("en-IN")}\n` +
      `- Expo & Vendor Booth Registrations: ₹${(summary.vendorRevenue || 0).toLocaleString("en-IN")}\n` +
      `TOTAL REALIZED GROSS INFLOWS (A): ₹${summary.grossRevenue.toLocaleString("en-IN")}\n` +
      (summary.pipelineCommercialRevenue > 0
        ? `* Note: ₹${summary.pipelineCommercialRevenue.toLocaleString("en-IN")} in tentative commercial pledges excluded from realized receipts.\n\n`
        : `\n`) +
      `SCHEDULE B: EXPENDITURES\n` +
      expLines +
      `\nTOTAL GROSS DISBURSEMENTS (B): ₹${summary.grossExpenses.toLocaleString("en-IN")}\n\n` +
      `NET OPERATING ${isSurplus ? "SURPLUS" : "DEFICIT"}: ₹${summary.netProfit.toLocaleString("en-IN")} (${summary.profitMargin}% Margin)\n` +
      `Break-even Rider Turnout: ${summary.breakEvenRiders} Riders`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto print:p-0 print:bg-white">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-300 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 print:border-none print:shadow-none print:rounded-none">
        
        {/* MODAL TOP TOOLBAR (Hidden in Print) */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#F4F6F8] px-6 py-4 text-slate-900 print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">CA & Board Financial Audit Statement</h3>
              <p className="text-xs text-slate-500 font-medium">Statutory Income & Expenditure Ledger for Chartered Accountants and RDCA Board</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onDownloadExcel}
              disabled={downloadingExcel}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 shadow-2xs transition disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>{downloadingExcel ? "Generating .xlsx…" : "Download CA Excel"}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-3.5 py-2 shadow-2xs transition"
            >
              <Printer className="h-4 w-4" />
              <span>Print / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 transition ml-2"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE AUDIT STATEMENT DOCUMENT */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-900 max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible print:text-black">
          
          {/* 1. OFFICIAL LETTERHEAD HEADER */}
          <div className="text-center border-b-2 border-slate-800 pb-5">
            <span className="text-xs font-bold tracking-widest text-emerald-700 uppercase font-mono">
              AFFILIATED WITH CYCLING FEDERATION OF INDIA & MP OLYMPIC ASSOCIATION
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 mt-1">
              REWA DISTRICT CYCLING ASSOCIATION (RDCA)
            </h1>
            <p className="text-xs font-bold text-slate-800 mt-0.5">
              NV CYCLOTHON 2026 — 3RD EDITION AUDITED STATEMENT OF INCOME & EXPENDITURE
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 font-mono border-t border-slate-200 pt-2.5">
              <span><strong>Audit Reference:</strong> RDCA/NVC-2026/FIN-AUDIT-01</span>
              <span><strong>Event Date:</strong> 1st March 2026</span>
              <span><strong>Ledger Date:</strong> {todayStr}</span>
              <span><strong>Accounting Currency:</strong> INR (₹)</span>
            </div>
          </div>

          {/* 2. DUAL SCHEDULES: INCOME & EXPENDITURE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* SCHEDULE A: RECEIPTS / INFLOWS */}
            <div className="rounded-xl border border-slate-300 overflow-hidden shadow-2xs bg-white">
              <div className="bg-slate-100 border-b border-slate-200 text-slate-900 px-4 py-2.5 text-xs font-bold font-mono uppercase tracking-wide flex justify-between">
                <span>SCHEDULE A: REALIZED RECEIPTS</span>
                <span>AMOUNT (₹)</span>
              </div>
              <div className="p-4 divide-y divide-slate-200 text-xs">
                <div className="py-2 flex justify-between">
                  <span className="text-slate-700 font-medium">1. Rider Registrations ({summary.paidCount || 0} Paid)</span>
                  <span className="font-mono font-bold text-slate-950">₹{(summary.regRevenue || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-700 font-medium">2. Corporate & Institutional Delegations</span>
                  <span className="font-mono font-bold text-slate-950">₹{(summary.delegationRevenue || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-700 font-medium">3. Brand Partnerships (Confirmed)</span>
                  <span className="font-mono font-bold text-slate-950">₹{(summary.sponsorRevenue || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-700 font-medium">4. Expo Arena & Food Stall Vendor Space</span>
                  <span className="font-mono font-bold text-slate-950">₹{(summary.vendorRevenue || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>
              {summary.pipelineCommercialRevenue > 0 && (
                <div className="bg-amber-50 border-t border-amber-200 px-4 py-1.5 text-[11px] text-amber-900 font-medium">
                  * Note: Excludes ₹{summary.pipelineCommercialRevenue.toLocaleString("en-IN")} in tentative commercial pipeline.
                </div>
              )}
              <div className="bg-emerald-50 border-t-2 border-emerald-400 px-4 py-3 flex justify-between text-xs font-black text-emerald-950 font-mono">
                <span>TOTAL GROSS INFLOWS (A)</span>
                <span>₹{summary.grossRevenue.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* SCHEDULE B: OPERATIONAL DISBURSEMENTS */}
            <div className="rounded-xl border border-slate-300 overflow-hidden shadow-2xs bg-white">
              <div className="bg-slate-100 border-b border-slate-200 text-slate-900 px-4 py-2.5 text-xs font-bold font-mono uppercase tracking-wide flex justify-between">
                <span>SCHEDULE B: EXPENDITURES</span>
                <span>AMOUNT (₹)</span>
              </div>
              <div className="p-4 divide-y divide-slate-200 text-xs">
                {(summary.expense_categories || summary.expenseCategories || []).length === 0 ? (
                  <div className="py-3 text-center text-slate-500 font-medium">No itemized expense categories registered.</div>
                ) : (
                  (summary.expense_categories || summary.expenseCategories || []).map((cat) => {
                    const amt = summary.categoryExpenses?.[cat.id] ?? (cat.items || []).reduce((s, it) => s + (Number(it.amount) || 0), 0);
                    return (
                      <div key={cat.id} className="py-2 flex justify-between">
                        <span className="text-slate-700 font-medium">{cat.title}</span>
                        <span className="font-mono font-bold text-slate-950">₹{amt.toLocaleString("en-IN")}</span>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="bg-slate-100 border-t-2 border-slate-300 px-4 py-3 flex justify-between text-xs font-black text-slate-950 font-mono">
                <span>TOTAL DISBURSEMENTS (B)</span>
                <span>₹{summary.grossExpenses.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* 3. NET OPERATING SURPLUS / DEFICIT SUMMARY BAR */}
          <div className={`rounded-xl border-2 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs ${
            isSurplus
              ? "border-emerald-500 bg-emerald-50 text-emerald-950"
              : "border-rose-500 bg-rose-50 text-rose-950"
          }`}>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider font-mono text-slate-700">
                AUDITED NET EVENT FINANCIAL POSITION
              </span>
              <p className="text-sm font-bold text-slate-950 mt-1">
                {isSurplus
                  ? "Net Surplus retained for RDCA Youth Cycling Development Reserve"
                  : "Net Operating Deficit — Requires Sponsor / Grant Bridge Allocation"}
              </p>
            </div>
            <div className="text-left sm:text-right font-mono">
              <div className={`text-2xl font-black ${isSurplus ? "text-emerald-700" : "text-rose-700"}`}>
                {isSurplus ? "+" : ""}₹{summary.netProfit.toLocaleString("en-IN")}
              </div>
              <span className="text-xs font-bold text-slate-600">
                Operating Margin: {summary.profitMargin}%
              </span>
            </div>
          </div>

          {/* 4. STATUTORY NOTES TO ACCOUNTS */}
          <div className="rounded-xl border border-slate-200 bg-[#faf9f6] p-4 space-y-2 text-xs text-slate-700">
            <h4 className="font-bold text-slate-950 uppercase font-mono text-xs tracking-wide flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#0078d4]" />
              Statutory Notes & Compliance Disclosures:
            </h4>
            <p className="leading-relaxed">1. <strong>TDS Compliance:</strong> Cash prize payouts exceeding statutory limits comply with Section 194B; contractor payments are processed per Section 194C of the Income Tax Act.</p>
            <p className="leading-relaxed">2. <strong>Bank Escrow Reconciliation:</strong> All rider ticket sales reconcile directly with the payment gateway merchant settlement account.</p>
            <p className="leading-relaxed">3. <strong>Voucher Verification:</strong> All disbursements are backed by signed procurement vouchers, police fee challans, and vendor GST invoices.</p>
          </div>

          {/* 5. VERIFICATION & SIGNOFF BLOCK */}
          <div className="pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-600 font-mono uppercase tracking-wider font-bold text-center mb-6">
              Certified True & Fair Representation for RDCA Executive Committee & Statutory Audit
            </p>
            <div className="grid grid-cols-3 gap-6 text-center text-xs">
              <div className="space-y-1">
                <div className="h-10 border-b-2 border-dashed border-slate-300 mx-4" />
                <p className="font-bold text-slate-950 mt-2">Honorary Treasurer</p>
                <p className="text-xs text-slate-600 font-medium">Rewa District Cycling Association</p>
              </div>
              <div className="space-y-1">
                <div className="h-10 border-b-2 border-dashed border-slate-300 mx-4" />
                <p className="font-bold text-slate-950 mt-2">Race Director & President</p>
                <p className="text-xs text-slate-600 font-medium">NV Cyclothon Organizing Council</p>
              </div>
              <div className="space-y-1">
                <div className="h-10 border-b-2 border-dashed border-slate-300 mx-4" />
                <p className="font-bold text-slate-950 mt-2">Chartered Accountant</p>
                <p className="text-xs text-slate-600 font-medium">Statutory Auditor (Firm Reg. & UDIN)</p>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL BOTTOM ACTION BAR (Hidden in Print) */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-[#FAF9F6] px-6 py-4 print:hidden">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 transition"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? "Statement Copied to Clipboard!" : "Copy Text Statement"}</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[#0078d4] hover:bg-[#005a9e] px-6 py-2 text-xs font-bold text-white transition shadow-sm"
            >
              Done & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
