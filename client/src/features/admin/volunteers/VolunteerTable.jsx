import React, { memo } from "react";
import {
  UserCheck,
  Building,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Award,
  FileText,
  Send,
  Copy,
  Check,
  Lock,
  Plus,
} from "lucide-react";
import { Button } from "../../../components/ui/button";

/**
 * Memoized row component to prevent re-render cascades across 100+ volunteers.
 */
export const VolunteerTableRow = memo(function VolunteerTableRow({
  volunteer,
  isSelected,
  copiedKey,
  busy,
  onToggleSelect,
  onToggleStatus,
  onSendCredentials,
  onPreviewCertificate,
  onSendCertificate,
  onCopy,
}) {
  const isCopied = copiedKey === volunteer.id;

  return (
    <tr
      onClick={() => onToggleSelect(volunteer.id)}
      className={`cursor-pointer transition-colors ${
        isSelected ? "bg-slate-100/90 font-medium" : "hover:bg-slate-50/70"
      }`}
    >
      {/* Checkbox */}
      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          aria-label={`Select ${volunteer.display_name}`}
          checked={isSelected}
          onChange={() => onToggleSelect(volunteer.id)}
          className="accent-slate-900 rounded cursor-pointer"
        />
      </td>

      {/* Volunteer Details */}
      <td className="p-3.5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
            {(volunteer.display_name || "V").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 max-w-[200px]">
            <p className="font-bold text-sm text-slate-900 truncate">
              {volunteer.display_name}
            </p>
            <p className="text-[11px] text-slate-500 font-mono truncate">
              {volunteer.volunteer_id}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {volunteer.email || volunteer.phone}
            </p>
          </div>
        </div>
      </td>

      {/* Role & Station */}
      <td className="p-3.5 whitespace-nowrap">
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 text-[11px] font-bold text-blue-800">
          <UserCheck className="h-3 w-3" />
          {volunteer.role || "General Crew"}
        </span>
        {volunteer.organization && (
          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
            <Building className="h-3 w-3 text-slate-400" />
            <span className="truncate max-w-[140px]">{volunteer.organization}</span>
          </div>
        )}
      </td>

      {/* Credentials & Copy */}
      <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
        {volunteer.plain_password ? (
          <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-lg">
            <Lock className="h-3 w-3 text-slate-500" />
            <span className="font-mono text-xs font-bold text-slate-800">
              {volunteer.plain_password}
            </span>
            <button
              type="button"
              onClick={() => onCopy(volunteer.plain_password, volunteer.id)}
              className="text-slate-400 hover:text-slate-700 p-0.5 transition-colors"
              title="Copy credentials to clipboard"
            >
              {isCopied ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        ) : (
          <span className="text-[11px] text-slate-400 italic">Encrypted</span>
        )}
      </td>

      {/* Status (Active / Disabled) */}
      <td className="p-3.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onToggleStatus(volunteer)}
          disabled={busy}
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition ${
            volunteer.active
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
          }`}
        >
          {volunteer.active ? (
            <>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Active
            </>
          ) : (
            <>
              <ShieldAlert className="h-3.5 w-3.5 text-slate-400" />
              Disabled
            </>
          )}
        </button>
      </td>

      {/* Actions: Send Creds, Preview Cert, Send Cert */}
      <td className="p-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onSendCredentials(volunteer)}
            disabled={busy}
            className="h-8 px-2 text-[11px] text-slate-700 hover:bg-slate-100"
            title="Email credentials to volunteer"
          >
            <KeyRound className="h-3.5 w-3.5 mr-1" />
            Credentials
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onPreviewCertificate(volunteer)}
            disabled={busy}
            className="h-8 px-2 text-[11px] text-slate-700 hover:bg-slate-100"
            title="Preview volunteer certificate"
          >
            <FileText className="h-3.5 w-3.5 mr-1" />
            Cert
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onSendCertificate(volunteer)}
            disabled={busy}
            className="h-8 px-2 text-[11px] text-emerald-700 hover:bg-emerald-50"
            title="Email certificate"
          >
            <Send className="h-3.5 w-3.5 mr-1" />
            Send
          </Button>
        </div>
      </td>
    </tr>
  );
});

export function VolunteerTable({
  volunteers = [],
  selectedIds = [],
  copiedKey = null,
  busy = false,
  onToggleSelect,
  onSelectAll,
  onToggleStatus,
  onSendCredentials,
  onPreviewCertificate,
  onSendCertificate,
  onCopy,
  onAddClick,
}) {
  const allSelected =
    volunteers.length > 0 && volunteers.every((v) => selectedIds.includes(v.id));
  const someSelected =
    volunteers.length > 0 &&
    !allSelected &&
    volunteers.some((v) => selectedIds.includes(v.id));

  if (volunteers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <UserCheck className="h-6 w-6" />
        </div>
        <h3 className="mt-4 font-bold text-sm text-slate-800">
          No Volunteers Found
        </h3>
        <p className="mt-1 text-xs text-slate-500 max-w-sm">
          No volunteer records matched your active search or filters. Add a new volunteer or import a CSV roster.
        </p>
        {onAddClick && (
          <Button
            type="button"
            onClick={onAddClick}
            className="mt-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-xl"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add First Volunteer
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
                  aria-label="Select all volunteers"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={onSelectAll}
                  className="accent-slate-900 rounded cursor-pointer"
                />
              </th>
              <th className="p-3.5 min-w-[220px]">Volunteer Info</th>
              <th className="p-3.5 min-w-[180px]">Role & Assignment</th>
              <th className="p-3.5 min-w-[160px]">Login Passkey</th>
              <th className="p-3.5 text-center w-24">Portal Status</th>
              <th className="p-3.5 text-right min-w-[200px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {volunteers.map((v) => (
              <VolunteerTableRow
                key={v.id}
                volunteer={v}
                isSelected={selectedIds.includes(v.id)}
                copiedKey={copiedKey}
                busy={busy}
                onToggleSelect={onToggleSelect}
                onToggleStatus={onToggleStatus}
                onSendCredentials={onSendCredentials}
                onPreviewCertificate={onPreviewCertificate}
                onSendCertificate={onSendCertificate}
                onCopy={onCopy}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default VolunteerTable;
