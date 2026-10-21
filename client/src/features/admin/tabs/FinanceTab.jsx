import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Save, Check, RefreshCw, AlertCircle } from "lucide-react";
import { adminRequest } from "../../../api/http";
import { useAppSelector } from "../../../store/hooks";
import {
  DEFAULT_SPONSORSHIPS,
  DEFAULT_VENDORS,
  DEFAULT_DELEGATIONS_REVENUE,
  DEFAULT_EXPENSE_CATEGORIES,
  computeFinancialSummary,
} from "../finance/financeUtils";
import { FinanceKpiHeader } from "../finance/FinanceKpiHeader";
import { FinanceRevenuePanel } from "../finance/FinanceRevenuePanel";
import { FinanceExpensePanel } from "../finance/FinanceExpensePanel";
import { FinanceSimulatorModal } from "../finance/FinanceSimulatorModal";
import { FinanceAiAuditModal } from "../finance/FinanceAiAuditModal";
import { FinanceAuditReportModal } from "../finance/FinanceAuditReportModal";
import { FinanceTrustBar } from "../finance/FinanceTrustBar";
import { DonutChart } from "../finance/charts/DonutChart";
import { SemiCircleGauge } from "../finance/charts/SemiCircleGauge";
import { DualBarChart } from "../finance/charts/DualBarChart";

