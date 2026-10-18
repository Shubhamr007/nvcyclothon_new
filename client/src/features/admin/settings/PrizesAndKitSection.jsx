import React, { useCallback } from "react";
import { Button } from "../../../components/ui/button";
import { Plus, Trash2 } from "lucide-react";

const PrizeItemRow = React.memo(function PrizeItemRow({
  prize,
  index,
  onUpdate,
  onDelete,
}) {
  const handleLabelChange = useCallback(
    (e) => {
      onUpdate(index, "label", e.target.value);
    },
    [index, onUpdate]
  );

  const handleAmountChange = useCallback(
    (e) => {
      onUpdate(index, "amount", e.target.value);
    },
    [index, onUpdate]
  );

  const handleDetailChange = useCallback(
    (e) => {
      onUpdate(index, "detail", e.target.value);
    },
    [index, onUpdate]
  );

  const handleDelete = useCallback(() => {
    onDelete(index);
  }, [index, onDelete]);

  return (
    <div className="grid gap-2 rounded-xl bg-slate-50 border border-slate-200 p-3 sm:grid-cols-[1.5fr_1fr_1fr_auto]">
      <input
        value={prize.label || ""}
        onChange={handleLabelChange}
        placeholder="Category / Rank (e.g. 60KM Winner)"
        className="rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
      />
      <input
        value={prize.amount || ""}
        onChange={handleAmountChange}
        placeholder="Amount (e.g. ₹25,000)"
        className="rounded-lg border border-slate-300 bg-white p-2 text-xs font-mono font-bold text-slate-900 focus:border-slate-900 focus:outline-none"
      />
      <input
        value={prize.detail || ""}
        onChange={handleDetailChange}
        placeholder="Optional notes"
        className="rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleDelete}
        className="border-slate-300 text-rose-600 hover:bg-rose-50 text-xs px-2.5 h-8"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
});

export function PrizesAndKitSection({ settings, updateField }) {
  const updatePrizePool = useCallback(
    (key, value) => {
      updateField("prize_pool", { ...settings.prize_pool, [key]: value });
    },
    [settings.prize_pool, updateField]
  );

  const updatePrize = useCallback(
    (index, key, value) => {
      const prizes = [...(settings.prize_pool?.prizes || [])];
      prizes[index] = { ...prizes[index], [key]: value };
      updatePrizePool("prizes", prizes);
    },
    [settings.prize_pool?.prizes, updatePrizePool]
  );

  const deletePrize = useCallback(
    (index) => {
      const prizes = settings.prize_pool?.prizes || [];
      updatePrizePool("prizes", prizes.filter((_, pIdx) => pIdx !== index));
    },
    [settings.prize_pool?.prizes, updatePrizePool]
  );

  const updateParticipantKit = useCallback(
    (key, value) => {
      updateField("participant_kit", { ...settings.participant_kit, [key]: value });
    },
    [settings.participant_kit, updateField]
  );

  const handleAddPrize = useCallback(() => {
    updatePrizePool("prizes", [
      ...(settings.prize_pool?.prizes || []),
      { label: "", amount: "", detail: "" },
    ]);
  }, [settings.prize_pool?.prizes, updatePrizePool]);

  return (
    <div className="space-y-6">
      {/* PRIZE POOL CARD */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-base font-bold text-slate-900">Prize Pool</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(settings.prize_pool?.enabled)}
              onChange={(e) => updatePrizePool("enabled", e.target.checked)}
              className="h-4 w-4 rounded accent-slate-900"
            />
            <span className="text-xs font-semibold text-slate-800">Show Prize Pool</span>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-1">
              Eyebrow
            </label>
            <input
              value={settings.prize_pool?.eyebrow || ""}
              onChange={(e) => updatePrizePool("eyebrow", e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-1">
              Total Prize Amount
            </label>
            <input
              value={settings.prize_pool?.total || ""}
              onChange={(e) => updatePrizePool("total", e.target.value)}
              placeholder="₹1,00,000"
              className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-1">
              Heading Title
            </label>
            <input
              value={settings.prize_pool?.title || ""}
              onChange={(e) => updatePrizePool("title", e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-1">
              Introduction Description
            </label>
            <textarea
              rows={2}
              value={settings.prize_pool?.body || ""}
              onChange={(e) => updatePrizePool("body", e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>
        </div>

        {/* INDIVIDUAL PRIZES */}
        <div className="space-y-3 pt-2">
          <span className="block text-xs font-bold uppercase tracking-wide text-slate-800">
            Individual Prize Breakdown
          </span>
          {(settings.prize_pool?.prizes || []).map((prize, idx) => (
            <PrizeItemRow
              key={idx}
              prize={prize}
              index={idx}
              onUpdate={updatePrize}
              onDelete={deletePrize}
            />
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddPrize}
            className="border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5 mr-1 text-slate-600" /> Add Prize Entry
          </Button>
        </div>
      </div>

      {/* RIDER KIT CARD */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-base font-bold text-slate-900">Official Rider Kit</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(settings.participant_kit?.enabled)}
              onChange={(e) => updateParticipantKit("enabled", e.target.checked)}
              className="h-4 w-4 rounded accent-slate-900"
            />
            <span className="text-xs font-semibold text-slate-800">Show Rider Kit</span>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-1">
              Eyebrow
            </label>
            <input
              value={settings.participant_kit?.eyebrow || ""}
              onChange={(e) => updateParticipantKit("eyebrow", e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-1">
              Section Title
            </label>
            <input
              value={settings.participant_kit?.title || ""}
              onChange={(e) => updateParticipantKit("title", e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600 mb-1">
              Kit Items (one per line)
            </label>
            <textarea
              rows={4}
              value={(settings.participant_kit?.items || []).join("\n")}
              onChange={(e) =>
                updateParticipantKit(
                  "items",
                  e.target.value.split("\n").map((i) => i.trim()).filter(Boolean)
                )
              }
              className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
              placeholder="Dry-fit Athletic Jersey&#10;Finisher Medal&#10;Timing Chip"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrizesAndKitSection;
