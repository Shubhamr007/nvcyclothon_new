import React, { useState } from "react";
import { Handshake, Store, Users } from "lucide-react";
import { RevenueChannelTab } from "./RevenueChannelTab";

export function FinanceRevenuePanel({
  summary,
  sponsorships = [],
  setSponsorships,
  vendors = [],
  setVendors,
  delegations = [],
  setDelegations,
}) {
  const [activeTab, setActiveTab] = useState("sponsors");

  // CRUD for Sponsorships
  const handleUpdateSponsor = (id, field, val) => {
    setSponsorships((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: field === "amount" && val !== "" ? Math.max(0, Number(val) || 0) : val } : s))
    );
  };
  const handleAddSponsor = (name, amount) => {
    setSponsorships((prev) => [
      ...prev,
      { id: `sp-${Date.now()}`, name, amount: Math.max(0, Number(amount) || 0), category: "associate", confirmed: true },
    ]);
  };
  const handleDeleteSponsor = (id) => {
    setSponsorships((prev) => prev.filter((s) => s.id !== id));
  };

  // CRUD for Vendors
  const handleUpdateVendor = (id, field, val) => {
    setVendors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: field === "amount" && val !== "" ? Math.max(0, Number(val) || 0) : val } : v))
    );
  };
  const handleAddVendor = (name, amount) => {
    setVendors((prev) => [
      ...prev,
      { id: `vn-${Date.now()}`, name, amount: Math.max(0, Number(amount) || 0), confirmed: true },
    ]);
  };
  const handleDeleteVendor = (id) => {
    setVendors((prev) => prev.filter((v) => v.id !== id));
  };

  // CRUD for Delegations
  const handleUpdateDelegation = (id, field, val) => {
    setDelegations((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: field === "amount" && val !== "" ? Math.max(0, Number(val) || 0) : val } : d))
    );
  };
  const handleAddDelegation = (name, amount) => {
    setDelegations((prev) => [
      ...prev,
      { id: `del-${Date.now()}`, name, amount: Math.max(0, Number(amount) || 0), confirmed: true },
    ]);
  };
  const handleDeleteDelegation = (id) => {
    setDelegations((prev) => prev.filter((d) => d.id !== id));
  };

  const regPercent = summary.grossRevenue > 0 ? Math.round((summary.regRevenue / summary.grossRevenue) * 100) : 0;
  const sponsorPercent = summary.grossRevenue > 0 ? Math.round((summary.sponsorRevenue / summary.grossRevenue) * 100) : 0;
  const vendorPercent = summary.grossRevenue > 0 ? Math.round(((summary.vendorRevenue + summary.delegationRevenue) / summary.grossRevenue) * 100) : 0;

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-6">
      {/* HEADER & COMPOSITION BAR */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="h-3 w-3 rounded-full bg-emerald-600" />
            <h3 className="font-bold text-base text-slate-950">Revenue Inflow Channels</h3>
          </div>
          <div className="flex items-center gap-2">
            {summary.pipelineCommercialRevenue > 0 && (
              <span className="font-mono text-2xs font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-lg" title="Tentative pipeline not yet recognized in gross revenue">
                +₹{summary.pipelineCommercialRevenue.toLocaleString("en-IN")} Pending
              </span>
            )}
            <span className="font-mono text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
              Realized: ₹{summary.grossRevenue.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Multi-segment revenue composition bar */}
        <div className="mt-3.5 h-3 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200 flex">
          <div style={{ width: `${regPercent}%` }} className="bg-emerald-600 transition-all" title={`Tickets: ${regPercent}%`} />
          <div style={{ width: `${sponsorPercent}%` }} className="bg-blue-600 transition-all" title={`Sponsors: ${sponsorPercent}%`} />
          <div style={{ width: `${vendorPercent}%` }} className="bg-purple-600 transition-all" title={`Expo/Corporate: ${vendorPercent}%`} />
        </div>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-700 font-bold font-mono">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 inline-block" />
            Tickets ({regPercent}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600 inline-block" />
            Sponsors ({sponsorPercent}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-600 inline-block" />
            Expo / Delegations ({vendorPercent}%)
          </span>
        </div>
      </div>

      {/* SECTION 1: PARTICIPANT TICKET REVENUE (LIVE LEDGER) */}
      <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-4 space-y-1.5 shadow-2xs">
        <div className="flex items-center justify-between text-xs font-bold text-slate-950">
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-600 shrink-0" />
            Live Rider Registrations ({summary.paidCount || 0} Paid Riders)
          </span>
          <span className="font-mono font-extrabold text-sm text-slate-950">
            ₹{(summary.regRevenue || 0).toLocaleString("en-IN")}
          </span>
        </div>
        <p className="text-xs text-slate-600 font-medium leading-relaxed">
          Real-time gateway settlements across 60km, 30km, 10km, and Kids race tiers.
        </p>
      </div>

      {/* REVENUE SUB-CHANNEL TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2.5">
        <button
          type="button"
          onClick={() => setActiveTab("sponsors")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
            activeTab === "sponsors"
              ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs"
              : "text-slate-600 hover:bg-slate-100 border border-transparent"
          }`}
        >
          <Handshake className="h-4 w-4" />
          <span>Sponsors ({sponsorships.filter((s) => s.confirmed).length}/{sponsorships.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("vendors")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
            activeTab === "vendors"
              ? "bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs"
              : "text-slate-600 hover:bg-slate-100 border border-transparent"
          }`}
        >
          <Store className="h-4 w-4" />
          <span>Expo Stalls ({vendors.filter((v) => v.confirmed).length}/{vendors.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("delegations")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
            activeTab === "delegations"
              ? "bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs"
              : "text-slate-600 hover:bg-slate-100 border border-transparent"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Delegations ({delegations.filter((d) => d.confirmed).length}/{delegations.length})</span>
        </button>
      </div>

      {/* ACTIVE TAB ITEMS (INLINE EDIT, CONFIRM TOGGLE, DELETE) */}
      <div>
        {activeTab === "sponsors" && (
          <RevenueChannelTab
            items={sponsorships}
            onUpdateItem={handleUpdateSponsor}
            onDeleteItem={handleDeleteSponsor}
            onAddItem={handleAddSponsor}
            themeColor="blue"
            placeholder="New sponsor partner name…"
          />
        )}
        {activeTab === "vendors" && (
          <RevenueChannelTab
            items={vendors}
            onUpdateItem={handleUpdateVendor}
            onDeleteItem={handleDeleteVendor}
            onAddItem={handleAddVendor}
            themeColor="purple"
            placeholder="New vendor booth/stall name…"
          />
        )}
        {activeTab === "delegations" && (
          <RevenueChannelTab
            items={delegations}
            onUpdateItem={handleUpdateDelegation}
            onDeleteItem={handleDeleteDelegation}
            onAddItem={handleAddDelegation}
            themeColor="amber"
            placeholder="New corporate delegation / club name…"
          />
        )}
      </div>
    </div>
  );
}
