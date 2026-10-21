import React from "react";
import { Badge } from "../../../components/ui/badge";
import { Tag, Sparkles, Minus, Plus, CheckCircle2 } from "lucide-react";
import { DEFAULT_RACE_CATEGORIES } from "../../../state/SiteSettingsContext";
import { CategoryCard } from "./CategoryCard";

export { CategoryCard } from "./CategoryCard";

export const CATEGORY_METADATA = [
  {
    key: "60 Km Road Challenge",
    distanceTag: "60 KM",
    color: "lime",
    accentBorder: "border-lime-300",
    pillClass: "bg-lime-500/10 text-lime-800 border-lime-300",
    tagline: "Pro Road Race for endurance cyclists",
  },
  {
    key: "30 Km MTB Challenge",
    distanceTag: "30 KM",
    color: "orange",
    accentBorder: "border-orange-300",
    pillClass: "bg-orange-500/10 text-orange-800 border-orange-300",
    tagline: "Rugged Mountain Trail Challenge",
  },
  {
    key: "10 Km Green Ride",
    distanceTag: "10 KM",
    color: "pink",
    accentBorder: "border-pink-300",
    pillClass: "bg-pink-500/10 text-pink-800 border-pink-300",
    tagline: "Community & Family Green Ride",
  },
  {
    key: "Kid-o-thon",
    distanceTag: "KIDS",
    color: "sky",
    accentBorder: "border-sky-300",
    pillClass: "bg-sky-500/10 text-sky-800 border-sky-300",
    tagline: "Monitored Closed-Circuit Children's Ride",
  },
];

import { EarlyBirdConfirmationModal } from "./EarlyBirdConfirmationModal";

export function RaceCategoriesSection({
  settings,
  updateField,
  updateRaceCategory,
  onToggleEarlyBird,
}) {
  const isEarlyBirdEnabled = settings.early_bird_enabled !== false;
  const earlyBirdLimit = settings.early_bird_limit || 50;

  const [modalState, setModalState] = React.useState({
    isOpen: false,
    targetState: false,
  });

  const handleToggleClick = () => {
    setModalState({
      isOpen: true,
      targetState: !isEarlyBirdEnabled,
    });
  };

  const handleConfirmToggle = () => {
    const newState = modalState.targetState;
    setModalState({ isOpen: false, targetState: newState });
    if (onToggleEarlyBird) {
      onToggleEarlyBird(newState);
    } else {
      updateField("early_bird_enabled", newState);
    }
  };

  return (
    <div className="space-y-6">
      {/* EARLY-BIRD CONFIGURATION & TOGGLE CARD */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`grid h-10 w-10 place-items-center rounded-xl ${
                isEarlyBirdEnabled
                  ? "bg-amber-50 text-amber-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Early-Bird Pricing Control
                </h3>
                <Badge
                  variant="outline"
                  className={
                    isEarlyBirdEnabled
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold px-2 py-0.5 text-[11px]"
                      : "bg-slate-100 text-slate-700 border-slate-300 font-bold px-2 py-0.5 text-[11px]"
                  }
                >
                  {isEarlyBirdEnabled ? "● ACTIVE" : "○ INACTIVE"}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEarlyBirdEnabled
                  ? `Early-Bird rates apply for the first ${earlyBirdLimit} registrations across categories.`
                  : "Early-Bird pricing is disabled. Regular pricing applies to all new registrations."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleToggleClick}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
                isEarlyBirdEnabled
                  ? "border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              {isEarlyBirdEnabled ? "Disable Early Bird" : "Enable Early Bird"}
            </button>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-[1fr_2fr] items-center pt-1">
          <div className={isEarlyBirdEnabled ? "" : "opacity-60"}>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Early-Bird Quota Limit
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!isEarlyBirdEnabled}
                onClick={() =>
                  updateField(
                    "early_bird_limit",
                    Math.max(0, (Number(settings.early_bird_limit) || 50) - 5)
                  )
                }
                className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition disabled:opacity-50"
                title="Decrease by 5"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                min="0"
                max="10000"
                disabled={!isEarlyBirdEnabled}
                value={settings.early_bird_limit ?? 50}
                onChange={(e) =>
                  updateField(
                    "early_bird_limit",
                    Math.max(0, Number(e.target.value) || 0)
                  )
                }
                className="h-10 w-28 rounded-xl border border-slate-300 bg-white text-center text-sm font-bold text-slate-900 focus:border-[#0078d4] focus:outline-none disabled:bg-slate-100"
              />
              <button
                type="button"
                disabled={!isEarlyBirdEnabled}
                onClick={() =>
                  updateField(
                    "early_bird_limit",
                    (Number(settings.early_bird_limit) || 50) + 5
                  )
                }
                className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition disabled:opacity-50"
                title="Increase by 5"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <span className="block text-[11px] text-slate-400 mt-1">
              Registrations across all categories
            </span>
          </div>

          <div
            className={`rounded-xl border p-4 text-xs space-y-1 ${
              isEarlyBirdEnabled
                ? "border-amber-200 bg-amber-50/60 text-amber-900"
                : "border-slate-200 bg-slate-50 text-slate-700"
            }`}
          >
            <p className="font-bold flex items-center gap-1.5">
              <Sparkles
                className={`h-4 w-4 shrink-0 ${
                  isEarlyBirdEnabled ? "text-amber-600" : "text-slate-500"
                }`}
              />
              {isEarlyBirdEnabled
                ? "Active Threshold Transition"
                : "Early Bird Pricing Inactive"}
            </p>
            <p className="leading-relaxed">
              {isEarlyBirdEnabled ? (
                <>
                  The first <b>{earlyBirdLimit}</b> paid riders will receive the
                  discounted early-bird rate. Once this quota is exhausted, new
                  riders will automatically be charged the regular registration
                  fee.
                </>
              ) : (
                <>
                  Early-Bird pricing is currently disabled. All prospective
                  riders will see and be charged the standard <b>Regular fee</b> at
                  checkout.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      <EarlyBirdConfirmationModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmToggle}
        targetState={modalState.targetState}
        quota={earlyBirdLimit}
      />

      {/* RACE CATEGORIES CARDS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Category Configurations & Age Restrictions
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Adjust rider minimum/maximum age limits, fee tiers, and rider capacity for each individual category.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {CATEGORY_METADATA.map((meta) => {
            const cat = settings.race_categories?.[meta.key] || DEFAULT_RACE_CATEGORIES[meta.key] || {};
            return (
              <CategoryCard
                key={meta.key}
                meta={meta}
                cat={cat}
                onUpdateCategory={updateRaceCategory}
                earlyBirdEnabled={isEarlyBirdEnabled}
              />
            );
          })}
        </div>
      </div>

      {/* LIVE SYNC NOTE */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900 flex items-start gap-3">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Instant Public Website Propagation</p>
          <p className="text-emerald-700 mt-0.5">
            Publishing updates immediately changes age restriction enforcement, card tags on the homepage routes section, and registration fee calculation on the checkout gateway with zero application downtime.
          </p>
        </div>
      </div>
    </div>
  );
}

export default RaceCategoriesSection;
