import React from "react";
import Link from "next/link";
import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  variant?: "default" | "gold" | "warning" | "success" | "info";
  href?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  variant = "default",
  href,
  className,
}: StatCardProps) {
  const iconBgMap = {
    default: "bg-zinc-100 text-zinc-700",
    gold: "bg-[#FBF6EC] text-[#A98242]",
    warning: "bg-amber-50 text-amber-700",
    success: "bg-emerald-50 text-emerald-700",
    info: "bg-blue-50 text-blue-700",
  };

  const borderAccentMap = {
    default: "border-neutral-border hover:border-zinc-300",
    gold: "border-[#EADBCA] hover:border-[#C6A15B]/50",
    warning: "border-amber-200/80 hover:border-amber-300",
    success: "border-emerald-200/80 hover:border-emerald-300",
    info: "border-blue-200/80 hover:border-blue-300",
  };

  const displayValue = typeof value === "number" ? formatNumber(value) : value;

  const CardContent = (
    <div
      className={cn(
        "relative p-3.5 sm:p-4.5 lg:p-5 rounded-2xl bg-surface border transition-all duration-200 shadow-xs hover:shadow-md overflow-hidden",
        borderAccentMap[variant],
        className
      )}
    >
      <div className="flex items-start justify-between gap-2.5 sm:gap-3">
        <div className="flex-1 min-w-0 text-right">
          <p className="text-xs sm:text-sm font-medium text-secondary-text truncate" title={title}>{title}</p>
          <div className="mt-1.5 sm:mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-primary-text font-tabular truncate block">
              {displayValue}
            </span>
          </div>
        </div>

        <div className={cn("p-2 sm:p-2.5 lg:p-3 rounded-xl shrink-0 transition-transform duration-200", iconBgMap[variant])}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-neutral-border-subtle flex items-center justify-between text-xs text-secondary-text gap-2 min-w-0">
          {subtitle && <span className="truncate text-[11px] sm:text-xs flex-1 min-w-0" title={subtitle}>{subtitle}</span>}
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-semibold text-[10px] sm:text-[11px] shrink-0",
                trend.isPositive ? "text-emerald-700" : "text-rose-700"
              )}
            >
              {trend.isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              <span>{Math.abs(trend.value)}%</span>
              {trend.label && <span className="text-secondary-text font-normal mr-1 hidden xs:inline">{trend.label}</span>}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block group">
        {CardContent}
      </Link>
    );
  }

  return CardContent;
}
