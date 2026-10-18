"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

export type TooltipVariant = "default" | "emerald" | "blue" | "rose" | "amber" | "gold";

interface ActionTooltipProps {
  label: string;
  children: React.ReactNode;
  variant?: TooltipVariant;
  side?: "top" | "bottom" | "right" | "left";
  sideOffset?: number;
}

export function ActionTooltip({
  label,
  children,
  variant = "default",
  side = "top",
  sideOffset = 6,
}: ActionTooltipProps) {
  const variantStyles: Record<TooltipVariant, string> = {
    default: "bg-zinc-900 text-white border-zinc-700",
    emerald: "bg-emerald-950 text-emerald-100 border-emerald-700",
    blue: "bg-blue-950 text-blue-100 border-blue-700",
    rose: "bg-rose-950 text-rose-100 border-rose-700",
    amber: "bg-amber-950 text-amber-100 border-amber-700",
    gold: "bg-brand-charcoal text-brand-gold border-brand-gold/40 shadow-brand-gold/10",
  };

  return (
    <TooltipPrimitive.Provider delayDuration={150}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={sideOffset}
            className={cn(
              "z-50 overflow-hidden rounded-lg border px-2.5 py-1 text-[11px] font-medium shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 select-none",
              variantStyles[variant]
            )}
          >
            {label}
            <TooltipPrimitive.Arrow className="fill-current" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
