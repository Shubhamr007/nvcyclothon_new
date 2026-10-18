import React, { memo } from "react";
import { Edit2, Trash2 } from "lucide-react";
import { resolveApiAssetUrl } from "../../../api/http";

export const CATEGORY_STYLES = {
  Organizers: "bg-amber-50 text-amber-800 border-amber-200/80",
  Partners: "bg-sky-50 text-sky-800 border-sky-200/80",
  Riders: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
  Highlights: "bg-indigo-50 text-indigo-800 border-indigo-200/80",
  Event: "bg-slate-100 text-slate-800 border-slate-200",
};

export const GalleryCard = memo(function GalleryCard({
  item,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
}) {
  const categoryBadgeStyle =
    CATEGORY_STYLES[item.category] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md ${
        isSelected
          ? "border-blue-600 ring-2 ring-blue-600/30"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      {/* PHOTO THUMBNAIL */}
      <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
        <img
          src={resolveApiAssetUrl(item.image_url)}
          alt={item.title || "Photo"}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* CHECKBOX */}
        <label
          className="absolute left-2.5 top-2.5 z-10 grid h-6 w-6 place-items-center rounded-md bg-white/90 shadow-sm cursor-pointer hover:bg-white"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(item.id)}
            className="h-3.5 w-3.5 rounded accent-slate-900 cursor-pointer"
          />
        </label>

        {/* CATEGORY BADGE */}
        <span
          className={`absolute right-2.5 top-2.5 rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm ${categoryBadgeStyle}`}
        >
          {item.category || "Event"}
        </span>
      </div>

      {/* DETAILS & ACTIONS */}
      <div className="p-3">
        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
          {item.title || "Untitled Photograph"}
        </h4>
        {item.caption && (
          <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-1">
            {item.caption}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Edit2 className="h-3 w-3" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
});

export default GalleryCard;
