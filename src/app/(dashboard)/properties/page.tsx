"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  PlusCircle,
  Eye,
  Edit3,
  Trash2,
  CheckCircle,
  XCircle,
  Archive,
  Layers,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Tag,
} from "lucide-react";
import { MockStore, subscribeToMockStore } from "@/lib/services/mock-store";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ActionTooltip } from "@/components/shared/action-tooltip";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { useToast } from "@/components/shared/toast-provider";
import {
  PROPERTY_CATEGORY_LABELS,
  PROPERTY_PURPOSE_LABELS,
  PROPERTY_STATUS_CONFIG,
} from "@/lib/constants";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Property, PropertyStatus } from "@/types/property";

export default function PropertiesListPage() {
  const { success, error: toastError, info } = useToast();
  const [properties, setProperties] = useState<Property[]>(MockStore.getProperties());
  const [provinces, setProvinces] = useState(MockStore.getLocations());

  // Search and filter states
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [purposeFilter, setPurposeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [cityFilter, setCityFilter] = useState("ALL");
  const [districtFilter, setDistrictFilter] = useState("ALL");
  const [discountFilter, setDiscountFilter] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Modals state
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToMockStore(() => {
      setProperties(MockStore.getProperties());
      setProvinces(MockStore.getLocations());
    });
    return unsubscribe;
  }, []);

  // Compute available cities from Saudi locations
  const availableCities = useMemo(() => {
    const list: { id: string; name: string }[] = [];
    provinces.forEach((p) => {
      p.cities.forEach((c) => {
        list.push({ id: c.nameArabic, name: c.nameArabic });
      });
    });
    return list;
  }, [provinces]);

  // Compute available districts based on selected city
  const availableDistricts = useMemo(() => {
    if (cityFilter === "ALL") return [];
    for (const p of provinces) {
      const city = p.cities.find((c) => c.nameArabic === cityFilter);
      if (city) {
        return city.districts.map((d) => d.nameArabic);
      }
    }
    return [];
  }, [provinces, cityFilter]);

  // Filter properties
  const filteredProperties = useMemo(() => {
    return properties.filter((prop) => {
      // Search
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchTitle = prop.title.toLowerCase().includes(query);
        const matchCode = prop.code.toLowerCase().includes(query);
        const matchArea = prop.location.area.toLowerCase().includes(query);
        if (!matchTitle && !matchCode && !matchArea) return false;
      }
      // Category
      if (categoryFilter !== "ALL" && prop.category !== categoryFilter) return false;
      // Purpose
      if (purposeFilter !== "ALL" && prop.purpose !== purposeFilter) return false;
      // Status
      if (statusFilter !== "ALL" && prop.status !== statusFilter) return false;
      // City
      if (cityFilter !== "ALL" && prop.location.city !== cityFilter) return false;
      // District / Area
      if (districtFilter !== "ALL" && prop.location.area !== districtFilter) return false;
      // Discount filter
      if (discountFilter && !(prop.originalPrice && prop.originalPrice > prop.price)) return false;

      return true;
    });
  }, [properties, search, categoryFilter, purposeFilter, statusFilter, cityFilter, districtFilter, discountFilter]);

  // Paginated records
  const totalPages = Math.max(1, Math.ceil(filteredProperties.length / pageSize));
  const paginatedProperties = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProperties.slice(start, start + pageSize);
  }, [filteredProperties, currentPage, pageSize]);

  // Statistics
  const totalCount = properties.length;
  const publishedCount = properties.filter((p) => p.status === "PUBLISHED").length;
  const draftCount = properties.filter((p) => p.status === "DRAFT").length;
  const soldOrRentedCount = properties.filter((p) => p.status === "SOLD" || p.status === "RENTED").length;
  const discountedCount = properties.filter((p) => p.originalPrice && p.originalPrice > p.price).length;

  // Actions
  const handleTogglePublish = (prop: Property) => {
    const newStatus: PropertyStatus = prop.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    MockStore.updateProperty(prop.id, { status: newStatus });
    if (newStatus === "PUBLISHED") {
      success("تم نشر العقار بنجاح", `أصبح العقار (${prop.code}) متاحاً للجمهور على الموقع.`);
    } else {
      info("تم إلغاء النشر", `تم تحويل العقار (${prop.code}) إلى مسودة غير معروضة.`);
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    const ok = MockStore.deleteProperty(deleteTarget.id);
    if (ok) {
      success("تم حذف العقار نهائياً", `تم التحقق من كلمة المرور وحذف العقار (${deleteTarget.code}) بنجاح.`);
      setDeleteTarget(null);
    } else {
      toastError("خطأ", "تعذر حذف العقار.");
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setCategoryFilter("ALL");
    setPurposeFilter("ALL");
    setStatusFilter("ALL");
    setCityFilter("ALL");
    setDistrictFilter("ALL");
    setDiscountFilter(false);
    setCurrentPage(1);
  };

  const isFiltered =
    Boolean(search) ||
    categoryFilter !== "ALL" ||
    purposeFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    cityFilter !== "ALL" ||
    districtFilter !== "ALL" ||
    discountFilter;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <PageHeader
        title="إدارة قوائم العقارات"
        description="استعرض وأدر كافة العقارات المعروضة للبيع والإيجار والمسودات مع خيارات البحث والفرز المتقدمة."
        breadcrumbs={[{ label: "العقارات" }]}
        primaryAction={
          <PermissionGuard module="properties" action="create">
            <ActionTooltip label="إضافة عقار جديد إلى المنصة" variant="gold">
              <Link
                href="/properties/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover rounded-xl shadow-xs shadow-brand-gold/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>إضافة عقار جديد</span>
              </Link>
            </ActionTooltip>
          </PermissionGuard>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="إجمالي العقارات"
          value={totalCount}
          icon={Building2}
          subtitle="محفظة المنصة الكلية"
          variant="gold"
        />
        <StatCard
          title="عقارات منشورة"
          value={publishedCount}
          icon={CheckCircle}
          subtitle="متاحة للمعاينة والحجز"
          variant="success"
        />
        <StatCard
          title="مسودات قيد الإعداد"
          value={draftCount}
          icon={Layers}
          subtitle="تحت المراجعة والتجهيز"
          variant="warning"
        />
        <StatCard
          title="تم البيع / التأجير"
          value={soldOrRentedCount}
          icon={Archive}
          subtitle="صفقات مكتملة ناجحة"
          variant="info"
        />
      </div>

      {/* Search and Filters Bar with Dependent District Filter */}
      <div className="p-4 rounded-2xl bg-surface border border-neutral-border shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Bar */}
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="بحث بعنوان العقار، الكود (مثل ESH-1001)، أو الحي..."
              className="w-full px-4 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold"
            />
          </div>

          {/* Reset button & Results count */}
          <div className="flex items-center justify-between md:justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setDiscountFilter((prev) => !prev);
                setCurrentPage(1);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all border cursor-pointer",
                discountFilter
                  ? "bg-rose-50 text-rose-700 border-rose-300 shadow-2xs"
                  : "bg-warm-white text-secondary-text hover:text-primary-text border-neutral-border hover:bg-zinc-100"
              )}
            >
              <Tag className="w-3.5 h-3.5 text-rose-500" />
              <span>عروض وخصومات</span>
              {discountedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold font-tabular">
                  {discountedCount}
                </span>
              )}
            </button>

            <span className="text-xs text-secondary-text">
              النتائج: <strong className="text-primary-text font-tabular">{filteredProperties.length}</strong>
            </span>

            {isFiltered && (
              <button
                onClick={handleResetFilters}
                className="px-3 py-1.5 text-xs font-semibold text-secondary-text hover:text-brand-charcoal hover:bg-zinc-100 rounded-lg transition-colors border border-neutral-border cursor-pointer"
              >
                إعادة ضبط
              </button>
            )}
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-2 border-t border-neutral-border-subtle">
          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="py-2 px-3 text-xs bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-gold text-primary-text cursor-pointer"
          >
            <option value="ALL">كل التصنيفات</option>
            <option value="RESIDENTIAL">سكني</option>
            <option value="COMMERCIAL">تجاري وإداري</option>
            <option value="AGRICULTURAL">أراضي وزراعي</option>
          </select>

          {/* Purpose */}
          <select
            value={purposeFilter}
            onChange={(e) => {
              setPurposeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="py-2 px-3 text-xs bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-gold text-primary-text cursor-pointer"
          >
            <option value="ALL">كل الأغراض</option>
            <option value="SALE">للبيع</option>
            <option value="RENT">للإيجار</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="py-2 px-3 text-xs bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-gold text-primary-text cursor-pointer"
          >
            <option value="ALL">كل الحالات</option>
            <option value="PUBLISHED">منشور</option>
            <option value="DRAFT">مسودة</option>
            <option value="SOLD">تم البيع</option>
            <option value="RENTED">تم التأجير</option>
            <option value="ARCHIVED">مؤرشف</option>
          </select>

          {/* City */}
          <select
            value={cityFilter}
            onChange={(e) => {
              setCityFilter(e.target.value);
              setDistrictFilter("ALL"); // reset dependent district
              setCurrentPage(1);
            }}
            className="py-2 px-3 text-xs bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-gold text-primary-text cursor-pointer"
          >
            <option value="ALL">كل المدن (السعودية)</option>
            {availableCities.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Dependent District (الحي) */}
          <select
            value={districtFilter}
            disabled={cityFilter === "ALL" || availableDistricts.length === 0}
            onChange={(e) => {
              setDistrictFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="py-2 px-3 text-xs bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-gold text-primary-text cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="ALL">
              {cityFilter === "ALL" ? "اختر المدينة لتحديد الحي" : "كل أحياء المدينة"}
            </option>
            {availableDistricts.map((dist) => (
              <option key={dist} value={dist}>
                {dist}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Properties Table Card */}
      <div className="rounded-2xl bg-surface border border-neutral-border shadow-xs overflow-hidden">
        {paginatedProperties.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-zinc-50 border-b border-neutral-border text-secondary-text font-semibold select-none">
                <tr>
                  <th className="py-3.5 px-4">العقار</th>
                  <th className="py-3.5 px-4">الكود</th>
                  <th className="py-3.5 px-4">التصنيف والغرض</th>
                  <th className="py-3.5 px-4">الموقع</th>
                  <th className="py-3.5 px-4">السعر</th>
                  <th className="py-3.5 px-4">المساحة</th>
                  <th className="py-3.5 px-4">الحالة</th>
                  <th className="py-3.5 px-4">آخر تحديث</th>
                  <th className="py-3.5 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-border-subtle">
                {paginatedProperties.map((prop) => {
                  const statusCfg = PROPERTY_STATUS_CONFIG[prop.status];
                  return (
                    <tr
                      key={prop.id}
                      className="hover:bg-zinc-50/70 transition-colors group"
                    >
                      {/* Title & Image */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-200 shrink-0 border border-neutral-border">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={prop.images[0]?.url}
                              alt={prop.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            {prop.originalPrice && prop.originalPrice > prop.price && prop.discountPercentage && (
                              <span className="absolute top-0 right-0 px-1 py-0.2 bg-rose-600 text-white text-[9px] font-bold rounded-bl-md shadow-xs">
                                %{prop.discountPercentage}-
                              </span>
                            )}
                          </div>
                          <div className="overflow-hidden">
                            <Link
                              href={`/properties/${prop.id}`}
                              className="font-bold text-primary-text hover:text-brand-gold-deep transition-colors line-clamp-1 block cursor-pointer"
                              title={prop.title}
                            >
                              {prop.title}
                            </Link>
                            <span className="text-[11px] text-secondary-text truncate block mt-0.5">
                              {prop.shortDescription}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Code */}
                      <td className="py-3 px-4 font-mono font-semibold text-brand-gold-deep whitespace-nowrap">
                        {prop.code}
                      </td>

                      {/* Category & Purpose */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-medium text-primary-text block">
                          {PROPERTY_CATEGORY_LABELS[prop.category]}
                        </span>
                        <span className="text-[11px] text-secondary-text">
                          {PROPERTY_PURPOSE_LABELS[prop.purpose]}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-primary-text">
                          <MapPin className="w-3.5 h-3.5 text-brand-gold-deep shrink-0" />
                          <span>{prop.location.area}</span>
                        </div>
                        <span className="text-[11px] text-secondary-text mr-4">
                          {prop.location.city}
                        </span>
                      </td>

                      {/* Price in SAR */}
                      <td className="py-3 px-4 font-tabular whitespace-nowrap">
                        {prop.originalPrice && prop.originalPrice > prop.price ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-emerald-600">
                                {formatCurrency(prop.price, prop.currency)}
                              </span>
                              {prop.discountPercentage && (
                                <span className="px-1.5 py-0.2 rounded-md bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-bold">
                                  -{prop.discountPercentage}%
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-400 line-through font-tabular">
                              {formatCurrency(prop.originalPrice, prop.currency)}
                            </div>
                          </div>
                        ) : (
                          <span className="font-bold text-primary-text">
                            {formatCurrency(prop.price, prop.currency)}
                          </span>
                        )}
                      </td>

                      {/* Area */}
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-primary-text font-tabular">
                        {prop.area} {prop.areaUnit}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge label={statusCfg.label} variant={statusCfg.color} />
                      </td>

                      {/* Updated Date */}
                      <td className="py-3 px-4 whitespace-nowrap text-secondary-text text-xs">
                        {formatDate(prop.updatedAt)}
                      </td>

                      {/* Action buttons with colored Tooltips */}
                      <td className="py-3 px-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* View details */}
                          <ActionTooltip label="عرض تفاصيل العقار الكاملة" variant="emerald">
                            <Link
                              href={`/properties/${prop.id}`}
                              className="p-1.5 text-secondary-text hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          </ActionTooltip>

                          {/* Edit property */}
                          <ActionTooltip label="تعديل بيانات ومواصفات العقار" variant="blue">
                            <Link
                              href={`/properties/${prop.id}/edit`}
                              className="p-1.5 text-secondary-text hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Link>
                          </ActionTooltip>

                          {/* Toggle publish status */}
                          <ActionTooltip
                            label={prop.status === "PUBLISHED" ? "إلغاء النشر (تحويل لمسودة)" : "نشر العقار للجمهور"}
                            variant={prop.status === "PUBLISHED" ? "amber" : "emerald"}
                          >
                            <button
                              onClick={() => handleTogglePublish(prop)}
                              className="p-1.5 text-secondary-text hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                            >
                              {prop.status === "PUBLISHED" ? (
                                <XCircle className="w-4 h-4 text-amber-600" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                              )}
                            </button>
                          </ActionTooltip>

                          {/* Delete property with password confirmation */}
                          <ActionTooltip label="حذف العقار نهائياً (يتطلب كلمة المرور)" variant="rose">
                            <button
                              onClick={() => setDeleteTarget(prop)}
                              className="p-1.5 text-secondary-text hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </ActionTooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="لم يتم العثور على عقارات مطابقة"
            description="جرّب تعديل كلمات البحث أو تصفية المدينة والحي للوصول إلى العقارات المطلوبة."
            actionLabel="إعادة ضبط الفلاتر"
            onAction={handleResetFilters}
            className="my-6"
          />
        )}

        {/* Pagination bar */}
        {filteredProperties.length > 0 && (
          <div className="p-4 border-t border-neutral-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-secondary-text">
            <span>
              عرض الصفحة <strong className="text-primary-text">{currentPage}</strong> من أصل{" "}
              <strong className="text-primary-text">{totalPages}</strong> (إجمالي{" "}
              <strong className="text-primary-text">{filteredProperties.length}</strong> عقار)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-border bg-warm-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-primary-text font-medium cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
                <span>السابق</span>
              </button>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-border bg-warm-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-primary-text font-medium cursor-pointer"
              >
                <span>التالي</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal with Password verification */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="تأكيد حذف العقار"
        description={`هل أنت متأكد من رغبتك في حذف العقار (${deleteTarget?.code} - ${deleteTarget?.title})؟ هذا الإجراء حساس ولا يمكن التراجع عنه.`}
        confirmLabel="حذف نهائي"
        cancelLabel="تراجع"
        variant="destructive"
        requirePassword={true}
      />
    </div>
  );
}
