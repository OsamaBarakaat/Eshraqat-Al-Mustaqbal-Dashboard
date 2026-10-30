"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Edit3,
  Trash2,
  MapPin,
  Eye,
  MailCheck,
  CheckCircle,
  XCircle,
  Check,
} from "lucide-react";
import { MockStore, subscribeToMockStore } from "@/lib/services/mock-store";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { useToast } from "@/components/shared/toast-provider";
import {
  PROPERTY_CATEGORY_LABELS,
  PROPERTY_PURPOSE_LABELS,
  PROPERTY_STATUS_CONFIG,
  FURNISHING_LABELS,
} from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ActionTooltip } from "@/components/shared/action-tooltip";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { ProtectedRoute } from "@/components/shared/protected-route";
import { PropertyImageSwiper } from "@/components/shared/property-image-swiper";
import { Property, PropertyStatus } from "@/types/property";

export default function PropertyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { success, info } = useToast();
  const resolvedParams = use(params);

  const [property, setProperty] = useState<Property | undefined>(
    MockStore.getPropertyById(resolvedParams.id)
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToMockStore(() => {
      setProperty(MockStore.getPropertyById(resolvedParams.id));
    });
    return unsubscribe;
  }, [resolvedParams.id]);

  if (!property) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="تفاصيل العقار"
          breadcrumbs={[
            { label: "العقارات", href: "/properties" },
            { label: "غير موجود" },
          ]}
        />
        <EmptyState
          title="العقار غير موجود"
          description="لم يتم العثور على العقار المطلوب بالمعرّف المذكور."
          actionLabel="العودة لقائمة العقارات"
          onAction={() => router.push("/properties")}
        />
      </div>
    );
  }

  const statusCfg = PROPERTY_STATUS_CONFIG[property.status];

  const handleTogglePublish = () => {
    const newStatus: PropertyStatus = property.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    MockStore.updateProperty(property.id, { status: newStatus });
    if (newStatus === "PUBLISHED") {
      success("تم نشر العقار", "تم نشر العقار وأصبح متاحاً للعملاء على المنصة.");
    } else {
      info("تم تحويل العقار لمسودة", "تم إلغاء النشر وحفظ العقار كمسودة داخلية.");
    }
  };

  const handleDelete = () => {
    setDeleteDialogOpen(false);
    MockStore.deleteProperty(property.id);
    success("تم حذف العقار", `تم حذف العقار (${property.code}) بنجاح.`);
    router.push("/properties");
  };

  return (
    <ProtectedRoute module="properties" action="view">
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Page Header */}
        <PageHeader
          title={property.title}
          description={`كود العقار: ${property.code} • تم التسجيل في ${formatDate(property.createdAt)}`}
          breadcrumbs={[
            { label: "العقارات", href: "/properties" },
            { label: property.code },
          ]}
          badge={<StatusBadge label={statusCfg.label} variant={statusCfg.color} />}
          primaryAction={
            <PermissionGuard module="properties" action="edit">
              <Link
                href={`/properties/${property.id}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover rounded-xl shadow-xs transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>تعديل العقار</span>
              </Link>
            </PermissionGuard>
          }
          secondaryActions={
            <div className="flex items-center gap-2">
              <PermissionGuard module="properties" action="publish">
                <ActionTooltip
                  label={property.status === "PUBLISHED" ? "إلغاء نشر العقار وحفظه كمسودة" : "نشر العقار على المنصة العامة"}
                  variant={property.status === "PUBLISHED" ? "amber" : "emerald"}
                >
                  <button
                    onClick={handleTogglePublish}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-primary-text bg-surface hover:bg-zinc-100 border border-neutral-border rounded-xl transition-colors cursor-pointer"
                  >
                    {property.status === "PUBLISHED" ? (
                      <>
                        <XCircle className="w-4 h-4 text-amber-600" />
                        <span>إلغاء النشر</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>نشر على المنصة</span>
                      </>
                    )}
                  </button>
                </ActionTooltip>
              </PermissionGuard>

              <PermissionGuard module="properties" action="delete">
                <ActionTooltip label="حذف العقار نهائياً (يتطلب كلمة المرور)" variant="rose">
                  <button
                    onClick={() => setDeleteDialogOpen(true)}
                    className="p-2.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </ActionTooltip>
              </PermissionGuard>
            </div>
          }
        />

      {/* Main Grid: Gallery & Core Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gallery Section (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <PropertyImageSwiper images={property.images} title={property.title} />

          {/* Description Section */}
          <div className="p-6 rounded-2xl bg-surface border border-neutral-border shadow-xs text-right space-y-4">
            <h3 className="text-base font-bold text-primary-text">الوصف الكامل للعقار</h3>
            <p className="text-xs sm:text-sm text-secondary-text leading-relaxed whitespace-pre-line">
              {property.fullDescription}
            </p>
          </div>

          {/* Amenities & Features */}
          {property.amenities.length > 0 && (
            <div className="p-6 rounded-2xl bg-surface border border-neutral-border shadow-xs text-right space-y-4">
              <h3 className="text-base font-bold text-primary-text">المميزات والخدمات المتاحة</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {property.amenities.map((amenity, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-warm-white border border-neutral-border-subtle text-xs font-medium text-primary-text"
                  >
                    <Check className="w-4 h-4 text-brand-gold-deep shrink-0" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Card: Pricing, Location, Specs (1 Col) */}
        <div className="space-y-6">
          {/* Price & Summary Card */}
          <div className="p-6 rounded-2xl bg-surface border border-neutral-border shadow-xs text-right space-y-5">
            <div>
              <span className="text-xs font-medium text-secondary-text">القيمة الإجمالية</span>
              {property.originalPrice && property.originalPrice > property.price ? (
                <div className="mt-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-tabular">
                      {formatCurrency(property.price, property.currency)}
                    </span>
                    {property.discountPercentage && (
                      <span className="px-2.5 py-0.5 rounded-lg bg-rose-500 text-white text-xs font-bold shadow-xs">
                        خصم {property.discountPercentage}%
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-zinc-400 line-through font-tabular">
                      {formatCurrency(property.originalPrice, property.currency)}
                    </span>
                    <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      وفرت {formatCurrency(property.originalPrice - property.price, property.currency)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-2xl sm:text-3xl font-extrabold text-primary-text font-tabular mt-1">
                  {formatCurrency(property.price, property.currency)}
                </div>
              )}
              {property.maintenanceFee ? (
                <p className="text-xs text-secondary-text mt-1">
                  وديعة الصيانة: {formatCurrency(property.maintenanceFee)}
                </p>
              ) : null}
            </div>

            <div className="pt-4 border-t border-neutral-border-subtle grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-warm-white border border-neutral-border-subtle">
                <span className="text-secondary-text block">التصنيف</span>
                <span className="font-bold text-primary-text mt-1 block">
                  {PROPERTY_CATEGORY_LABELS[property.category]}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-warm-white border border-neutral-border-subtle">
                <span className="text-secondary-text block">الغرض</span>
                <span className="font-bold text-primary-text mt-1 block">
                  {PROPERTY_PURPOSE_LABELS[property.purpose]}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-warm-white border border-neutral-border-subtle">
                <span className="text-secondary-text block">المساحة الإجمالية</span>
                <span className="font-bold text-primary-text font-tabular mt-1 block">
                  {property.area} {property.areaUnit}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-warm-white border border-neutral-border-subtle">
                <span className="text-secondary-text block">حالة النشر</span>
                <span className="font-bold text-primary-text mt-1 block">
                  {statusCfg.label}
                </span>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="pt-4 border-t border-neutral-border-subtle flex items-center justify-around text-center text-xs">
              <div>
                <span className="text-secondary-text flex items-center justify-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> المشاهدات
                </span>
                <span className="font-bold text-primary-text font-tabular mt-1 block text-sm">
                  {property.viewsCount}
                </span>
              </div>
              <div className="h-6 w-[1px] bg-neutral-border" />
              <div>
                <span className="text-secondary-text flex items-center justify-center gap-1">
                  <MailCheck className="w-3.5 h-3.5" /> الاستفسارات
                </span>
                <span className="font-bold text-primary-text font-tabular mt-1 block text-sm">
                  {property.inquiriesCount}
                </span>
              </div>
            </div>
          </div>

          {/* Location Details Card */}
          <div className="p-6 rounded-2xl bg-surface border border-neutral-border shadow-xs text-right space-y-4">
            <div className="flex items-center gap-2 text-primary-text font-bold text-sm">
              <MapPin className="w-4 h-4 text-brand-gold-deep" />
              <span>الموقع والعنوان</span>
            </div>
            <div className="space-y-2 text-xs">
              <p className="text-primary-text">
                <strong>المنطقة:</strong> {property.location.area}، {property.location.city} ({property.location.country})
              </p>
              {property.location.streetAddress && (
                <p className="text-secondary-text leading-relaxed">
                  <strong>الوصف التفصيلي للموقع:</strong> {property.location.streetAddress}
                </p>
              )}
            </div>
          </div>

          {/* Specific Specs Card */}
          {property.category === "RESIDENTIAL" && property.specs.residential && (
            <div className="p-6 rounded-2xl bg-surface border border-neutral-border shadow-xs text-right space-y-3">
              <h4 className="font-bold text-sm text-primary-text">المواصفات السكنية</h4>
              <div className="space-y-2 text-xs divide-y divide-neutral-border-subtle">
                <div className="flex justify-between py-1.5">
                  <span className="text-secondary-text">غرف النوم:</span>
                  <strong className="text-primary-text font-tabular">{property.specs.residential.bedrooms}</strong>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-secondary-text">الحمامات:</span>
                  <strong className="text-primary-text font-tabular">{property.specs.residential.bathrooms}</strong>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-secondary-text">غرف المعيشة:</span>
                  <strong className="text-primary-text font-tabular">{property.specs.residential.livingRooms}</strong>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-secondary-text">الطابق:</span>
                  <strong className="text-primary-text font-tabular">الدور {property.specs.residential.floor} من {property.specs.residential.totalFloors}</strong>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-secondary-text">الفرش:</span>
                  <strong className="text-primary-text">{FURNISHING_LABELS[property.specs.residential.furnishing]}</strong>
                </div>
              </div>
            </div>
          )}

          {property.category === "COMMERCIAL" && property.specs.commercial && (
            <div className="p-6 rounded-2xl bg-surface border border-neutral-border shadow-xs text-right space-y-3">
              <h4 className="font-bold text-sm text-primary-text">المواصفات التجارية</h4>
              <div className="space-y-2 text-xs divide-y divide-neutral-border-subtle">
                <div className="flex justify-between py-1.5">
                  <span className="text-secondary-text">نوع العقار:</span>
                  <strong className="text-primary-text">{property.specs.commercial.commercialCategory}</strong>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-secondary-text">الأنشطة المناسبة:</span>
                  <strong className="text-primary-text">{property.specs.commercial.suitableActivity}</strong>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-secondary-text">عدد القاعات / المكاتب:</span>
                  <strong className="text-primary-text font-tabular">{property.specs.commercial.roomsCount}</strong>
                </div>
              </div>
            </div>
          )}

          {property.category === "AGRICULTURAL" && property.specs.agricultural && (
            <div className="p-6 rounded-2xl bg-surface border border-neutral-border shadow-xs text-right space-y-3">
              <h4 className="font-bold text-sm text-primary-text">المواصفات الزراعية</h4>
              <div className="space-y-2 text-xs divide-y divide-neutral-border-subtle">
                <div className="flex justify-between py-1.5">
                  <span className="text-secondary-text">تصنيف الأرض:</span>
                  <strong className="text-primary-text">{property.specs.agricultural.landClassification}</strong>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-secondary-text">مصدر المياه:</span>
                  <strong className="text-primary-text">{property.specs.agricultural.waterSource || "متوفر"}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="تأكيد حذف العقار"
        description={`هل أنت متأكد من حذف العقار (${property.code})؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف نهائي"
        variant="destructive"
        requirePassword={true}
      />
    </div>
  </ProtectedRoute>
  );
}
