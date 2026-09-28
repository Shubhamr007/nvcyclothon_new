import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-wider uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#ff5f3d] text-white shadow hover:bg-[#ff5f3d]/80",
        secondary:
          "border-transparent bg-white/10 text-white hover:bg-white/20",
        destructive:
          "border-transparent bg-red-600 text-white shadow hover:bg-red-700",
        outline:
          "border-white/20 text-white hover:bg-white/10",
        accent:
          "border-[#d9ff38]/40 bg-[#d9ff38]/15 text-[#d9ff38] shadow-[0_0_12px_rgba(217,255,56,0.25)]",
        blaze:
          "border-[#ff5f3d]/40 bg-[#ff5f3d]/15 text-[#ff5f3d] shadow-[0_0_12px_rgba(255,95,61,0.25)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
