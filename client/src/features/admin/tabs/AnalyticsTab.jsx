import React, { useState, useEffect } from "react";
import { adminRequest } from "../../../api/http";
import { LoadingIndicator } from "../../../components/LoadingIndicator";
import { Badge } from "../../../components/ui/badge";
import { BarChart3, Globe, Clock, ShieldCheck, Activity } from "lucide-react";
import { useAppSelector } from "../../../store/hooks";

export function AnalyticsTab({ accessToken: propAccessToken }) {
  const authAccessToken = useAppSelector((state) => state.auth?.accessToken);
  const accessToken = propAccessToken || authAccessToken;
  const [data, setData] = useState(null);

  useEffect(() => {
    adminRequest("/visitor-analytics", accessToken)
      .then(setData)
      .catch(() => setData({ error: true }));
  }, [accessToken]);

  if (!data) {
    return (
      <div className="py-20 flex justify-center rounded-2xl bg-white shadow-sm border border-black/10">
        <LoadingIndicator label="Loading visitor analytics…" />
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Visitor analytics could not be retrieved. Please verify server connection.
      </div>
    );
  }

  const peak = Math.max(1, ...(data.hourly || []).map((item) => item.count));

  return (
    <div className="space-y-6">
      {/* HEADER CARD */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              <span className="text-[11px] font-bold tracking-widest text-emerald-400 uppercase font-mono">
                PUBLIC SPEEDWAY FOOTFALL
              </span>
            </div>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight">
              {Number(data.total_visits || 0).toLocaleString()} Page Visits
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Aggregated page view impressions recorded from public rider sessions.
            </p>
          </div>
          <span className="w-fit inline-flex items-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-mono font-semibold text-emerald-400">
            LIVE ANALYTICS
          </span>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* HOURLY BAR CHART */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400 font-mono">
                PEAK RUSH HOURS
              </p>
              <h3 className="text-base font-bold text-slate-900">Visits by Hour (UTC)</h3>
            </div>
            <span className="text-xs font-mono text-slate-500">Peak: {peak} visits</span>
          </div>

          <div
            className="mt-6 flex h-48 items-end gap-1.5 pt-4"
            aria-label="Hourly visitor chart"
          >
            {(data.hourly || []).map((item) => {
              const heightPercent = Math.max(4, Math.round((item.count / peak) * 100));
              return (
                <div
                  key={item.hour}
                  className="group relative flex h-full flex-1 flex-col justify-end items-center"
                >
                  {/* Tooltip on hover */}
                  <div className="absolute -top-7 hidden group-hover:flex items-center justify-center rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-mono text-white whitespace-nowrap z-10 shadow-md">
                    {item.hour}:00 — {item.count}
                  </div>
                  <div
                    className="w-full rounded-t transition-all duration-200 bg-slate-900 group-hover:bg-blue-600"
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-100">
            <span>00:00 (Midnight)</span>
            <span>12:00 (Noon)</span>
            <span>23:00 (Night)</span>
          </div>
        </div>

        {/* TIMEZONES & SPLIT */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          {/* Half day split */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-3">Day / Night Velocity</h3>
            <div className="space-y-2">
              {(data.half_day || []).map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs"
                >
                  <span className="font-semibold text-slate-800">{item.label}</span>
                  <span className="font-mono font-bold text-slate-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Timezone breakdown */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-3">Audience Timezones</h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {(data.timezones || []).length ? (
                data.timezones.map((item) => (
                  <div
                    key={item.timezone}
                    className="flex items-center justify-between py-1.5 border-b border-slate-100 text-xs"
                  >
                    <span className="text-slate-700 truncate max-w-[160px] font-medium">
                      {item.timezone}
                    </span>
                    <span className="font-mono font-bold text-slate-900">{item.count}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">No timezone records yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DAILY VISITS GRID */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900">Recent Days Traffic</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(data.daily || []).map((item) => (
            <div key={item.day} className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <span className="block text-[11px] font-mono text-slate-500">{item.day}</span>
              <span className="mt-1 block text-2xl font-extrabold text-slate-900">
                {item.count.toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-500 border-t border-slate-100">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>
            Privacy compliant: tracks aggregate views, timezone, and device type without storing IP
            addresses or personal identifiers.
          </span>
        </div>
      </div>
    </div>
  );
}
