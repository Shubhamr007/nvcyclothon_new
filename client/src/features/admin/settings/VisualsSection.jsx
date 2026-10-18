import React from "react";

export function VisualsSection({ settings, updateField }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-3">
          Hero Carousel Images
        </h3>
        <p className="text-xs text-slate-500 mt-2 mb-3">
          Provide up to 5 HTTPS image URLs (one per line) for the homepage hero carousel.
        </p>
        <textarea
          rows={4}
          value={(settings.hero_images || []).join("\n")}
          onChange={(e) =>
            updateField(
              "hero_images",
              e.target.value.split("\n").map((url) => url.trim()).filter(Boolean)
            )
          }
          className="w-full rounded-xl border border-slate-300 p-3 text-xs font-mono text-slate-900 focus:border-slate-900 focus:outline-none"
          placeholder="https://..."
        />
      </div>

      <div className="border-t border-slate-200 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-slate-900">Featured Spotlight Section</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(settings.feature_section?.enabled)}
              onChange={(e) =>
                updateField("feature_section", {
                  ...settings.feature_section,
                  enabled: e.target.checked,
                })
              }
              className="h-4 w-4 rounded accent-slate-900"
            />
            <span className="text-xs font-semibold text-slate-800">Enable Spotlight</span>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-1">
              Eyebrow
            </label>
            <input
              value={settings.feature_section?.eyebrow || ""}
              onChange={(e) =>
                updateField("feature_section", {
                  ...settings.feature_section,
                  eyebrow: e.target.value,
                })
              }
              className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-1">
              Image URL
            </label>
            <input
              type="url"
              value={settings.feature_section?.image_url || ""}
              onChange={(e) =>
                updateField("feature_section", {
                  ...settings.feature_section,
                  image_url: e.target.value,
                })
              }
              className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-1">
              Title
            </label>
            <input
              value={settings.feature_section?.title || ""}
              onChange={(e) =>
                updateField("feature_section", {
                  ...settings.feature_section,
                  title: e.target.value,
                })
              }
              className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-1">
              Body Content
            </label>
            <textarea
              rows={3}
              value={settings.feature_section?.body || ""}
              onChange={(e) =>
                updateField("feature_section", {
                  ...settings.feature_section,
                  body: e.target.value,
                })
              }
              className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default VisualsSection;
