"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  message?: string;
}

export function TableSkeleton({
  rows = 5,
  columns = 7,
  message = "جاري تحميل البيانات الحية من قاعدة البيانات...",
}: TableSkeletonProps) {
  return (
    <div className="w-full bg-surface rounded-2xl border border-neutral-border overflow-hidden">
      {/* Top loading notification bar */}
      <div className="p-3 bg-brand-gold/5 border-b border-brand-gold/20 flex items-center justify-center gap-2 text-xs font-semibold text-brand-gold-deep animate-pulse">
        <Loader2 className="w-4 h-4 animate-spin text-brand-gold" />
        <span>{message}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-zinc-50 border-b border-neutral-border">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="py-3.5 px-4">
                  <div className="h-4 bg-zinc-200/80 rounded-md w-20 animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-border-subtle">
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-zinc-50/50 transition-colors">
                {Array.from({ length: columns }).map((_, colIdx) => (
                  <td key={colIdx} className="py-4 px-4">
                    <div
                      className="h-4 bg-zinc-200/60 rounded-md animate-pulse"
                      style={{
                        width: colIdx === 0 ? "85%" : colIdx === columns - 1 ? "40px" : "60%",
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
