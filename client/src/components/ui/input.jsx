import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const Input = forwardRef(function Input({ className, type = "text", ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "mt-2 min-h-11 w-full border-b-2 border-[#071313]/25 bg-transparent py-2 text-base font-medium normal-case outline-none transition focus:border-[#ff5f3d] disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
});

export { Input };
