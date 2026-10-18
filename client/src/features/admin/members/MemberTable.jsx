import React from "react";
import { UsersRound, Plus } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { MemberRow } from "./MemberRow";

export function MemberTable({
  members = [],
  selectedIds = [],
  onToggleSelect,
  onSelectAll,
  onToggleVisibility,
  onAddClick,
}) {
  const allSelected =
    members.length > 0 && members.every((m) => selectedIds.includes(m.id));
  const someSelected =
    members.length > 0 &&
    !allSelected &&
    members.some((m) => selectedIds.includes(m.id));

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <UsersRound className="h-6 w-6" />
        </div>
        <h3 className="mt-4 font-bold text-sm text-slate-800">
          No Organizing Members Found
        </h3>
        <p className="mt-1 text-xs text-slate-500 max-w-sm">
          No records match your active search or visibility filter. Add a new member or adjust your filter.
        </p>
        {onAddClick && (
          <Button
            type="button"
            onClick={onAddClick}
            className="mt-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-xl"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add First Member
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
              {/* Checkbox Header */}
              <th className="p-3.5 w-10 text-center">
                <input
                  type="checkbox"
                  aria-label="Select all members"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={onSelectAll}
                  className="accent-slate-900 rounded cursor-pointer"
                />
              </th>
              <th className="p-3.5 min-w-[220px]">Member Details</th>
              <th className="p-3.5">Designation</th>
              <th className="p-3.5">Order</th>
              <th className="p-3.5 min-w-[200px]">Statement / Quote</th>
              <th className="p-3.5 text-center w-20">Visibility</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                isSelected={selectedIds.includes(member.id)}
                onToggleSelect={onToggleSelect}
                onToggleVisibility={onToggleVisibility}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MemberTable;
