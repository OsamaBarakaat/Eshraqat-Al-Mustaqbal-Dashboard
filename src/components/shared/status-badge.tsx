import React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "success" | "warning" | "destructive" | "info" | "neutral" | "gold";

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
  size?: "sm" | "md";
  dot?: boolean;
}

export function StatusBadge({
  label,
  variant = "neutral",
  className,
  size = "md",
  dot = true,
}: StatusBadgeProps) {
  const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string; dot: string }> = {
    success: {
      bg: "bg-emerald-50",
      text: "text-emerald-800",
      border: "border-emerald-200",
      dot: "bg-emerald-500",
    },
    warning: {
      bg: "bg-amber-50",
      text: "text-amber-800",
      border: "border-amber-200",
      dot: "bg-amber-500",
    },
    destructive: {
      bg: "bg-rose-50",
      text: "text-rose-800",
      border: "border-rose-200",
      dot: "bg-rose-500",
    },
    info: {
      bg: "bg-blue-50",
      text: "text-blue-800",
      border: "border-blue-200",
      dot: "bg-blue-500",
    },
    neutral: {
      bg: "bg-zinc-100",
      text: "text-zinc-700",
      border: "border-zinc-200",
      dot: "bg-zinc-400",
    },
    gold: {
      bg: "bg-[#FBF8F1]",
      text: "text-[#8A6729]",
      border: "border-[#E8D6B5]",
      dot: "bg-[#C6A15B]",
    },
  };

  const current = variantStyles[variant] || variantStyles.neutral;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full border transition-colors select-none",
        current.bg,
        current.text,
        current.border,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            current.dot
          )}
          aria-hidden="true"
        />
      )}
      <span>{label}</span>
    </span>
  );
}
