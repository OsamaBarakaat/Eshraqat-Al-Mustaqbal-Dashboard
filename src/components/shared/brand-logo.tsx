import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  variant?: "dark" | "light"; // "dark" = for dark background like sidebar, "light" = for light background
  collapsed?: boolean;
  withTagline?: boolean;
  href?: string;
  size?: "sm" | "md" | "lg";
}

export function BrandLogo({
  className,
  variant = "dark",
  collapsed = false,
  withTagline = true,
  href = "/dashboard",
  size = "md",
}: BrandLogoProps) {
  const isDark = variant === "dark";

  // Large full emblem for Login Page or Hero
  if (size === "lg") {
    const FullEmblem = (
      <div className={cn("flex flex-col items-center text-center select-none", className)}>
        <div className="relative w-32 h-36 sm:w-40 sm:h-44 transition-transform duration-300 hover:scale-105 drop-shadow-xl">
          <Image
            src="/Logo/Eshraqat-Al-Mustakbal-Logo.png"
            alt="شعار شركة إشراقة المستقبل للعقارات"
            fill
            sizes="(max-width: 640px) 128px, 160px"
            className="object-contain"
            priority
          />
        </div>
      </div>
    );

    if (href) {
      return (
        <Link href={href} className="inline-block transition-opacity hover:opacity-95 cursor-pointer">
          {FullEmblem}
        </Link>
      );
    }
    return FullEmblem;
  }

  // Standard Header / Sidebar emblem + typography
  const Content = (
    <div className={cn("flex items-center gap-3 select-none", className)}>
      {/* Luxury Golden Architectural Logo Container */}
      <div
        className={cn(
          "relative flex items-center justify-center shrink-0 rounded-xl overflow-hidden transition-all duration-200",
          size === "sm" ? "w-8 h-8 p-0.5" : "w-10 h-10 p-1",
          isDark
            ? "bg-zinc-900/90 border border-zinc-700/60 shadow-xs"
            : "bg-surface border border-neutral-border shadow-xs"
        )}
      >
        <div className="relative w-full h-full">
          <Image
            src="/Logo/Eshraqat-Al-Mustakbal-Logo.png"
            alt="شعار إشراقة المستقبل"
            fill
            sizes="40px"
            className="object-contain drop-shadow-xs"
            priority
          />
        </div>
      </div>

      {!collapsed && (
        <div className="flex flex-col text-right leading-tight overflow-hidden">
          <span
            className={cn(
              "font-bold text-sm sm:text-base tracking-tight truncate",
              isDark ? "text-white" : "text-brand-charcoal"
            )}
          >
            إشراقة المستقبل
          </span>
          {withTagline && (
            <span
              className={cn(
                "text-[10px] sm:text-[11px] font-medium tracking-wide truncate",
                isDark ? "text-[#C6A15B]" : "text-brand-gold-deep"
              )}
            >
              نحو غدٍ مشرق
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block transition-opacity hover:opacity-90 cursor-pointer">
        {Content}
      </Link>
    );
  }

  return Content;
}
