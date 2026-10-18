import React from "react";

export function SemiCircleGauge({
  value = 0,
  target = 100,
  label = "Break-Even Meter",
  subLabel = "Progress toward 0 loss",
  formatValue = (v) => `${v}%`,
}) {
  const radius = 70;
  const arcLength = Math.PI * radius;
  const clampedPercent = Math.min(Math.max((value / (target || 1)) * 100, 0), 100);
  const strokeDashoffset = arcLength - (clampedPercent / 100) * arcLength;

  // Needle angle: 180 deg (left) to 0 deg (right)
  const angle = 180 - (clampedPercent / 100) * 180;
  const radians = (angle * Math.PI) / 180;
  const needleLength = 52;
  const needleX = 100 + needleLength * Math.cos(radians);
  const needleY = 100 - needleLength * Math.sin(radians);

  return (
    <div
      className="flex flex-col items-center justify-center p-5 rounded-2xl border border-slate-200/90 bg-white text-center shadow-xs"
      role="meter"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={target}
    >
      <div className="relative w-48 h-28 sm:w-56 sm:h-32 shrink-0">
        <svg viewBox="0 0 200 115" className="w-full h-full overflow-visible" role="img" aria-hidden="true">
          <defs>
            <linearGradient id="gaugeGradientAccessible" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e11d48" />
              <stop offset="50%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>

          {/* Background Track (Grey) */}
          <path
            d="M 30 100 A 70 70 0 0 1 170 100"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="18"
            strokeLinecap="round"
          />

          {/* Gradient Active Arc */}
          <path
            d="M 30 100 A 70 70 0 0 1 170 100"
            fill="none"
            stroke="url(#gaugeGradientAccessible)"
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />

          {/* Pivot Center Point */}
          <circle cx="100" cy="100" r="6" fill="#020617" />

          {/* Needle Pointer */}
          <line
            x1="100"
            y1="100"
            x2={needleX}
            y2={needleY}
            stroke="#020617"
            strokeWidth="4"
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
      </div>

      {/* METRIC TEXT (HIGH CONTRAST) */}
      <div className="mt-1">
        <p className="text-2xl font-black text-slate-950 font-mono">
          {formatValue(value)}
        </p>
        <p className="text-xs font-black text-slate-900 font-mono mt-0.5">{label}</p>
        <p className="text-xs font-bold text-slate-700 mt-0.5">{subLabel}</p>
      </div>

      {/* 3 ZONES FOOTER BADGES */}
      <div className="mt-3.5 flex items-center justify-center gap-3.5 text-xs font-bold font-mono">
        <span className="flex items-center gap-1.5 text-rose-900">
          <span className="h-2 w-2 rounded-full bg-rose-600" />
          Deficit
        </span>
        <span className="flex items-center gap-1.5 text-amber-950">
          <span className="h-2 w-2 rounded-full bg-amber-600" />
          Break-Even
        </span>
        <span className="flex items-center gap-1.5 text-emerald-950">
          <span className="h-2 w-2 rounded-full bg-emerald-600" />
          Surplus
        </span>
      </div>
    </div>
  );
}
