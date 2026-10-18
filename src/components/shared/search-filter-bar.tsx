"use client";

import React from "react";
import { Search, X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterSelectConfig {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
}

interface SearchFilterBarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: FilterSelectConfig[];
  onReset?: () => void;
  isFiltered?: boolean;
  totalResults?: number;
  className?: string;
}

export function SearchFilterBar({
  searchPlaceholder = "بحث...",
  searchValue,
  onSearchChange,
  filters = [],
  onReset,
  isFiltered = false,
  totalResults,
  className,
}: SearchFilterBarProps) {
  return (
    <div
      className={cn(
        "p-4 rounded-2xl bg-surface border border-neutral-border shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between",
        className
      )}
    >
      <div className="flex-1 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-secondary-text absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-colors"
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-secondary-text hover:text-primary-text rounded-md"
              aria-label="مسح البحث"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dynamic Select Filters */}
        <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
          {filters.map((filter) => (
            <select
              key={filter.id}
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="py-2 px-3 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold text-primary-text transition-colors cursor-pointer"
            >
              <option value="ALL">{filter.label}</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}
        </div>
      </div>

      {/* Reset & Count */}
      <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-border-subtle">
        {typeof totalResults === "number" && (
          <span className="text-xs text-secondary-text">
            النتائج: <strong className="text-primary-text font-tabular">{totalResults}</strong>
          </span>
        )}

        {isFiltered && onReset && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-secondary-text hover:text-brand-charcoal hover:bg-zinc-100 rounded-lg transition-colors border border-neutral-border"
          >
            <RotateCcw className="w-3 h-3" />
            <span>إعادة ضبط</span>
          </button>
        )}
      </div>
    </div>
  );
}
