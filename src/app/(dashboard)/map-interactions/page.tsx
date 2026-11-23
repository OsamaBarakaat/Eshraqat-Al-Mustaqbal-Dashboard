"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  MapPinned,
  Clock,
  Users2,
  Search,
  RotateCw,
  Phone,
  Mail,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Building2,
  Calendar,
} from "lucide-react";
import { MockStore } from "@/lib/services/mock-store";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { MapInteraction, MapInteractionStats } from "@/types/map-interaction";
import { useDebounce } from "@/lib/hooks/use-debounce";

const PAGE_SIZE = 15;

function formatFullArabicDateTime(dateString: string | Date): string {
  if (!dateString) return "-";
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return "-";

  try {
    return new Intl.DateTimeFormat("ar-SA", {
      timeZone: "Asia/Riyadh",
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    return date.toLocaleString("ar-SA");
  }
}

export default function MapInteractionsPage() {
  const [interactions, setInteractions] = useState<MapInteraction[]>([]);
  const [stats, setStats] = useState<MapInteractionStats>({
    totalInteractions: 0,
    todayInteractions: 0,
    uniqueClients: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Search & Filter
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [res, statsRes] = await Promise.all([
        MockStore.queryMapInteractions({
          search: debouncedSearch,
          page: currentPage,
          limit: PAGE_SIZE,
        }),
        MockStore.getMapInteractionStats(),
      ]);

      setInteractions(res.items);
      setTotalItems(res.total);
      setTotalPages(res.totalPages);
      setStats(statsRes);
    } catch (err) {
      console.error("Failed to load map interactions:", err);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, currentPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <PageHeader
        title="التفاعل مع الخريطة"
        description="سجل تفصيلي لجميع العملاء الذين نقروا على خريطة موقع العقار مع بيانات التواصل والتوقيت الدقيق"
        breadcrumbs={[{ label: "التفاعل مع الخريطة" }]}
        primaryAction={
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-warm-white hover:bg-zinc-100 border border-neutral-border text-primary-text transition-colors cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            <span>تحديث البيانات</span>
          </button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="إجمالي النقرات على الخرائط"
          value={stats.totalInteractions}
          icon={MapPinned}
          variant="gold"
          subtitle="سجل تفاعلات متراكم"
        />
        <StatCard
          title="نقرات اليوم"
          value={stats.todayInteractions}
          icon={Clock}
          variant="success"
          subtitle="تفاعل نشط اليوم"
        />
        <StatCard
          title="عملاء فريدون مهتمون"
          value={stats.uniqueClients}
          icon={Users2}
          variant="info"
          subtitle="حسابات مسجلة تفاعلت"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-surface border border-neutral-border shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-text absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم العميل، رقم الجوال، البريد، اسم العقار أو العنوان الوطني (مثل RRRD2929)..."
              className="w-full pr-10 pl-4 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold text-primary-text"
            />
          </div>
          <div className="flex items-center justify-end gap-2 text-xs text-secondary-text">
            <span>إجمالي النتائج:</span>
            <strong className="text-primary-text font-tabular">{totalItems}</strong>
          </div>
        </div>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <TableSkeleton rows={7} />
      ) : interactions.length === 0 ? (
        <EmptyState
          icon={MapPinned}
          title="لا توجد تفاعلات مسجلة"
          description={
            debouncedSearch
              ? "لم يتم العثور على أي نتائج مطابقة لمعايير البحث الحالية."
              : "لم يقم أي عميل مسجل بالنقر على خريطة العقارات حتى الآن."
          }
        />
      ) : (
        <div className="rounded-2xl bg-surface border border-neutral-border shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-zinc-50 border-b border-neutral-border text-secondary-text font-semibold select-none">
                <tr>
                  <th className="py-3.5 px-4">العميل</th>
                  <th className="py-3.5 px-4">رقم الجوال</th>
                  <th className="py-3.5 px-4">البريد الإلكتروني</th>
                  <th className="py-3.5 px-4">العقار</th>
                  <th className="py-3.5 px-4">العنوان الوطني</th>
                  <th className="py-3.5 px-4">توقيت النقر الدقيق</th>
                  <th className="py-3.5 px-4 text-center">الخريطة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-border-subtle">
                {interactions.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50/70 transition-colors">
                    {/* Client Name */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-brand-gold/15 text-brand-gold-deep flex items-center justify-center font-bold text-xs shrink-0">
                          {item.client?.name?.charAt(0) || "ع"}
                        </div>
                        <div>
                          <p className="font-semibold text-primary-text">
                            {item.client?.name || "عميل بدون اسم"}
                          </p>
                          {item.client?.region && (
                            <span className="text-[11px] text-secondary-text">
                              {item.client.region}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono font-medium text-primary-text dir-ltr text-right">
                      {item.client?.phone ? (
                        <a
                          href={`tel:${item.client.phone}`}
                          className="inline-flex items-center gap-1.5 hover:text-brand-gold-deep hover:underline"
                        >
                          <Phone className="w-3.5 h-3.5 text-muted-text" />
                          <span>{item.client.phone}</span>
                        </a>
                      ) : (
                        <span className="text-muted-text">-</span>
                      )}
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-secondary-text">
                      {item.client?.email ? (
                        <a
                          href={`mailto:${item.client.email}`}
                          className="inline-flex items-center gap-1.5 hover:text-brand-gold-deep hover:underline"
                        >
                          <Mail className="w-3.5 h-3.5 text-muted-text" />
                          <span>{item.client.email}</span>
                        </a>
                      ) : (
                        <span className="text-muted-text">-</span>
                      )}
                    </td>

                    {/* Property */}
                    <td className="py-3.5 px-4 max-w-xs">
                      {item.property ? (
                        <Link
                          href={`/properties/${item.property.id}`}
                          className="font-semibold text-primary-text hover:text-brand-gold-deep transition-colors line-clamp-1 block cursor-pointer"
                          title={item.property.title}
                        >
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-brand-gold-deep shrink-0" />
                            <span>{item.property.title}</span>
                          </div>
                        </Link>
                      ) : (
                        <span className="text-muted-text">عقار محذوف</span>
                      )}
                      {item.property?.city && (
                        <span className="text-[11px] text-secondary-text block mt-0.5">
                          {item.property.city} {item.property.areaName ? `• ${item.property.areaName}` : ""}
                        </span>
                      )}
                    </td>

                    {/* National Address Code */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.property?.code ? (
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-zinc-100 border border-neutral-border font-mono font-bold text-brand-charcoal text-xs uppercase tracking-wider">
                          {item.property.code}
                        </span>
                      ) : (
                        <span className="text-muted-text">-</span>
                      )}
                    </td>

                    {/* Exact Timestamp */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-primary-text font-medium text-xs">
                        <Calendar className="w-3.5 h-3.5 text-brand-gold-deep shrink-0" />
                        <span>{formatFullArabicDateTime(item.createdAt)}</span>
                      </div>
                    </td>

                    {/* Map Link Action */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-center">
                      {item.property?.googleMapsUrl ? (
                        <a
                          href={item.property.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-gold/10 hover:bg-brand-gold/20 text-brand-gold-deep text-xs font-semibold transition-colors"
                          title="عرض الخريطة على خرائط جوجل"
                        >
                          <span>عرض</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-muted-text text-[11px]">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-neutral-border flex items-center justify-between gap-4 text-xs select-none">
              <span className="text-secondary-text">
                الصفحة <strong className="text-primary-text font-tabular">{currentPage}</strong> من{" "}
                <strong className="text-primary-text font-tabular">{totalPages}</strong>
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-neutral-border hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="الصفحة السابقة"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-neutral-border hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="الصفحة التالية"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
