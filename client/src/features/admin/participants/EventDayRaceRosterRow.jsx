import React from "react";
import { CheckCircle2, Clock, Phone, QrCode } from "lucide-react";

export const EventDayRaceRosterRow = React.memo(function EventDayRaceRosterRow({
  rider,
  index,
  isSelected,
  onToggleSelect,
  onShowQr,
}) {
  const isCheckedIn = rider.status === "checked_in";

  return (
    <tr
      onClick={(e) => {
        if (
          e.target.tagName === "INPUT" ||
          e.target.tagName === "BUTTON" ||
          e.target.tagName === "A" ||
          e.target.closest("button") ||
          e.target.closest("a")
        ) {
          return;
        }
        onToggleSelect(rider.id);
      }}
      className={`transition cursor-pointer hover:bg-slate-50/80 ${
        isSelected
          ? "bg-[#deecf9]/40"
          : index % 2 === 1
          ? "bg-slate-50/40"
          : ""
      }`}
    >
      <td className="py-3 px-3 text-center print:hidden" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(rider.id)}
          className="accent-[#0078d4] h-4 w-4 rounded cursor-pointer"
        />
      </td>
      <td className="py-3 px-3 text-center font-mono font-medium text-slate-600">
        #{rider.id}
      </td>
      <td className="py-3 px-4">
        <div className="font-semibold text-sm text-slate-900">{rider.full_name}</div>
        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">{rider.email}</div>
      </td>
      <td className="py-3 px-3 text-center">
        <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
          {rider.age ? `${rider.age} yrs` : "—"}
        </span>
        <div className="text-[10px] font-medium text-slate-500 mt-0.5 capitalize">
          {rider.gender || "—"}
        </div>
      </td>
      <td className="py-3 px-4 font-medium text-slate-900">
        {rider.ride_category}
      </td>
      <td className="py-3 px-3 text-center">
        {rider.batch_name ? (
          <span className="inline-block rounded-md bg-[#deecf9] text-[#005a9e] border border-[#c7e0f4] px-2 py-0.5 font-medium text-[11px] tracking-tight">
            {rider.batch_name}
          </span>
        ) : (
          <span className="text-slate-400 font-medium">—</span>
        )}
      </td>
      <td className="py-3 px-3 text-center">
        <span className="inline-block rounded-md border border-slate-200 bg-white px-2 py-0.5 font-medium text-slate-700">
          {rider.t_shirt_size || "N/A"}
        </span>
      </td>
      <td className="py-3 px-3">
        <a
          href={`tel:${rider.phone}`}
          className="font-mono font-medium text-[#0078d4] hover:underline flex items-center gap-1"
        >
          <Phone className="h-3 w-3" />
          {rider.phone}
        </a>
      </td>
      <td className="py-3 px-3">
        {rider.emergency_contact ? (
          <a
            href={`tel:${rider.emergency_contact}`}
            className="font-mono text-slate-600 hover:underline text-[11px]"
          >
            {rider.emergency_contact}
          </a>
        ) : (
          <span className="text-slate-400 font-medium">—</span>
        )}
      </td>
      <td className="py-3 px-3">
        <div className="font-medium text-slate-900">{rider.city || "—"}</div>
        {rider.organization_name && (
          <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
            {rider.organization_name}
          </div>
        )}
      </td>
      <td className="py-3 px-3 text-center">
        {isCheckedIn ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-medium">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Checked In
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 text-[11px] font-medium">
            <Clock className="h-3 w-3 text-amber-600" /> Pending
          </span>
        )}
      </td>
      <td className="py-3 px-3 text-center print:hidden" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onShowQr(rider)}
          className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition"
          title="View Check-In QR Pass"
        >
          <QrCode className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
});

export default EventDayRaceRosterRow;
