import React, { memo } from "react";

export const DelegationLogisticsFields = memo(function DelegationLogisticsFields({
  formData,
  setFormData,
}) {
  return (
    <>
      {/* Contact Details, Member Count, and Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Contact Phone
          </label>
          <input
            type="tel"
            value={formData.contact_phone}
            onChange={(e) => setFormData((prev) => ({ ...prev, contact_phone: e.target.value }))}
            placeholder="+91 98765 43210"
            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Delegation Member Count
          </label>
          <input
            type="number"
            min="1"
            value={formData.member_count}
            onChange={(e) => setFormData((prev) => ({ ...prev, member_count: Number(e.target.value) || 1 }))}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Invitation Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
          >
            <option value="confirmed">Confirmed</option>
            <option value="invited">Invited</option>
            <option value="attended">Attended</option>
            <option value="declined">Declined</option>
          </select>
        </div>
      </div>

      {/* General Notes */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
          Protocol / Logistics Notes
        </label>
        <textarea
          rows={3}
          value={formData.general_notes}
          onChange={(e) => setFormData((prev) => ({ ...prev, general_notes: e.target.value }))}
          placeholder="Special seating requirements, dais protocol, security escorts, or dietary preferences…"
          className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 leading-relaxed resize-none"
        />
      </div>
    </>
  );
});
