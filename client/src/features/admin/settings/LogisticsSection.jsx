import React from "react";

export function LogisticsSection({ settings, updateField }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
      <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-3">
        Event Details & Application Gates
      </h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Event Date
          </label>
          <input
            type="date"
            value={settings.event_date || ""}
            onChange={(e) => updateField("event_date", e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Race Flag-off Time
          </label>
          <input
            type="text"
            value={settings.event_start_time || ""}
            onChange={(e) => updateField("event_start_time", e.target.value)}
            placeholder="5:30 AM"
            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Event Venue / Location
          </label>
          <input
            type="text"
            value={settings.event_location || ""}
            onChange={(e) => updateField("event_location", e.target.value)}
            placeholder="Rewa Stadium, Rewa, MP"
            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
            Edition Label
          </label>
          <input
            type="text"
            value={settings.edition_label || ""}
            onChange={(e) => updateField("edition_label", e.target.value)}
            placeholder="3rd Edition"
            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] focus:outline-none"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-[#faf9f6] p-4 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wide text-slate-800">
          Application Gate Toggles
        </h4>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-2.5 cursor-pointer bg-white p-3 rounded-xl border border-slate-200 hover:border-[#0078d4]/40 transition shadow-xs">
            <input
              type="checkbox"
              checked={Boolean(settings.registration_open)}
              onChange={(e) => updateField("registration_open", e.target.checked)}
              className="h-4 w-4 rounded accent-[#0078d4]"
            />
            <span className="text-xs font-semibold text-slate-800">Rider Registrations Open</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer bg-white p-3 rounded-xl border border-slate-200 hover:border-[#0078d4]/40 transition shadow-xs">
            <input
              type="checkbox"
              checked={Boolean(settings.partner_applications_open)}
              onChange={(e) => updateField("partner_applications_open", e.target.checked)}
              className="h-4 w-4 rounded accent-[#0078d4]"
            />
            <span className="text-xs font-semibold text-slate-800">Partner Applications Open</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer bg-white p-3 rounded-xl border border-slate-200 hover:border-[#0078d4]/40 transition shadow-xs">
            <input
              type="checkbox"
              checked={Boolean(settings.vendor_applications_open)}
              onChange={(e) => updateField("vendor_applications_open", e.target.checked)}
              className="h-4 w-4 rounded accent-[#0078d4]"
            />
            <span className="text-xs font-semibold text-slate-800">Vendor Applications Open</span>
          </label>
        </div>
      </div>
    </div>
  );
}

export default LogisticsSection;
