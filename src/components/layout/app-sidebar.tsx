"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { NAVIGATION_SECTIONS } from "@/lib/navigation";
import { BrandLogo } from "../shared/brand-logo";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function AppSidebar({ collapsed, onToggleCollapse }: AppSidebarProps) {
  const pathname = usePathname();
  const { hasModule } = usePermissions();

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col bg-brand-charcoal text-zinc-300 border-l border-zinc-800 transition-[width] duration-300 ease-in-out select-none z-30 shrink-0 sticky top-0 h-screen",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-zinc-800/80 shrink-0">
        <BrandLogo variant="dark" collapsed={collapsed} />

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title={collapsed ? "توسيع القائمة" : "طي القائمة"}
          aria-label={collapsed ? "توسيع القائمة الجانبية" : "طي القائمة الجانبية"}
        >
          {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 sidebar-scrollbar">
        {NAVIGATION_SECTIONS.map((section, idx) => {
          const visibleItems = section.items.filter(
            (item) => !item.module || hasModule(item.module)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1">
              {!collapsed && (
                <p className="px-3 text-[11px] font-semibold text-zinc-400 tracking-wider uppercase mb-2">
                  {section.title}
                </p>
              )}

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
                      className={cn(
                        "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ease-out relative cursor-pointer",
                        isActive
                          ? "bg-brand-gold text-brand-charcoal font-semibold shadow-xs shadow-brand-gold/30 -translate-x-1"
                          : "text-zinc-300 hover:text-white hover:bg-zinc-800/80 hover:-translate-x-0.5",
                        collapsed && "justify-center px-0 hover:translate-x-0"
                      )}
                      title={collapsed ? item.title : undefined}
                    >
                      <Icon
                        className={cn(
                          "w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110",
                          isActive ? "text-brand-charcoal" : "text-zinc-400 group-hover:text-brand-gold"
                        )}
                      />

                      {!collapsed && (
                        <div className="flex-1 flex items-center justify-between overflow-hidden">
                          <span className="truncate">{item.title}</span>
                          {item.badge && (
                            <span
                              className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase",
                                isActive
                                  ? "bg-brand-charcoal text-brand-gold"
                                  : "bg-brand-gold/20 text-brand-gold border border-brand-gold/30"
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Active indicator bar */}
                      {isActive && !collapsed && (
                        <span className="absolute right-0 top-2 bottom-2 w-1 rounded-l-full bg-brand-charcoal/40" />
                      )}

                      {/* Tooltip on collapsed */}
                      {collapsed && (
                        <span className="absolute right-full mr-2 hidden group-hover:flex items-center px-2 py-1 text-xs font-medium text-white bg-zinc-900 border border-zinc-700 rounded-md shadow-lg whitespace-nowrap z-50 animate-in fade-in-50 duration-150">
                          {item.title}
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

      {/* Footer / Demo indicator */}
      <div className="p-3 border-t border-zinc-800/80 shrink-0">
        {!collapsed ? (
          <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-brand-gold/15 text-brand-gold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[10px] text-zinc-400 truncate">لوحة تحكم إشراقة المستقبل</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="نسخة تجريبية MVP">
            <Sparkles className="w-4 h-4 text-brand-gold" />
          </div>
        )}
      </div>
    </aside>
  );
}
