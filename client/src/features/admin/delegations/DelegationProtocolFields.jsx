import React, { memo } from "react";

export const CEREMONY_ROLES = [
  "Chief Guest — Flag-off 50KM Elite Race",
  "Chief Guest — Flag-off 25KM Green Ride",
  "Guest of Honour — Prize Distribution Ceremony",
  "Distinguished Speaker — Stage Address",
  "VIP Dignitary — Felicitation of Champions",
  "Patron & Special Invitee",
  "Delegation Leader / Team Captain",
];

export const DelegationProtocolFields = memo(function DelegationProtocolFields({
  formData,
  setFormData,
  ceremonyRoles = CEREMONY_ROLES,
}) {
  return (
    <>
      {/* Designation & Ceremony Role */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Official Designation / Title
          </label>
          <input
            type="text"
            value={formData.designation}
            onChange={(e) => setFormData((prev) => ({ ...prev, designation: e.target.value }))}
            placeholder="e.g. District Collector / SP / Managing Director"
            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0078d4]/20 focus:border-[#0078d4]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Ceremony Role
          </label>
          <select
            value={formData.ceremony_role}
            onChange={(e) => setFormData((prev) => ({ ...prev, ceremony_role: e.target.value }))}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0078d4]/20 focus:border-[#0078d4]"
          >
            {ceremonyRoles.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Protocol Time, Vehicle Pass, Liaison Officer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Protocol Arrival Time
          </label>
          <input
            type="text"
            value={formData.protocol_time}
            onChange={(e) => setFormData((prev) => ({ ...prev, protocol_time: e.target.value }))}
            placeholder="e.g. 05:45 AM"
            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-mono font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0078d4]/20 focus:border-[#0078d4]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            VIP Vehicle Pass #
          </label>
          <input
            type="text"
            value={formData.vehicle_pass}
            onChange={(e) => setFormData((prev) => ({ ...prev, vehicle_pass: e.target.value }))}
            placeholder="e.g. MP-VIP-01"
            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-mono font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0078d4]/20 focus:border-[#0078d4]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Liaison Officer / Escort
          </label>
          <input
            type="text"
            value={formData.liaison_officer}
            onChange={(e) => setFormData((prev) => ({ ...prev, liaison_officer: e.target.value }))}
            placeholder="e.g. Inspector Amit"
            className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0078d4]/20 focus:border-[#0078d4]"
          />
        </div>
      </div>
    </>
  );
});
