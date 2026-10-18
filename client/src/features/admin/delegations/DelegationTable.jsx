import React from "react";
import {
  Crown,
  Building,
  Clock,
  Car,
  UserCheck,
  Users,
  Flag,
  Plus,
} from "lucide-react";
import { resolveApiAssetUrl } from "../../../api/http";
import { Button } from "../../../components/ui/button";
import { DelegationRow } from "./DelegationRow";

const STATUS_CONFIG = {
  confirmed: {
    label: "Confirmed",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  invited: {
    label: "Invited",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  attended: {
    label: "Attended",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  declined: {
    label: "Declined",
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
};

export function parseGuestDetails(notes) {
  if (!notes) return { is_chief_guest: false, general_notes: "" };
  try {
    const parsed = JSON.parse(notes);
    if (parsed && typeof parsed === "object") {
      return {
        is_chief_guest: Boolean(parsed.is_chief_guest),
        designation: parsed.designation || "",
        ceremony_role: parsed.ceremony_role || "",
        protocol_time: parsed.protocol_time || "",
        vehicle_pass: parsed.vehicle_pass || "",
        liaison_officer: parsed.liaison_officer || "",
        general_notes: parsed.general_notes || "",
        image_url: parsed.image_url || "",
      };
    }
  } catch (_) {
    // fallback
  }
  return {
    is_chief_guest: false,
    general_notes: String(notes),
  };
}

export function DelegationTable({
  delegations = [],
  selectedIds = [],
  onToggleSelect,
  onSelectAll,
  onAddClick,
}) {
  const allSelected =
    delegations.length > 0 &&
    delegations.every((d) => selectedIds.includes(d.id));
  const someSelected =
    delegations.length > 0 &&
    !allSelected &&
    delegations.some((d) => selectedIds.includes(d.id));

  if (delegations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Flag className="h-6 w-6" />
        </div>
        <h3 className="mt-4 font-bold text-sm text-slate-800">
          No VIPs or Delegations Found
        </h3>
        <p className="mt-1 text-xs text-slate-500 max-w-sm">
          No records match your active search or filters. Create a new VIP or Delegation record.
        </p>
        {onAddClick && (
          <Button
            type="button"
            onClick={onAddClick}
            className="mt-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-xl"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add First Record
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-600 text-[11px]">
              <th className="p-3.5 w-10 text-center">
                <input
                  type="checkbox"
                  aria-label="Select all delegations"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={onSelectAll}
                  className="accent-slate-900 rounded cursor-pointer"
                />
              </th>
              <th className="p-3.5 min-w-[240px]">Dignitary / Organization</th>
              <th className="p-3.5 min-w-[200px]">Ceremony Role & Protocol</th>
              <th className="p-3.5">Vehicle Pass / Escort</th>
              <th className="p-3.5 text-center">Group Size</th>
              <th className="p-3.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {delegations.map((item) => (
              <DelegationRow
                key={item.id}
                item={item}
                isSelected={selectedIds.includes(item.id)}
                onToggleSelect={onToggleSelect}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DelegationTable;
