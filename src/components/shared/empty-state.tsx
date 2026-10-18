import React from "react";
import { LucideIcon, FileSearch } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = FileSearch,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-dashed border-neutral-border bg-white/60",
        className
      )}
    >
      <div className="p-4 rounded-2xl bg-zinc-100 text-zinc-500 mb-4 shadow-2xs">
        <Icon className="w-8 h-8 text-brand-gold-deep" />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-primary-text">{title}</h3>
      <p className="mt-1.5 text-xs sm:text-sm text-secondary-text max-w-sm leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-5 px-4 py-2 text-xs sm:text-sm font-semibold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover rounded-xl shadow-xs transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
