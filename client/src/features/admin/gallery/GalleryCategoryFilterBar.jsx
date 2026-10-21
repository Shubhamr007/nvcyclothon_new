import React, { memo } from "react";
import { CheckSquare, Square } from "lucide-react";

export const GALLERY_CATEGORIES = [
  "All",
  "Organizers",
  "Partners",
  "Riders",
  "Highlights",
  "Event",
];

export const CategoryPill = memo(function CategoryPill({ cat, count, isSelected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(cat)}
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold tracking-wide transition ${
        isSelected
          ? "bg-[#0078d4] text-white shadow-sm"
          : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
      }`}
    >
      <span>{cat}</span>
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
          isSelected ? "bg-[#005a9e] text-white" : "bg-slate-100 text-slate-600"
        }`}
      >
        {count}
      </span>
    </button>
  );
});

export const GalleryCategoryFilterBar = memo(function GalleryCategoryFilterBar({
  categories = GALLERY_CATEGORIES,
  categoryCounts = {},
  activeTab = "All",
  onSelectCategory,
  filteredCount = 0,
  isAllSelected = false,
  onToggleSelectAll,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <CategoryPill
            key={cat}
            cat={cat}
            count={categoryCounts[cat] || 0}
            isSelected={activeTab === cat}
            onSelect={onSelectCategory}
          />
        ))}
      </div>

      {filteredCount > 0 && (
        <button
          type="button"
          onClick={onToggleSelectAll}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          {isAllSelected ? (
            <>
              <CheckSquare className="h-4 w-4 text-[#0078d4]" />
              <span>Deselect All</span>
            </>
          ) : (
            <>
              <Square className="h-4 w-4 text-slate-400" />
              <span>Select All ({filteredCount})</span>
            </>
          )}
        </button>
      )}
    </div>
  );
});
