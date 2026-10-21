import React, { useCallback } from "react";
import {
  Crown,
  Building,
  Clock,
  Car,
  UserCheck,
  Users,
} from "lucide-react";
import { resolveApiAssetUrl } from "../../../api/http";
import { parseGuestDetails } from "./DelegationTable";

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
    badge: "bg-[#deecf9] text-[#005a9e] border-[#c7e0f4]",
    dot: "bg-[#0078d4]",
  },
  declined: {
    label: "Declined",
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
};

export const DelegationRow = React.memo(function DelegationRow({
  item,
  isSelected,
  onToggleSelect,
}) {
  const handleToggle = useCallback(() => {
    onToggleSelect(item.id);
  }, [item.id, onToggleSelect]);

  const handleCheckboxClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

  const guestInfo = parseGuestDetails(item.notes);
  const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.invited;

  return (
    <tr
      onClick={handleToggle}
      className={`cursor-pointer transition-colors ${
        isSelected ? "bg-[#deecf9]/40 font-medium" : "hover:bg-slate-50/70"
      }`}
    >
      {/* Row Checkbox */}
      <td className="p-3.5 text-center" onClick={handleCheckboxClick}>
        <input
          type="checkbox"
          aria-label={`Select ${item.organization || item.contact_name}`}
          checked={isSelected}
          onChange={handleToggle}
          className="accent-[#0078d4] rounded cursor-pointer"
        />
      </td>

      {/* Dignitary / Org Name */}
      <td className="p-3.5">
        <div className="flex items-center gap-3">
          {/* Avatar / Icon */}
          <div className="relative shrink-0">
            {guestInfo.image_url ? (
              <img
                src={resolveApiAssetUrl(guestInfo.image_url)}
                alt={item.contact_name || item.organization}
                className="h-10 w-10 rounded-xl object-cover border border-slate-200 shadow-xs"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  if (e.currentTarget.nextSibling) {
                    e.currentTarget.nextSibling.style.display = "flex";
                  }
                }}
              />
            ) : null}
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs ${
                guestInfo.is_chief_guest
                  ? "bg-amber-500 text-white"
                  : "bg-[#deecf9] text-[#005a9e] border border-[#c7e0f4]"
              } ${guestInfo.image_url ? "hidden" : "flex"}`}
            >
              {guestInfo.is_chief_guest ? (
                <Crown className="h-5 w-5" />
              ) : (
                <Building className="h-5 w-5" />
              )}
            </div>
          </div>

          <div className="min-w-0 max-w-[220px]">
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-sm text-slate-900 truncate">
                {item.contact_name || item.organization}
              </p>
              {guestInfo.is_chief_guest && (
                <span className="inline-flex items-center rounded-md bg-amber-50 border border-amber-200 px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider text-amber-800">
                  VIP
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              {guestInfo.designation || item.organization || "Dignitary"}
            </p>
            {item.contact_phone && (
              <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                {item.contact_phone}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Ceremony Role & Protocol Time */}
      <td className="p-3.5">
        <div className="space-y-1">
          <span className="inline-block text-xs font-semibold text-slate-800 truncate max-w-[220px]">
            {guestInfo.ceremony_role || "Official Invitee"}
          </span>
          {guestInfo.protocol_time && (
            <div className="flex items-center gap-1 text-[11px] font-mono text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md w-fit">
              <Clock className="h-3 w-3 text-amber-600" />
              <span>{guestInfo.protocol_time}</span>
            </div>
          )}
        </div>
      </td>

      {/* Vehicle Pass & Liaison */}
      <td className="p-3.5 whitespace-nowrap">
        <div className="space-y-1 text-[11px]">
          {guestInfo.vehicle_pass ? (
            <div className="flex items-center gap-1 font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 w-fit">
              <Car className="h-3 w-3 text-emerald-600" />
              <span>{guestInfo.vehicle_pass}</span>
            </div>
          ) : (
            <span className="text-slate-400 italic">No pass issued</span>
          )}
          {guestInfo.liaison_officer && (
            <div className="flex items-center gap-1 text-slate-600">
              <UserCheck className="h-3 w-3 text-slate-400" />
              <span>Officer: {guestInfo.liaison_officer}</span>
            </div>
          )}
        </div>
      </td>

      {/* Member Count */}
      <td className="p-3.5 text-center whitespace-nowrap">
        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1 font-mono text-xs font-bold text-slate-700">
          <Users className="h-3 w-3 text-slate-500" />
          <span>{item.member_count || 1}</span>
        </span>
      </td>

      {/* Status Badge */}
      <td className="p-3.5 text-center whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusCfg.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
          {statusCfg.label}
        </span>
      </td>
    </tr>
  );
});

export default DelegationRow;
