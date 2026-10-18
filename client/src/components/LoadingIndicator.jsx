import React from "react";
import nvCyclothonLogo from "../../assets/NV_Cyclothon_logo.png";
import { LoadingScreen } from "./LoadingScreen";

export { LoadingScreen };

export function LoadingIndicator({
  label = "Loading",
  className = "",
  fullScreen = false,
  inline = false,
  size = "default",
}) {
  if (fullScreen) {
    return <LoadingScreen label={label} className={className} />;
  }

  const isInline =
    inline ||
    size === "inline" ||
    size === "sm" ||
    className.includes("text-white") ||
    className.includes("text-[#071313]");

  if (isInline) {
    return (
      <span
        className={`inline-flex items-center gap-2 font-medium tracking-wide ${className}`.trim()}
        role="status"
        aria-live="polite"
        aria-label={label}
      >
        <span
          className="relative flex h-5 w-5 items-center justify-center shrink-0"
          aria-hidden="true"
        >
          {/* Subtle spinning ring accent */}
          <span className="absolute inset-0 rounded-full border-2 border-current border-t-transparent animate-spin opacity-80" />
          {/* Centered official website logo */}
          <img
            src={nvCyclothonLogo}
            alt=""
            className="h-3 w-3 object-contain rounded-full"
          />
        </span>
        {label && <span>{label}</span>}
        <span className="sr-only">{label}</span>
      </span>
    );
  }

  // Standalone / Tab Loading display — prominently showcases the official website logo
  return (
    <div
      className={`flex flex-col items-center justify-center py-10 px-4 text-center select-none ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="relative flex items-center justify-center">
        {/* Subtle glowing ambient pulse behind logo */}
        <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-[#ff5f3d]/25 to-[#d9ff38]/25 blur-lg animate-pulse" />

        {/* Animated athletic dashed velocity ring */}
        <div className="absolute -inset-3 rounded-full border-2 border-dashed border-[#ff5f3d]/40 animate-[spin_8s_linear_infinite]" />

        {/* Outer subtle radar ping */}
        <div className="absolute -inset-1 rounded-full border border-[#d9ff38]/50 animate-ping opacity-25" />

        {/* Crisp branded white badge for maximum visibility & contrast */}
        <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-white p-2.5 shadow-xl shadow-slate-900/10 ring-1 ring-slate-900/10 transition-transform duration-300 hover:scale-105">
          <img
            src={nvCyclothonLogo}
            alt="NV Cyclothon"
            className="h-full w-full object-contain"
            loading="eager"
          />
        </div>
      </div>

      {label && (
        <div className="mt-4 flex items-center gap-2 text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-700 dark:text-slate-200">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff5f3d] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ff5f3d]" />
          </span>
          <span>{label}</span>
        </div>
      )}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export default LoadingIndicator;
