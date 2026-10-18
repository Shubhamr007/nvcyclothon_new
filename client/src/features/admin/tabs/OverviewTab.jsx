import React, { memo, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  Award,
  Bike,
  ChevronRight,
  Coins,
} from "lucide-react";
import { adminRequest } from "../../../api/http";
import { useAppSelector } from "../../../store/hooks";
import { Progress } from "../../../components/ui/progress";
import { StatusBadge } from "../components/StatusBadge";
import { AiInsightsPanel } from "../ai/AiInsightsPanel";

const KpiCard = memo(function KpiCard({ card, idx, onNavigate }) {
  const Icon = card.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: idx * 0.05 }}
      onClick={() => onNavigate(card.tab)}
      className={`group cursor-pointer rounded-2xl border p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${card.color}`}
    >
      <div className="flex items-center justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-xs border ${card.iconBg}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-slate-700" />
      </div>
      <p className="mt-4 text-xs font-black tracking-[0.14em] uppercase text-slate-600 font-mono">
        {card.label}
      </p>
      <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">
        {card.value.toLocaleString()}
      </p>
      <p className="mt-1 text-xs text-slate-600 font-semibold">{card.sub}</p>
    </motion.div>
  );
});

const RouteProgressItem = memo(function RouteProgressItem({ route, count, total }) {
  const percent = total > 0 ? Math.round((Number(count) / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-slate-900">{route}</span>
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className="font-black text-slate-950">{count}</span>
          <span className="text-slate-700 font-bold">({percent}%)</span>
        </div>
      </div>
      <Progress value={percent} className="h-2.5 bg-slate-200 border border-slate-300" />
    </div>
  );
});

const RecentRegistrationRow = memo(function RecentRegistrationRow({ reg }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-b-0">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200/80">
          <Bike className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-950">{reg.full_name}</p>
          <p className="text-xs text-slate-600 font-medium">{reg.ride_category}</p>
        </div>
      </div>
      <StatusBadge status={reg.status} />
    </div>
  );
});

export function OverviewTab({ analytics = {}, registrations: propRegistrations, onNavigate }) {
  const accessToken = useAppSelector((state) => state.auth?.accessToken);
  const [recentRegistrations, setRecentRegistrations] = useState(propRegistrations || []);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (propRegistrations && propRegistrations.length > 0) {
      setRecentRegistrations(propRegistrations);
    } else if (accessToken && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      adminRequest("/registrations?limit=6", accessToken)
        .then((data) => setRecentRegistrations(data || []))
        .catch(() => {});
    }
  }, [propRegistrations, accessToken]);

  const totalRiders = Number(analytics.total_registrations || 0);
  const approvedRiders = Number(analytics.approved_registrations || 0);
  const pendingRiders = Math.max(0, totalRiders - approvedRiders);
  const checkedInRiders = Number(analytics.checked_in_registrations || 0);

  const cards = [
    {
      label: "TOTAL REGISTERED",
      value: totalRiders,
      sub: "All signed up participants",
      icon: Users,
      color: "border border-blue-200/90 bg-gradient-to-br from-blue-50/70 via-white to-white text-slate-950 hover:border-blue-300 hover:shadow-blue-100/50",
      iconBg: "bg-blue-600 text-white border-blue-700 shadow-sm shadow-blue-500/20",
      tab: "riders",
    },
    {
      label: "APPROVED RIDERS",
      value: approvedRiders,
      sub: "Confirmed & payment verified",
      icon: CheckCircle2,
      color: "border border-emerald-200/90 bg-gradient-to-br from-emerald-50/70 via-white to-white text-slate-950 hover:border-emerald-300 hover:shadow-emerald-100/50",
      iconBg: "bg-emerald-600 text-white border-emerald-700 shadow-sm shadow-emerald-500/20",
      tab: "riders",
    },
    {
      label: "PENDING APPROVAL",
      value: pendingRiders,
      sub: "Requires staff verification",
      icon: Clock,
      color: "border border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-white to-white text-slate-950 hover:border-amber-300 hover:shadow-amber-100/50",
      iconBg: "bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-500/20",
      tab: "riders",
    },
    {
      label: "CHECKED IN (RACE DAY)",
      value: checkedInRiders,
      sub: "Scanned & bib assigned",
      icon: Award,
      color: "border border-indigo-200/90 bg-gradient-to-br from-indigo-50/70 via-white to-white text-slate-950 hover:border-indigo-300 hover:shadow-indigo-100/50",
      iconBg: "bg-indigo-600 text-white border-indigo-700 shadow-sm shadow-indigo-500/20",
      tab: "riders",
    },
  ];

  const routeEntries = Object.entries(analytics.registrations_by_route || {});
  const routeTotal = routeEntries.reduce((total, [, count]) => total + Number(count), 0);

  return (
    <div className="space-y-6">
      {/* KPI METRIC CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, idx) => (
          <KpiCard
            key={card.label}
            card={card}
            idx={idx}
            onNavigate={onNavigate}
          />
        ))}
      </div>

      {/* AI INTELLIGENCE SUMMARY */}
      <AiInsightsPanel />

      {/* FINANCIAL HEALTH QUICK BANNER */}
      <div
        onClick={() => onNavigate("finance")}
        className="cursor-pointer rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-5 text-white shadow-md transition hover:border-emerald-400 group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <Coins className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-black tracking-widest text-emerald-400 uppercase font-mono">
              FINANCIAL P&L COMMAND CENTER
            </span>
            <p className="text-sm font-bold text-white mt-0.5">
              View live revenue balance sheet, prize money pools, route clearances, and break-even calculator
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 group-hover:text-emerald-200 shrink-0">
          <span>Open Calculator</span>
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>

      {/* CHARTS & RECENT SIGNUPS */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ROUTE BREAKDOWN */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
          <div className="border-b border-slate-200/80 pb-4">
            <p className="text-xs font-black tracking-wider text-slate-600 uppercase font-mono">
              CATEGORY DEMAND
            </p>
            <h3 className="text-base font-bold text-slate-950">Registrations by Route</h3>
          </div>

          <div className="mt-5 space-y-4">
            {routeEntries.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-600 font-medium">No route data available.</p>
            ) : (
              routeEntries.map(([route, count]) => (
                <RouteProgressItem
                  key={route}
                  route={route}
                  count={count}
                  total={routeTotal}
                />
              ))
            )}
          </div>
        </div>

        {/* LATEST REGISTRATIONS */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
            <div>
              <p className="text-xs font-black tracking-wider text-slate-600 uppercase font-mono">
                ACTIVITY FEED
              </p>
              <h3 className="text-base font-bold text-slate-950">Latest Registrations</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("riders")}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
            >
              View all <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {recentRegistrations.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-600 font-medium">No registrations recorded yet.</p>
            ) : (
              recentRegistrations.slice(0, 6).map((reg) => (
                <RecentRegistrationRow key={reg.id} reg={reg} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OverviewTab;
