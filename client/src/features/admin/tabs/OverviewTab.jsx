import React from "react";
import { motion } from "framer-motion";
import {
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Flame,
  Award,
  Bike,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Progress } from "../../../components/ui/progress";
import { Badge } from "../../../components/ui/badge";

export function OverviewTab({ analytics = {}, registrations = [], onNavigate }) {
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
      color: "border-[#071313]/10 bg-white text-[#071313]",
      iconBg: "bg-[#071313] text-[#d9ff38]",
      tab: "riders",
    },
    {
      label: "APPROVED RIDERS",
      value: approvedRiders,
      sub: "Confirmed & payment verified",
      icon: CheckCircle2,
      color: "border-[#d9ff38]/30 bg-gradient-to-br from-[#d9ff38]/10 to-white text-[#071313]",
      iconBg: "bg-[#d9ff38] text-[#071313]",
      tab: "riders",
    },
    {
      label: "PENDING APPROVAL",
      value: pendingRiders,
      sub: "Requires staff verification",
      icon: Clock,
      color: "border-[#ff5f3d]/20 bg-gradient-to-br from-[#ff5f3d]/10 to-white text-[#071313]",
      iconBg: "bg-[#ff5f3d] text-white",
      tab: "riders",
    },
    {
      label: "CHECKED IN (RACE DAY)",
      value: checkedInRiders,
      sub: "Scanned & bib assigned",
      icon: Award,
      color: "border-[#071313]/10 bg-white text-[#071313]",
      iconBg: "bg-[#071313] text-white",
      tab: "riders",
    },
  ];

  const routeEntries = Object.entries(analytics.registrations_by_route || {});
  const routeTotal = routeEntries.reduce((total, [, count]) => total + Number(count), 0);

  return (
    <div className="space-y-6">
      {/* KPI METRIC CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.05 }}
              onClick={() => onNavigate(card.tab)}
              className={`group cursor-pointer rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${card.color}`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm ${card.iconBg}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-black/25 transition-transform group-hover:translate-x-1 group-hover:text-black/80" />
              </div>
              <p className="mt-4 text-[11px] font-black tracking-[0.14em] uppercase text-black/50 font-mono">
                {card.label}
              </p>
              <p className="mt-1 text-3xl font-black tracking-tight text-[#071313]">
                {card.value.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-black/55">{card.sub}</p>
            </motion.div>
          );
        })}
      </div>

      {/* ACTION BANNER */}
      {pendingRiders > 0 ? (
        <div className="relative overflow-hidden rounded-2xl border border-[#ff5f3d]/30 bg-gradient-to-r from-[#fff1eb] via-white to-[#fff1eb] p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ff5f3d] text-white shadow-md">
                <Flame className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <Badge variant="blaze" className="text-[10px] py-0.5 px-2.5">
                  PRIORITY ACTION REQUIRED
                </Badge>
                <h3 className="mt-1.5 text-lg font-black text-[#071313]">
                  {pendingRiders} participant{pendingRiders === 1 ? "" : "s"} awaiting review
                </h3>
                <p className="mt-0.5 text-xs text-[#071313]/60 max-w-xl">
                  Verify rider payment receipts, confirm categories, and issue rider passes before race day.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("riders")}
              className="inline-flex items-center gap-2 rounded-xl bg-[#071313] px-5 py-2.5 text-xs font-black tracking-wider uppercase text-[#d9ff38] shadow-sm transition hover:bg-[#ff5f3d] hover:text-white"
            >
              <span>Review Participants</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {/* TWO COLUMN GRID: ROUTE MIX & LATEST REGISTRATIONS */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ROUTE DISTRIBUTION */}
        <div className="rounded-2xl border border-[#071313]/10 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#071313]/5 pb-4">
            <div>
              <p className="text-[11px] font-black tracking-[0.16em] text-[#071313]/40 uppercase font-mono">
                CATEGORY DISTRIBUTION
              </p>
              <h3 className="text-lg font-black text-[#071313]">Route Breakdown</h3>
            </div>
            <span className="rounded-full bg-[#fbf8ef] px-3 py-1 text-xs font-bold text-[#071313]">
              {routeTotal} Total Riders
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {routeEntries.length === 0 ? (
              <p className="py-6 text-center text-xs text-[#071313]/50">No route data available yet.</p>
            ) : (
              routeEntries.map(([route, count]) => {
                const percent = routeTotal ? Math.round((Number(count) / routeTotal) * 100) : 0;
                return (
                  <div key={route} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#071313]">{route}</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-[#071313]">{count}</span>
                        <span className="text-[#071313]/40 font-normal">({percent}%)</span>
                      </div>
                    </div>
                    <Progress value={percent} className="h-2 bg-[#071313]/5" />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* LATEST REGISTRATIONS */}
        <div className="rounded-2xl border border-[#071313]/10 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#071313]/5 pb-4">
            <div>
              <p className="text-[11px] font-black tracking-[0.16em] text-[#071313]/40 uppercase font-mono">
                ACTIVITY FEED
              </p>
              <h3 className="text-lg font-black text-[#071313]">Latest Registrations</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("riders")}
              className="text-xs font-bold text-[#071313] hover:text-[#ff5f3d] flex items-center gap-1"
            >
              View all <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-4 divide-y divide-[#071313]/5">
            {registrations.length === 0 ? (
              <p className="py-6 text-center text-xs text-[#071313]/50">No registrations recorded yet.</p>
            ) : (
              registrations.slice(0, 6).map((reg) => (
                <div key={reg.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#071313]/5 text-[#071313] font-bold text-xs">
                      <Bike className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#071313]">{reg.full_name}</p>
                      <p className="text-[11px] text-[#071313]/50">{reg.ride_category}</p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      reg.status === "checked_in"
                        ? "successSolid"
                        : reg.status === "approved"
                        ? "info"
                        : reg.status === "pending"
                        ? "warning"
                        : "secondary"
                    }
                    className="text-[10px] capitalize px-2 py-0.5 font-bold"
                  >
                    {String(reg.status || "").replaceAll("_", " ")}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
