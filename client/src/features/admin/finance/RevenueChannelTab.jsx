import React, { useState } from "react";
import { Plus, Trash2, CheckCircle2, Clock } from "lucide-react";

export function RevenueChannelTab({
  items = [],
  onUpdateItem,
  onDeleteItem,
  onAddItem,
  themeColor = "blue",
  placeholder = "New partner name…",
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  const handleAdd = (e) => {
    e?.preventDefault();
    if (!name.trim()) return;
    const parsedAmount = amount === "" ? 0 : Math.max(0, Number(amount) || 0);
    onAddItem(name.trim(), parsedAmount);
    setName("");
    setAmount("");
  };

  const ringFocusClass =
    themeColor === "purple"
      ? "focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
      : themeColor === "amber"
      ? "focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
      : "focus:border-blue-600 focus:ring-1 focus:ring-blue-600";

  const buttonBgClass =
    themeColor === "purple"
      ? "bg-purple-600 hover:bg-purple-700 shadow-sm shadow-purple-600/20"
      : themeColor === "amber"
      ? "bg-amber-600 hover:bg-amber-700 shadow-sm shadow-amber-600/20"
      : "bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/20";

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
          No entries yet. Add one using the form below.
        </div>
      )}

      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-2xs"
        >
          <button
            type="button"
            onClick={() => onUpdateItem(item.id, "confirmed", !item.confirmed)}
            title={item.confirmed ? "Confirmed partner (click to mark tentative)" : "Tentative (click to confirm)"}
            aria-label={item.confirmed ? "Confirmed partner (click to mark tentative)" : "Tentative (click to confirm)"}
            className="shrink-0 p-1 rounded-md hover:bg-slate-100 transition"
          >
            {item.confirmed ? (
              <CheckCircle2
                className={`h-4 w-4 ${
                  themeColor === "purple"
                    ? "text-purple-600"
                    : themeColor === "amber"
                    ? "text-amber-600"
                    : "text-emerald-600"
                }`}
              />
            ) : (
              <Clock className="h-4 w-4 text-amber-500" />
            )}
          </button>
          <input
            type="text"
            value={item.name || ""}
            onChange={(e) => onUpdateItem(item.id, "name", e.target.value)}
            aria-label={`Partner name for ${item.name}`}
            className={`flex-1 rounded-lg border border-slate-200 hover:border-slate-300 bg-white ${ringFocusClass} px-2.5 py-1 text-xs text-slate-900 font-bold focus:outline-none`}
          />
          <div className="flex items-center gap-2 font-mono">
            <span className="text-slate-600 font-extrabold text-xs">₹</span>
            <input
              type="number"
              value={item.amount !== undefined && item.amount !== null ? item.amount : ""}
              onChange={(e) =>
                onUpdateItem(
                  item.id,
                  "amount",
                  e.target.value === "" ? "" : Math.max(0, Number(e.target.value) || 0)
                )
              }
              aria-label={`Amount in rupees for ${item.name}`}
              className={`w-28 rounded-lg border border-slate-200 hover:border-slate-300 bg-white px-2.5 py-1 text-right text-xs font-black text-slate-900 ${ringFocusClass} focus:outline-none`}
            />
            <button
              type="button"
              onClick={() => onDeleteItem(item.id)}
              className="text-slate-400 hover:text-rose-600 p-1.5 transition rounded-md hover:bg-rose-50"
              title="Remove entry"
              aria-label={`Remove entry for ${item.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      <form onSubmit={handleAdd} className="flex gap-2 pt-1.5">
        <input
          type="text"
          placeholder={placeholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label={placeholder}
          className={`flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 font-medium ${ringFocusClass} focus:outline-none`}
        />
        <input
          type="number"
          placeholder="Amount (₹)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-label="Amount in rupees"
          className={`w-28 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 ${ringFocusClass} focus:outline-none`}
        />
        <button
          type="submit"
          className={`inline-flex items-center gap-1.5 rounded-xl ${buttonBgClass} px-4 py-1.5 text-xs font-bold text-white transition shadow-xs`}
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </form>
    </div>
  );
}
