import React, { memo } from "react";
import { Camera } from "lucide-react";
import { GalleryCard } from "./GalleryCard";

export const GalleryGrid = memo(function GalleryGrid({
  items = [],
  activeTab = "All",
  selectedIds = [],
  onToggleSelect,
  onEdit,
  onDelete,
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
        <Camera className="mx-auto h-10 w-10 text-slate-400" />
        <h3 className="mt-3 text-sm font-bold text-slate-900">
          No photographs in “{activeTab}”
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Click “Upload Multiple Photos” above to batch upload images for this category.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((item) => (
        <GalleryCard
          key={item.id}
          item={item}
          isSelected={selectedIds.includes(item.id)}
          onToggleSelect={onToggleSelect}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
});
