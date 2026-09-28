import React from "react";
import { LoadingScreen } from "./LoadingScreen";

export { LoadingScreen };

export function LoadingIndicator({
  label = "Loading",
  className = "",
  fullScreen = false,
}) {
  if (fullScreen) {
    return <LoadingScreen label={label} className={className} />;
  }

  return (
    <span
      className={`inline-flex items-center gap-2.5 font-medium tracking-wide ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <span
        className="relative flex h-5 w-5 items-center justify-center shrink-0"
        aria-hidden="true"
      >
        {/* Energetic spinning bicycle wheel with spokes & neon accent */}
        <svg
          className="h-5 w-5 animate-spin text-[#d9ff38]"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray="28 14"
            className="opacity-90"
          />
          <circle
            cx="12"
            cy="12"
            r="4"
            stroke="#ff5f3d"
            strokeWidth="2"
            strokeDasharray="8 6"
          />
        </svg>
      </span>
      {label && <span>{label}</span>}
      <span className="sr-only">{label}</span>
    </span>
  );
}

export default LoadingIndicator;
