import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-neutral-border bg-warm-white px-3.5 py-2 text-xs sm:text-sm text-primary-text transition-colors file:border-0 file:bg-transparent file:text-xs file:font-semibold placeholder:text-muted-text focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold focus:border-brand-gold disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
