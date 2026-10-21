import React, { useState } from "react";
import { Award, ShieldAlert, Camera, Users, Package, Settings, RotateCcw, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { DEFAULT_EXPENSE_CATEGORIES } from "./financeUtils";

const ICON_MAP = {
  Award,
  ShieldAlert,
  Camera,
  Users,
  Package,
  Settings,
};

function ExpenseAddForm({ catId, catTitle, onAdd }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!name.trim()) return;
    const parsedAmount = amount === "" ? 0 : Math.max(0, Number(amount) || 0);
    onAdd(catId, name.trim(), parsedAmount);
    setName("");
    setAmount("");
  };

  return (
    <form onSubmit={handleSubmit} className="pt-2.5 border-t border-slate-200 flex gap-2">
      <input
        type="text"
        placeholder={`Add new expense to ${catTitle}…`}
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label={`Add new expense to ${catTitle}`}
        className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] focus:outline-none"
      />
      <input
        type="number"
        placeholder="Amount (₹)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        aria-label="Amount in rupees"
        className="w-28 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] focus:outline-none font-mono font-bold text-slate-900 placeholder:text-slate-400"
      />
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-3.5 py-1.5 text-xs font-bold text-white transition shadow-xs shadow-rose-600/20"
      >
        <Plus className="h-4 w-4" /> Add
      </button>
    </form>
  );
}

export function FinanceExpensePanel({
  summary,
  categories = [],
  setCategories,
}) {
  const [expandedCat, setExpandedCat] = useState("prizes");

  const handleUpdateItem = (catId, itemId, field, val) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          items: cat.items.map((item) => {
            if (item.id !== itemId) return item;
            if (field === "amount") {
              return { ...item, amount: val === "" ? "" : Math.max(0, Number(val) || 0) };
            }
            return { ...item, [field]: val };
          }),
        };
      })
    );
  };

  const handleDeleteItem = (catId, itemId) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          items: cat.items.filter((item) => item.id !== itemId),
        };
      })
    );
  };

  const handleAddItem = (catId, name, amount) => {
    if (!name) return;
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          items: [
            ...cat.items,
            {
              id: `item-${Date.now()}`,
              label: name,
              amount,
            },
          ],
        };
      })
    );
  };

  const handleResetDefaults = () => {
    setCategories(DEFAULT_EXPENSE_CATEGORIES);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
      {/* HEADER & RESET BUTTON */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-3 w-3 rounded-full bg-rose-600" />
            <h3 className="font-bold text-base text-slate-900">Event Expense Breakdown</h3>
          </div>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Full itemized control: Add, edit, or remove expense items with real-time recalculation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-[#faf9f6] hover:bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition"
            title="Reset to standard cyclothon defaults"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Defaults
          </button>
          <span className="font-mono text-xs font-black text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-lg">
            Total: ₹{summary.grossExpenses.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* CATEGORIES ACCORDION LIST */}
      <div className="space-y-3.5">
        {categories.map((cat) => {
          const Icon = ICON_MAP[cat.icon] || Package;
          const isExpanded = expandedCat === cat.id;
          const catTotal = summary.categoryExpenses[cat.id] || 0;
          const percentOfBudget = summary.grossExpenses > 0 ? Math.round((catTotal / summary.grossExpenses) * 100) : 0;

          return (
            <div
              key={cat.id}
              className="rounded-xl border border-slate-200 overflow-hidden transition shadow-2xs"
            >
              {/* Category Header Row */}
              <button
                type="button"
                onClick={() => setExpandedCat(isExpanded ? null : cat.id)}
                aria-expanded={isExpanded}
                className="w-full flex items-center justify-between p-4 bg-[#faf9f6] hover:bg-slate-100/70 text-left transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-800 shadow-2xs">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{cat.title}</p>
                    <span className="text-xs text-slate-600 font-bold font-mono">
                      {cat.items.length} line items • {percentOfBudget}% of budget
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-black text-slate-900">
                    ₹{catTotal.toLocaleString("en-IN")}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-slate-700" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-700" />
                  )}
                </div>
              </button>

              {/* Items Table & Add Form */}
              {isExpanded && (
                <div className="p-4 bg-white border-t border-slate-200 space-y-3">
                  {cat.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2.5 text-xs py-1.5 border-b border-slate-100 last:border-b-0"
                    >
                      <input
                        type="text"
                        value={item.label || ""}
                        onChange={(e) => handleUpdateItem(cat.id, item.id, "label", e.target.value)}
                        aria-label={`Expense item name for ${item.label}`}
                        className="flex-1 rounded-lg border border-slate-200 hover:border-slate-300 bg-white focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] px-2.5 py-1 text-xs text-slate-900 font-bold transition focus:outline-none"
                      />
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-slate-600 text-xs font-bold">₹</span>
                        <input
                          type="number"
                          value={item.amount !== undefined && item.amount !== null ? item.amount : ""}
                          onChange={(e) => handleUpdateItem(cat.id, item.id, "amount", e.target.value)}
                          aria-label={`Expense amount in rupees for ${item.label}`}
                          className="w-28 rounded-lg border border-slate-200 hover:border-slate-300 bg-white px-2.5 py-1 text-right text-xs font-black text-slate-900 focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(cat.id, item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 transition rounded-md hover:bg-rose-50"
                          title="Delete line item"
                          aria-label={`Delete line item ${item.label}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Inline Add Item Form with Enter submission */}
                  <ExpenseAddForm
                    catId={cat.id}
                    catTitle={cat.title}
                    onAdd={handleAddItem}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
