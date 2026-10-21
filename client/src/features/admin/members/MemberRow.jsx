import React, { useCallback, memo } from "react";
import { Eye, EyeOff } from "lucide-react";
import { resolveApiAssetUrl } from "../../../api/http";

export const MemberRow = memo(function MemberRow({
  member,
  isSelected,
  onToggleSelect,
  onToggleVisibility,
}) {
  const handleToggle = useCallback(() => {
    onToggleSelect(member.id);
  }, [member.id, onToggleSelect]);

  const handleCheckboxClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

  const handleVisibilityClick = useCallback(
    (e) => {
      e.stopPropagation();
      onToggleVisibility(member);
    },
    [member, onToggleVisibility]
  );

  const initials = (member.name || "")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

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
          aria-label={`Select ${member.name}`}
          checked={isSelected}
          onChange={handleToggle}
          className="accent-[#0078d4] rounded cursor-pointer"
        />
      </td>

      {/* Photo + Name */}
      <td className="p-3.5">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            {member.image_url ? (
              <img
                src={resolveApiAssetUrl(member.image_url)}
                alt={member.name}
                className="h-10 w-10 rounded-xl object-cover border border-slate-200 shadow-xs"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  if (e.currentTarget.nextSibling) {
                    e.currentTarget.nextSibling.style.display = "grid";
                  }
                }}
              />
            ) : null}
            <div
              className={`h-10 w-10 rounded-xl bg-[#deecf9] border border-[#c7e0f4] text-[#005a9e] font-bold text-xs place-items-center shadow-xs ${
                member.image_url ? "hidden" : "grid"
              }`}
            >
              {initials || "NV"}
            </div>
          </div>

          <div className="min-w-0 max-w-[200px]">
            <p className="font-bold text-sm text-slate-900 truncate">
              {member.name}
            </p>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              {member.role || "Executive Committee"}
            </p>
          </div>
        </div>
      </td>

      {/* Role Pill */}
      <td className="p-3.5 whitespace-nowrap">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#deecf9] border border-[#c7e0f4] px-2.5 py-0.5 text-[11px] font-bold text-[#005a9e]">
          {member.role || "Committee Member"}
        </span>
      </td>

      {/* Display Order */}
      <td className="p-3.5 whitespace-nowrap">
        <span className="inline-flex items-center rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-0.5 font-mono text-[11px] font-bold text-slate-700">
          #{member.display_order ?? 0}
        </span>
      </td>

      {/* Quote / Bio */}
      <td className="p-3.5 max-w-sm">
        {member.message ? (
          <p className="text-xs text-slate-600 italic truncate" title={member.message}>
            “{member.message}”
          </p>
        ) : (
          <span className="text-slate-400 text-[11px] italic">No statement provided</span>
        )}
      </td>

      {/* Visibility Toggle */}
      <td className="p-3.5 text-center whitespace-nowrap" onClick={handleCheckboxClick}>
        <button
          type="button"
          onClick={handleVisibilityClick}
          className={`inline-flex items-center justify-center h-8 w-8 rounded-xl border transition-all ${
            member.visible
              ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 shadow-xs"
              : "bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
          }`}
          title={
            member.visible
              ? "Publicly Visible (Click to Hide)"
              : "Hidden from Website (Click to Publish)"
          }
          aria-label={
            member.visible
              ? "Hide member from website"
              : "Show member on website"
          }
        >
          {member.visible ? (
            <Eye className="h-4 w-4 text-emerald-600" />
          ) : (
            <EyeOff className="h-4 w-4 text-slate-400" />
          )}
        </button>
      </td>
    </tr>
  );
});

export default MemberRow;
