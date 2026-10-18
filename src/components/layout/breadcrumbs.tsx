import React from "react";
import Link from "next/link";
import { ChevronLeft, Home } from "lucide-react";
import { BreadcrumbItem } from "@/types/common";

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="مسار التنقل" className="flex items-center text-xs text-secondary-text">
      <ol className="flex items-center flex-wrap gap-1.5">
        <li className="flex items-center">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 hover:text-brand-gold-deep transition-colors"
            title="الرئيسية"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="sr-only">الرئيسية</span>
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-1.5">
              <ChevronLeft className="w-3 h-3 text-muted-text" />
              {isLast || !item.href ? (
                <span className="font-semibold text-primary-text truncate max-w-[200px]" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-brand-gold-deep transition-colors truncate max-w-[160px]"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
