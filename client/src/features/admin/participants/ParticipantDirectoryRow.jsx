import React from "react";
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { ParticipantExpandedDetails } from "./ParticipantExpandedDetails";

export function ParticipantDirectoryRow({
  rider,
  isChecked,
  isExpanded,
  copiedId,
  busy,
  onToggleSelect,
  onToggleExpand,
  onCopyId,
  onChangeStatus,
  onShowQr,
  previewRiderPass,
  generateRiderPasses,
  previewCertificate,
  generateCertificates,
}) {
  const isCheckedIn = rider.status === "checked_in";

  return (
    <React.Fragment>
      {/* COMPACT MAIN ROW */}
      <tr
        className={`transition-colors cursor-pointer hover:bg-black/[0.02] ${
          isChecked ? "bg-[#d9ff38]/10" : isExpanded ? "bg-[#fbf8ef]/50" : ""
        }`}
        onClick={(e) => {
          if (
            e.target.tagName === "INPUT" ||
            e.target.tagName === "SELECT" ||
            e.target.tagName === "BUTTON" ||
            e.target.closest("button")
          ) {
            return;
          }
          onToggleExpand(rider.id);
        }}
      >
        {/* 1. Selection Checkbox */}
        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => onToggleSelect(rider.id)}
            className="accent-[#071313] h-4 w-4 rounded"
            aria-label={`Select rider ${rider.full_name}`}
          />
        </td>

        {/* 2. Expand Toggle Button */}
        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onToggleExpand(rider.id)}
            className={`flex h-7 w-7 items-center justify-center rounded-lg border border-black/10 bg-white text-black/60 transition-all hover:bg-black/5 ${
              isExpanded ? "rotate-90 bg-black/5 text-[#071313]" : ""
            }`}
            aria-label={isExpanded ? "Collapse row" : "Expand row"}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </td>

        {/* 3. Rider ID & Name */}
        <td className="p-4">
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-[#071313]/50 text-[11px]">
              #{rider.id}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCopyId(rider.id, `id-${rider.id}`);
              }}
              title="Copy ID"
              className="text-black/30 hover:text-black"
            >
              {copiedId === `id-${rider.id}` ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>
          <p className="font-black text-sm text-[#071313]">{rider.full_name}</p>
          <span className="text-[10px] text-[#071313]/50 capitalize">
            {rider.gender || "Gender unstated"} • {rider.city || "Rewa"}
          </span>
        </td>

        {/* 4. Contact */}
        <td className="p-4 text-xs font-mono">
          <p className="text-[#071313] font-medium">{rider.phone || "—"}</p>
          <p className="text-[#071313]/60 text-[11px] truncate max-w-[200px]">
            {rider.email || "—"}
          </p>
        </td>

        {/* 5. Route Category & Payment */}
        <td className="p-4">
          <span className="font-bold text-[#071313] block">
            {rider.ride_category}
          </span>
          <div className="flex flex-wrap items-center gap-1 mt-1">
            {rider.payment_status === "paid" ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                ✓ PAID
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                UNPAID
              </span>
            )}
            {rider.batch_name && (
              <span className="inline-flex items-center text-[10px] font-black text-purple-900 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-full">
                {rider.batch_name}
              </span>
            )}
          </div>
        </td>

        {/* 6. Status & High-Contrast Check-in Badge */}
        <td className="p-4" onClick={(e) => e.stopPropagation()}>
          {isCheckedIn ? (
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-black uppercase text-white shadow-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-white" />
              <span>Checked In</span>
            </div>
          ) : (
            <select
              value={rider.status}
              onChange={(e) => onChangeStatus(rider.id, e.target.value)}
              className="h-8 rounded-lg border border-black/20 bg-white px-2 text-xs font-bold text-[#071313] focus:border-[#071313] focus:outline-none"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="cancelled">Cancelled</option>
            </select>
          )}
        </td>

        {/* 7. Action Button */}
        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onToggleExpand(rider.id)}
            className="h-8 text-xs font-bold px-3 gap-1"
          >
            <span>{isExpanded ? "Hide" : "Details"}</span>
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </Button>
        </td>
      </tr>

      {/* EXPANDED DETAIL DRAWER ROW */}
      {isExpanded && (
        <ParticipantExpandedDetails
          rider={rider}
          onShowQr={onShowQr}
          copyToClipboard={onCopyId}
          copiedId={copiedId}
          previewRiderPass={previewRiderPass}
          generateRiderPasses={generateRiderPasses}
          previewCertificate={previewCertificate}
          generateCertificates={generateCertificates}
          busy={busy}
        />
      )}
    </React.Fragment>
  );
}