export function FinanceTab({ riders: propRiders, onTriggerAiPrompt }) {
  const accessToken = useAppSelector((state) => state.auth?.accessToken);
  const [riders, setRiders] = useState(propRiders || []);
  const [sponsorships, setSponsorships] = useState(DEFAULT_SPONSORSHIPS);
  const [vendors, setVendors] = useState(DEFAULT_VENDORS);
  const [delegations, setDelegations] = useState(DEFAULT_DELEGATIONS_REVENUE);
  const [expenseCategories, setExpenseCategories] = useState(DEFAULT_EXPENSE_CATEGORIES);
  const [budgetRevision, setBudgetRevision] = useState(null);
  const [backendSummary, setBackendSummary] = useState(null);

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const isLoadedRef = useRef(false);
  const [feedback, setFeedback] = useState("");
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [aiAuditOpen, setAiAuditOpen] = useState(false);
  const [auditReportOpen, setAuditReportOpen] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  useEffect(() => {
    if (propRiders) setRiders(propRiders);
  }, [propRiders]);

  // Load consolidated backend data
  const loadFinanceData = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await adminRequest("/finance/summary", accessToken);
      if (data) {
        setBackendSummary(data);
        setBudgetRevision(data.updated_at || null);
        if (data.sponsorships?.length) setSponsorships(data.sponsorships);
        if (data.vendors?.length) setVendors(data.vendors);
        if (data.delegations?.length) setDelegations(data.delegations);
        if (data.expense_categories?.length) setExpenseCategories(data.expense_categories);
      }
    } catch {
      // Fallback gracefully to propRiders/local defaults
    } finally {
      setTimeout(() => {
        isLoadedRef.current = true;
      }, 100);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadFinanceData();
  }, [loadFinanceData]);

  // Debounced auto-save on CRUD changes
  useEffect(() => {
    if (!isLoadedRef.current || !accessToken) return;
    setSaveStatus("saving");
    const timer = setTimeout(async () => {
      try {
        const saved = await adminRequest("/finance/budget", accessToken, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sponsorships,
            vendors,
            delegations,
            expense_categories: expenseCategories,
            expected_updated_at: budgetRevision,
          }),
        });
        setBudgetRevision(saved.updated_at || null);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } catch {
        setSaveStatus("error");
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [sponsorships, vendors, delegations, expenseCategories, accessToken]);

  // Persist budget revisions to PostgreSQL/backend
  const handleSaveBudget = async () => {
    if (!accessToken) return;
    setSaving(true);
    setSaveStatus("saving");
    setFeedback("");
    try {
      const updated = await adminRequest("/finance/budget", accessToken, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sponsorships, vendors, delegations, expense_categories: expenseCategories, expected_updated_at: budgetRevision }),
      });
      setBudgetRevision(updated.updated_at || null);
      setSaveStatus("saved");
      setFeedback("Budget revisions saved successfully to database!");
      setTimeout(() => { setFeedback(""); setSaveStatus("idle"); }, 3500);
    } catch (err) {
      setSaveStatus("error");
      setFeedback(err.message || "Failed to save budget revisions");
    } finally {
      setSaving(false);
    }
  };

  // Download CA & Board Multi-Sheet Excel Report (.xlsx)
  const handleDownloadExcel = async () => {
    if (!accessToken) return;
    setDownloadingExcel(true);
    setFeedback("");
    try {
      const res = await fetch("/api/admin/finance/export-excel", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to export Excel report");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "NV_Cyclothon_2026_CA_Audit_Report.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      setFeedback("CA Excel Audit Workbook exported successfully!");
      setTimeout(() => setFeedback(""), 3500);
    } catch (err) {
      setFeedback(err.message || "Failed to download Excel report");
    } finally {
      setDownloadingExcel(false);
    }
  };

  const summary = useMemo(() => {
    return computeFinancialSummary({
      riders,
      sponsorships,
      vendors,
      delegations,
      expenseCategories,
      basePaidCount: backendSummary?.paidCount,
      baseRegRevenue: backendSummary?.regRevenue,
    });
  }, [riders, sponsorships, vendors, delegations, expenseCategories, backendSummary]);

  // Transform expense categories for Donut Chart
  const donutCategories = useMemo(() => {
    return expenseCategories.map((c) => ({
      id: c.id,
      title: c.title,
      amount: summary.categoryExpenses[c.id] || 0,
      color: c.color || "#3b82f6",
    }));
  }, [expenseCategories, summary.categoryExpenses]);

  return (
    <div className="space-y-6">
      {/* 1. TOP FINANCIAL KPI SUMMARY & ACTION BAR */}
      <FinanceKpiHeader
        summary={summary}
        onOpenSimulator={() => setSimulatorOpen(true)}
        onOpenAiAudit={() => setAiAuditOpen(true)}
        onOpenAuditReport={() => setAuditReportOpen(true)}
        onDownloadExcel={handleDownloadExcel}
        downloadingExcel={downloadingExcel}
      />

      {/* PERSISTENCE FEEDBACK BANNER */}
      {feedback && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{feedback}</span>
          </div>
          <button type="button" onClick={() => setFeedback("")} className="text-emerald-700 hover:text-emerald-900 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* 2. EVENT FINANCIAL GOVERNANCE & TRUST CENTER (ONE-CLICK AI) */}
      <FinanceTrustBar onTriggerAiPrompt={onTriggerAiPrompt} />

      {/* 3. VISUAL CHARTS & METERS GRID (100% RESPONSIVE SVG) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
        {/* Chart 1: Donut Chart - Operational Outflows */}
        <DonutChart
          categories={donutCategories}
          totalAmount={summary.grossExpenses}
          title="Operational Cost Slices"
        />

        {/* Chart 2: Speedometer Gauge - Break-Even Target */}
        <SemiCircleGauge
          value={summary.paidCount}
          target={summary.breakEvenRiders || 312}
          label="Break-Even Progress"
          subLabel={`${summary.paidCount} of ${summary.breakEvenRiders || 312} riders needed`}
          formatValue={(val) => `${Math.min(Math.round((val / (summary.breakEvenRiders || 1)) * 100), 100)}%`}
        />

        {/* Chart 3: Dual Bar Chart - Cash Inflow vs Outflow */}
        <DualBarChart
          inflowTotal={summary.grossRevenue}
          outflowTotal={summary.grossExpenses}
          comparisons={[
            { label: "Ticket Sales vs. Kits & Medals", leftVal: summary.regRevenue, rightVal: summary.categoryExpenses.logistics || 200000 },
            { label: "Sponsors vs. Cash Prize Pools", leftVal: summary.sponsorRevenue, rightVal: summary.categoryExpenses.prizes || 100000 },
          ]}
        />
      </div>

      {/* 3. REVENUE INFLOWS & EXPENSE OUTFLOWS DUAL PANEL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: Revenue Inflows */}
        <FinanceRevenuePanel
          summary={summary}
          sponsorships={sponsorships}
          setSponsorships={setSponsorships}
          vendors={vendors}
          setVendors={setVendors}
          delegations={delegations}
          setDelegations={setDelegations}
        />

        {/* Right: Operational Expense Buckets */}
        <FinanceExpensePanel
          summary={summary}
          categories={expenseCategories}
          setCategories={setExpenseCategories}
        />
      </div>

      {/* 4. REAL-TIME DATABASE SYNC STATUS BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-[#faf9f6] shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-800 font-semibold">
          {saveStatus === "saving" ? (
            <span className="inline-flex items-center gap-1.5 text-amber-800 bg-amber-100/90 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-700" />
              <span>Saving changes to database…</span>
            </span>
          ) : saveStatus === "error" ? (
            <span className="inline-flex items-center gap-1.5 text-rose-800 bg-rose-100/90 border border-rose-200 px-3 py-1 rounded-full text-xs font-bold">
              <AlertCircle className="h-3.5 w-3.5 text-rose-700" />
              <span>Auto-save interrupted. Check network connectivity.</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-emerald-800 bg-emerald-100/90 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold">
              <Check className="h-3.5 w-3.5 text-emerald-700" />
              <span>Auto-Save Active — All modifications save to database in real time</span>
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleSaveBudget}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition disabled:opacity-50"
          title="Force immediate database checkpoint"
        >
          {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#0078d4]" /> : <Save className="h-3.5 w-3.5 text-slate-500" />}
          <span>{saving ? "Syncing…" : "Sync Now"}</span>
        </button>
      </div>

      {/* 5. Modals: Simulator, AI Audit, CA Statement */}
      <FinanceSimulatorModal
        open={simulatorOpen} onClose={() => setSimulatorOpen(false)}
        defaultRiders={summary.paidCount || 400} defaultSponsors={summary.sponsorRevenue}
      />
      <FinanceAiAuditModal open={aiAuditOpen} onClose={() => setAiAuditOpen(false)} summary={summary} />
      <FinanceAuditReportModal
        open={auditReportOpen} onClose={() => setAuditReportOpen(false)}
        summary={summary} onDownloadExcel={handleDownloadExcel} downloadingExcel={downloadingExcel}
      />
    </div>
  );
}

export default FinanceTab;
