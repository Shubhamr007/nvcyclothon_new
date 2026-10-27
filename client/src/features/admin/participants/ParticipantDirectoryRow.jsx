import React from "react";
import {
  ChevronRight,
  CheckCircle2,
  Copy,
  Check,
  Eye,
} from "lucide-react";
import { Button } from "../../../components/ui/button";

export const ParticipantDirectoryRow = React.memo(function ParticipantDirectoryRow({
  rider,
  isChecked,
  copiedId,
  onToggleSelect,
  onOpenDetails,
  onCopyId,
  onChangeStatus,
}) {
  const isCheckedIn = rider.status === "checked_in";

  return (
    <React.Fragment>
      {/* COMPACT MAIN ROW */}
      <tr
        className={`transition-colors cursor-pointer hover:bg-slate-50/70 ${isChecked ? "bg-[#deecf9]/40" : ""}`}
        onClick={(e) => {
          if (
            e.target.tagName === "INPUT" ||
            e.target.tagName === "SELECT" ||
            e.target.tagName === "BUTTON" ||
            e.target.closest("button")
          ) {
            return;
          }
          onOpenDetails(rider.id);
        }}
      >
        {/* 1. Selection Checkbox */}
        <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => onToggleSelect(rider.id)}
            className="accent-[#0078d4] h-4 w-4 rounded cursor-pointer"
            aria-label={`Select rider ${rider.full_name}`}
          />
        </td>

        {/* 2. Expand Toggle Button */}
        <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onOpenDetails(rider.id)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-800 transition-colors hover:bg-slate-100"
            aria-label={`View details for ${rider.full_name}`}
          >
            <Eye className="h-4 w-4" />
          </button>
        </td>

        {/* 3. Rider ID & Name */}
        <td className="p-3.5">
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-slate-700 text-xs">
              #{rider.id}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCopyId(rider.id, `id-${rider.id}`);
              }}
              title="Copy ID"
              aria-label={`Copy rider ID ${rider.id}`}
              className="text-slate-500 hover:text-slate-950 p-0.5"
            >
              {copiedId === `id-${rider.id}` ? (
                <Check className="h-3.5 w-3.5 text-emerald-700" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          <p className="font-bold text-sm text-slate-900">{rider.full_name}</p>
          <span className="text-xs text-slate-600 font-medium capitalize">
            {rider.gender || "Gender unstated"} • {rider.city || "Rewa"}
          </span>
          {Number(rider.age) < 18 && (
            <span className={`mt-1 inline-block rounded px-2 py-0.5 text-[10px] font-bold ${rider.guardian_consent_accepted ? "bg-emerald-100 text-emerald-800" : rider.guardian_name ? "bg-amber-100 text-amber-900" : "bg-rose-100 text-rose-800"}`}>
              {!rider.guardian_name ? "Under 18 · Guardian details missing" : rider.guardian_consent_accepted ? "Under 18 · Guardian consent recorded" : "Under 18 · Guardian confirmation pending"}
            </span>
          )}
        </td>

        {/* 4. Contact */}
        <td className="p-3.5 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-900 font-bold">{rider.phone || "—"}</span>
            {rider.whatsapp_opt_in && (
              <span
                className="inline-flex items-center rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1"
                title={`WhatsApp Opted In: ${rider.preferred_whatsapp_number || rider.phone}`}
              >
                WA
              </span>
            )}
          </div>
          <p className="text-slate-600 text-xs font-medium truncate max-w-[200px]">
            {rider.email || "—"}
          </p>
        </td>

        {/* 5. Route Category & Payment */}
        <td className="p-3.5">
          <span className="font-bold text-slate-900 block">
            {rider.ride_category}
          </span>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {rider.payment_status === "paid" ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full font-mono">
                ✓ ₹{Math.round(Number(rider.registration_fee_paise || 0) / 100) || (rider.ride_category?.includes("60") ? 1099 : rider.ride_category?.includes("30") ? 999 : rider.ride_category?.includes("10") ? 499 : 299)} PAID
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-full font-mono">
                ⏳ ₹{Math.round(Number(rider.registration_fee_paise || 0) / 100) || (rider.ride_category?.includes("60") ? 1099 : rider.ride_category?.includes("30") ? 999 : rider.ride_category?.includes("10") ? 499 : 299)} UNPAID
              </span>
            )}
            {rider.batch_name && (
              <span className="inline-flex items-center text-xs font-bold text-[#005a9e] bg-[#deecf9] border border-[#c7e0f4] px-2.5 py-0.5 rounded-full">
                {rider.batch_name}
              </span>
            )}
          </div>
        </td>

        {/* 6. Status & High-Contrast Check-in Badge */}
        <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
          {isCheckedIn ? (
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1 text-xs font-bold uppercase text-white shadow-xs">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-white" />
              <span>Checked In</span>
            </div>
          ) : (
            <select
              value={rider.status}
              onChange={(e) => onChangeStatus(rider.id, e.target.value)}
              aria-label={`Change status for rider ${rider.full_name}`}
              className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs font-bold text-slate-900 focus:border-[#0078d4] focus:outline-none"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="cancelled">Cancelled</option>
            </select>
          )}
        </td>

        {/* 7. Action Button */}
        <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenDetails(rider.id)}
            className="h-7 text-xs font-bold px-2.5 gap-1 border border-slate-300 text-slate-800 bg-white hover:bg-slate-100"
          >
            <span>Details</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </td>
      </tr>

    </React.Fragment>
  );
});
