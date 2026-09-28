import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold tracking-wider uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#ff5f3d] text-white shadow hover:bg-[#ff5f3d]/80",
        secondary:
          "border-black/10 bg-black/5 text-[#071313] hover:bg-black/10",
        destructive:
          "border-transparent bg-red-600 text-white shadow hover:bg-red-700",
        outline:
          "border-black/20 text-[#071313] hover:bg-black/5",
        accent:
          "border-[#d9ff38]/40 bg-[#d9ff38]/20 text-[#20342d] dark:text-[#d9ff38] font-black",
        blaze:
          "border-[#ff5f3d]/40 bg-[#ff5f3d]/15 text-[#a53b22] font-black",
        success:
          "border-emerald-300 bg-emerald-100 text-emerald-950 font-bold",
        successSolid:
          "border-transparent bg-emerald-600 text-white shadow font-black",
        warning:
          "border-amber-300 bg-amber-100 text-amber-950 font-bold",
        info:
          "border-blue-300 bg-blue-100 text-blue-950 font-bold",
        danger:
          "border-rose-300 bg-rose-100 text-rose-950 font-bold",
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
