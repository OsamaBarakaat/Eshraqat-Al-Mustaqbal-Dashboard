"use client";

import React from "react";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  message?: string;
}

export function TableSkeleton({
  rows = 5,
  columns = 7,
}: TableSkeletonProps) {
  return (
    <div className="w-full bg-surface rounded-2xl border border-neutral-border shadow-xs overflow-hidden relative">
      {/* Sleek top shimmer progress line */}
      <div className="h-[2px] w-full bg-zinc-100 overflow-hidden relative">
        <div className="h-full bg-gradient-to-r from-transparent via-brand-gold to-transparent animate-pulse w-full" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-zinc-50 border-b border-neutral-border">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="py-3.5 px-4">
                  <div className="h-3.5 bg-zinc-200/70 rounded-md w-20 animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-border-subtle">
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-zinc-50/30 transition-colors">
                {Array.from({ length: columns }).map((_, colIdx) => (
                  <td key={colIdx} className="py-4 px-4">
                    <div
                      className="h-3.5 bg-zinc-100 rounded-md animate-pulse"
                      style={{
                        width: colIdx === 0 ? "80%" : colIdx === columns - 1 ? "48px" : "60%",
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
