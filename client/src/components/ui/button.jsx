import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-black tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ff5f3d] disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        default: "bg-[#071313] text-white hover:bg-[#ff5f3d]",
        outline: "border border-[#071313]/20 bg-white text-[#071313] hover:border-[#071313]",
        accent: "bg-[#d9ff38] text-[#071313] hover:bg-[#c5ed2e]",
      },
      size: {
        default: "px-5 py-2.5",
        lg: "min-h-14 px-6 py-4",
        sm: "min-h-9 px-3 py-2 text-xs",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

const Button = forwardRef(function Button(
  { className, variant, size, asChild = false, type = "button", ...props },
  ref
) {
  const Component = asChild ? Slot : "button";
  return (
    <Component
      ref={ref}
      type={asChild ? undefined : type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
});

export { Button, buttonVariants };
