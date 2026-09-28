import * as React from "react";
import { cn } from "../../lib/utils";

const Progress = React.forwardRef(
  ({ className, value = 0, indicatorClassName, ...props }, ref) => {
    const clampedValue = Math.min(100, Math.max(0, value || 0));

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clampedValue)}
        className={cn(
          "relative h-3 w-full overflow-hidden rounded-full bg-white/10 backdrop-blur-sm",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "h-full w-full flex-1 transition-all duration-300 ease-out",
            indicatorClassName ||
              "bg-gradient-to-r from-[#ff5f3d] via-[#e0b04a] to-[#d9ff38] shadow-[0_0_16px_rgba(217,255,56,0.6)]"
          )}
          style={{ transform: `translateX(-${100 - clampedValue}%)` }}
        />
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress };
