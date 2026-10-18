import React, { useState } from "react";

export function DonutChart({
  categories = [],
  totalAmount = 0,
  title = "Expense Distribution",
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const safeTotal = totalAmount > 0 ? totalAmount : 1;

  // Compute strokeDasharray & strokeDashoffset for each slice
  let accumulatedPercent = 0;
  const slices = categories.map((cat, idx) => {
    const amount = Number(cat.amount) || 0;
    const percent = amount / safeTotal;
    const dashLength = percent * circumference;
    const dashSpace = circumference - dashLength;
    const offset = -accumulatedPercent * circumference;
    accumulatedPercent += percent;

    return {
      ...cat,
      percent: Math.round(percent * 100),
      dashLength,
      dashSpace,
      offset,
      color: cat.color || ["#d97706", "#2563eb", "#9333ea", "#059669", "#e11d48", "#475569"][idx % 6],
    };
  });

  const activeSlice = hoveredIndex !== null ? slices[hoveredIndex] : null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs">
      {/* SVG DONUT WHEEL */}
      <div className="relative w-48 h-48 sm:w-52 sm:h-52 shrink-0">
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full -rotate-90 transition-transform duration-300"
          aria-label={title}
          role="img"
        >
          {/* Background Track */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="24"
          />

          {/* Slices */}
          {slices.map((slice, idx) => (
            <circle
              key={slice.id || idx}
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={hoveredIndex === idx ? "28" : "24"}
              strokeDasharray={`${slice.dashLength} ${slice.dashSpace}`}
              strokeDashoffset={slice.offset}
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              onFocus={() => setHoveredIndex(idx)}
              onBlur={() => setHoveredIndex(null)}
              tabIndex={0}
              role="button"
              aria-label={`${slice.title}: ₹${Number(slice.amount).toLocaleString("en-IN")} (${slice.percent}%)`}
              style={{ transformOrigin: "center" }}
            />
          ))}
        </svg>

        {/* CENTER METRIC TEXT (HIGH CONTRAST) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          {activeSlice ? (
            <>
              <span className="text-xs font-black tracking-wider text-slate-800 uppercase font-mono truncate max-w-[120px]">
                {activeSlice.title}
              </span>
              <p className="text-base font-black text-slate-950 font-mono mt-0.5">
                ₹{Number(activeSlice.amount).toLocaleString("en-IN")}
              </p>
              <span className="text-xs font-bold text-slate-900 bg-slate-200 px-2 py-0.5 rounded mt-0.5 font-mono">
                {activeSlice.percent}% of budget
              </span>
            </>
          ) : (
            <>
              <span className="text-xs font-extrabold tracking-wider text-slate-800 uppercase font-mono">
                TOTAL OUTFLOW
              </span>
              <p className="text-lg font-black text-slate-950 font-mono mt-0.5">
                ₹{totalAmount.toLocaleString("en-IN")}
              </p>
              <span className="text-xs text-slate-700 font-bold font-mono">6 Categories</span>
            </>
          )}
        </div>
      </div>

      {/* COLOR-CODED LEGEND */}
      <div className="w-full flex-1 space-y-2.5">
        <p className="text-xs font-black text-slate-950 uppercase tracking-wider font-mono border-b-2 border-slate-200 pb-1.5">
          {title}
        </p>
        <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
          {slices.map((item, idx) => (
            <div
              key={item.id || idx}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              onFocus={() => setHoveredIndex(idx)}
              onBlur={() => setHoveredIndex(null)}
              tabIndex={0}
              role="button"
              aria-label={`${item.title}: ₹${Number(item.amount).toLocaleString("en-IN")}, ${item.percent} percent of budget`}
              className={`flex items-center justify-between text-xs p-2 rounded-lg cursor-pointer transition focus-visible:outline-2 focus-visible:outline-slate-800 ${
                hoveredIndex === idx ? "bg-slate-200 text-slate-950 font-bold shadow-2xs" : "text-slate-800 hover:bg-slate-100 font-medium"
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <span
                  className="h-3 w-3 rounded-full shrink-0 border border-slate-400"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate">{item.title}</span>
              </div>
              <div className="flex items-center gap-2 font-mono shrink-0 ml-2">
                <span className="font-extrabold text-slate-950">₹{Number(item.amount).toLocaleString("en-IN")}</span>
                <span className="text-xs font-bold text-slate-700">({item.percent}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
