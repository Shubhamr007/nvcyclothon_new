import React from "react";

export const SECTION_LABELS = [
  ["experience", "Stats & Experience Highlights"],
  ["editions", "Editions Timeline"],
  ["about", "About / Mission"],
  ["members", "Organizing Committee Members"],
  ["routes", "Route Categories & Maps"],
  ["updates", "Event Updates"],
  ["gallery", "Photo Gallery"],
  ["why_sport", "Why Cycling Section"],
  ["faq", "Frequently Asked Questions (FAQ)"],
  ["community", "Community Wall"],
  ["contact", "Point of Contact + Map"],
  ["sponsors", "Association & Commercial Collaborations"],
];

export function SectionsVisibilitySection({ settings, toggleSection }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
      <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-3">
        Homepage Module Toggles
      </h3>
      <p className="text-xs text-slate-500">
        Select which content blocks appear publicly on the cyclothon landing page.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 pt-2">
        {SECTION_LABELS.map(([key, label]) => (
          <label
            key={key}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-[#faf9f6] p-3 text-xs font-semibold text-slate-800 cursor-pointer hover:border-[#0078d4]/40 hover:bg-white transition-colors"
          >
            <input
              type="checkbox"
              checked={settings.sections?.[key] !== false}
              onChange={() => toggleSection(key)}
              className="h-4 w-4 rounded accent-[#0078d4]"
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default SectionsVisibilitySection;
