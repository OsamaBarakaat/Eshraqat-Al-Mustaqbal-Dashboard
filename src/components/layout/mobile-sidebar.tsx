"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { NAVIGATION_SECTIONS } from "@/lib/navigation";
import { BrandLogo } from "../shared/brand-logo";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { cn } from "@/lib/utils";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname();
  const { hasModule } = usePermissions();
  const prevPathnameRef = useRef(pathname);

  // Close mobile sidebar ONLY when pathname actually changes
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      onClose();
    }
  }, [pathname, onClose]);

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer coming from the right for Arabic RTL */}
      <div className="fixed inset-y-0 right-0 w-[280px] sm:w-[320px] bg-brand-charcoal text-zinc-300 shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-zinc-800 shrink-0">
          <BrandLogo variant="dark" href="/dashboard" />
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 sidebar-scrollbar">
          {NAVIGATION_SECTIONS.map((section, idx) => {
            const visibleItems = section.items.filter(
              (item) => !item.module || hasModule(item.module)
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1">
                <p className="px-3 text-[11px] font-semibold text-zinc-400 tracking-wider uppercase mb-2">
                  {section.title}
                </p>
                <ul className="space-y-1">
                  {visibleItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer",
                          isActive
                            ? "bg-brand-gold text-brand-charcoal font-semibold shadow-xs shadow-brand-gold/20"
                            : "text-zinc-300 hover:text-white hover:bg-zinc-800/80"
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-5 h-5 shrink-0",
                            isActive ? "text-brand-charcoal" : "text-zinc-400 group-hover:text-brand-gold"
                          )}
                        />
                        <span className="flex-1 truncate">{item.title}</span>
                        {item.badge && (
                          <span
                            className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                              isActive
                                ? "bg-brand-charcoal text-brand-gold"
                                : "bg-brand-gold/20 text-brand-gold border border-brand-gold/30"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

        {/* Footer info */}
        <div className="p-3 border-t border-zinc-800 text-xs text-zinc-400 text-center">
          <p className="font-medium text-white text-[11px]">إشراقة المستقبل للعقارات</p>
          <p className="text-[10px] mt-0.5">لوحة التحكم الإدارية — نحو غدٍ مشرق</p>
        </div>
      </div>
    </div>
  );
}
