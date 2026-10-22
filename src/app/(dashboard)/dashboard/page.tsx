"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  CalendarDays,
  MailCheck,
  Users2,
  MapPin,
  PlusCircle,
  Clock,
  CheckCircle,
  Eye,
  FileText,
  AlertCircle,
  ChevronLeft,
} from "lucide-react";
import { MockStore, subscribeToMockStore } from "@/lib/services/mock-store";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ActionTooltip } from "@/components/shared/action-tooltip";
import { DashboardCharts } from "@/features/dashboard/components/dashboard-charts";
import {
  PROPERTY_STATUS_CONFIG,
  INQUIRY_STATUS_CONFIG,
} from "@/lib/constants";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useToast } from "@/components/shared/toast-provider";

function formatTo12Hour(timeStr: string) {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  let hour = parseInt(parts[0], 10);
  const minute = parts[1];
  const ampm = hour >= 12 ? "م" : "ص";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${ampm}`;
}

export default function DashboardPage() {
  const { success } = useToast();
  const [stats, setStats] = useState(MockStore.getDashboardStats());
  const [appointments, setAppointments] = useState(MockStore.getAppointments());
  const [inquiries, setInquiries] = useState(MockStore.getInquiries());
  const [properties, setProperties] = useState(MockStore.getProperties());
  const [auditLog, setAuditLog] = useState(MockStore.getAuditLog());
  const [isLoading, setIsLoading] = useState(MockStore.isLoading());

  useEffect(() => {
    setIsLoading(MockStore.isLoading());
    const unsubscribe = subscribeToMockStore(() => {
      setStats(MockStore.getDashboardStats());
      setAppointments(MockStore.getAppointments());
      setInquiries(MockStore.getInquiries());
      setProperties(MockStore.getProperties());
      setAuditLog(MockStore.getAuditLog());
      setIsLoading(MockStore.isLoading());
    });
    return unsubscribe;
  }, []);

  const pendingAppointments = appointments.filter((a) => a.status === "PENDING_CONFIRMATION");
  const upcomingAppointments = appointments.filter((a) => a.status === "CONFIRMED").slice(0, 4);
  const recentInquiries = inquiries.slice(0, 4);
  const recentProperties = properties.slice(0, 4);

  const handleQuickConfirm = async (appointmentId: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === appointmentId ? { ...a, status: "CONFIRMED" } : a))
    );
    success("تم تأكيد موعد المعاينة بنجاح", "تم تحويل حالة الطلب إلى مؤكد وجدولته.");
    await MockStore.updateAppointmentStatus(appointmentId, "CONFIRMED");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <PageHeader
        title="لوحة التحكم والمؤشرات العامة"
        description="نظرة شاملة وسريعة على حركة العقارات، طلبات المعاينة الجديدة، والعملاء واستفسارات الموقع."
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            متصل بقاعدة البيانات الحية
          </span>
        }
        primaryAction={
          <Link
            href="/properties/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover rounded-xl shadow-xs shadow-brand-gold/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>إضافة عقار جديد</span>
          </Link>
        }
        secondaryActions={
          <Link
            href="/appointments"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-primary-text bg-surface hover:bg-zinc-100 border border-neutral-border rounded-xl transition-colors"
          >
            <CalendarDays className="w-4 h-4 text-brand-gold-deep" />
            <span>المعاينات ({stats.pendingAppointments})</span>
          </Link>
        }
      />

      {/* Top Level Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        <StatCard
          title="إجمالي العقارات"
          value={stats.totalProperties}
          icon={Building2}
          subtitle={`${stats.publishedProperties} منشور / ${stats.draftProperties} مسودة`}
          trend={{ value: 12, isPositive: true, label: "عن الشهر السابق" }}
          variant="gold"
          href="/properties"
          loading={isLoading}
        />

        <StatCard
          title="طلبات معاينة معلقة"
          value={stats.pendingAppointments}
          icon={Clock}
          subtitle="تحتاج مراجعة وتأكيد الموظف"
          trend={{ value: 25, isPositive: true, label: "طلبات نشطة" }}
          variant="warning"
          href="/appointments"
          loading={isLoading}
        />

        <StatCard
          title="معاينات مؤكدة"
          value={stats.upcomingAppointments}
          icon={CheckCircle}
          subtitle="مجدولة للمعاينة الميدانية"
          variant="success"
          href="/appointments"
          loading={isLoading}
        />

        <StatCard
          title="استفسارات الموقع الجديدة"
          value={stats.newInquiries}
          icon={MailCheck}
          subtitle="رسائل في صندوق الوارد"
          variant="info"
          href="/inquiries"
          loading={isLoading}
        />

        <StatCard
          title="العملاء المحتملون (Leads)"
          value={stats.totalClients}
          icon={Users2}
          subtitle={`${stats.convertedClients} عميل أتم التعاقد`}
          trend={{ value: 8, isPositive: true }}
          href="/clients"
          loading={isLoading}
        />

        <StatCard
          title="المواقع والمناطق الجغرافية"
          value={stats.totalDistricts !== undefined ? `${stats.totalDistricts} حي` : "0 حي"}
          icon={MapPin}
          subtitle={
            (stats.totalCities ?? 0) > 0 || (stats.totalProvinces ?? 0) > 0
              ? `${stats.totalCities ?? 0} مدينة • ${stats.totalProvinces ?? 0} مناطق`
              : "شجرة التوزيع الجغرافي بالسعودية"
          }
          href="/locations"
          loading={isLoading}
        />

        <StatCard
          title="العقارات المنشورة"
          value={stats.publishedProperties}
          icon={Eye}
          subtitle="معروضة للبيع والإيجار"
          href="/properties?status=PUBLISHED"
          loading={isLoading}
        />

        <StatCard
          title="المسودات والمؤرشفة"
          value={stats.draftProperties + stats.archivedProperties}
          icon={FileText}
          subtitle="قيد المراجعة أو غير منشورة"
          href="/properties"
          loading={isLoading}
        />
      </div>

      {/* Analytics Charts */}
      <DashboardCharts />

      {/* Urgent Attention: Pending Viewing Requests */}
      {pendingAppointments.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-amber-950">
                  طلبات معاينة عاجلة بانتظار التأكيد ({pendingAppointments.length})
                </h3>
                <p className="text-xs text-amber-800/90 mt-0.5">
                  يرجى مراجعة وتأكيد مواعيد المعاينات قبل تواصل العميل أو انتهاء الفترة الزمنية.
                </p>
              </div>
            </div>

            <Link
              href="/appointments"
              className="text-xs font-bold text-amber-900 hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <span>عرض جميع المواعيد</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingAppointments.map((appt) => (
              <div
                key={appt.id}
                className="p-4 rounded-xl bg-white border border-amber-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="text-right overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-primary-text">{appt.customerName}</span>
                    <span className="text-[11px] text-secondary-text font-tabular dir-ltr">{appt.customerPhone}</span>
                  </div>
                  <p className="text-xs text-secondary-text mt-1 truncate" title={appt.propertyTitle}>
                    {appt.propertyTitle}
                  </p>
                  <p className="text-[11px] font-medium text-amber-800 mt-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    الموعد المقترح: {appt.requestedDate} الساعة {formatTo12Hour(appt.requestedTime)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <ActionTooltip label="تأكيد الموعد فوراً" variant="emerald">
                    <button
                      onClick={() => handleQuickConfirm(appt.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors cursor-pointer"
                    >
                      تأكيد المعاينة
                    </button>
                  </ActionTooltip>
                  <Link
                    href="/appointments"
                    className="px-3 py-1.5 text-xs font-medium text-secondary-text bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
                  >
                    التفاصيل
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Grid: Upcoming Appointments & Latest Website Inquiries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Inquiries */}
        <div className="p-5 rounded-2xl bg-surface border border-neutral-border shadow-xs text-right flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-primary-text">
                  أحدث استفسارات ورسائل الموقع
                </h3>
                <p className="text-xs text-secondary-text mt-0.5">رسائل الزوار ونماذج الاتصال الواردة</p>
              </div>
              <Link
                href="/inquiries"
                className="text-xs font-semibold text-brand-gold-deep hover:underline flex items-center gap-1"
              >
                <span>صندوق الوارد</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-neutral-border-subtle">
              {isLoading ? (
                <div className="space-y-3 py-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="py-2 animate-pulse space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="h-4 w-28 bg-zinc-200 rounded-md" />
                        <div className="h-3 w-16 bg-zinc-200 rounded-md" />
                      </div>
                      <div className="h-3 w-3/4 bg-zinc-200 rounded-md" />
                      <div className="h-2.5 w-1/2 bg-zinc-100 rounded-md" />
                    </div>
                  ))}
                </div>
              ) : recentInquiries.length > 0 ? (
                recentInquiries.map((inq) => {
                  const statusCfg = INQUIRY_STATUS_CONFIG[inq.status];
                  return (
                    <div key={inq.id} className="py-3 flex items-start justify-between gap-3">
                      <div className="overflow-hidden flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs sm:text-sm text-primary-text">{inq.senderName}</span>
                          <StatusBadge label={statusCfg.label} variant={statusCfg.color} size="sm" />
                        </div>
                        <p className="text-xs text-primary-text font-medium mt-1 truncate">{inq.subject}</p>
                        <p className="text-xs text-secondary-text mt-0.5 line-clamp-1">{inq.message}</p>
                      </div>
                      <span className="text-[10px] text-muted-text whitespace-nowrap shrink-0 mt-1">
                        {formatDateTime(inq.submittedAt)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-secondary-text py-6 text-center">لا توجد رسائل أو استفسارات حالياً.</p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-border-subtle text-left">
            <Link
              href="/inquiries"
              className="text-xs font-semibold text-brand-gold-deep hover:text-brand-charcoal transition-colors inline-flex items-center gap-1"
            >
              <span>الانتقال لإدارة الاستفسارات والردود</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Upcoming Confirmed Appointments */}
        <div className="p-5 rounded-2xl bg-surface border border-neutral-border shadow-xs text-right flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-primary-text">
                  المعاينات القادمة المؤكدة
                </h3>
                <p className="text-xs text-secondary-text mt-0.5">زيارات مجدولة مع مستشاري المبيعات</p>
              </div>
              <Link
                href="/appointments"
                className="text-xs font-semibold text-brand-gold-deep hover:underline flex items-center gap-1"
              >
                <span>جدول المواعيد</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-neutral-border-subtle">
              {isLoading ? (
                <div className="space-y-3 py-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="py-2 animate-pulse space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="h-4 w-28 bg-zinc-200 rounded-md" />
                        <div className="h-3 w-20 bg-zinc-200 rounded-md" />
                      </div>
                      <div className="h-3 w-1/2 bg-zinc-200 rounded-md" />
                      <div className="h-2.5 w-1/3 bg-zinc-100 rounded-md" />
                    </div>
                  ))}
                </div>
              ) : upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((appt) => (
                  <div key={appt.id} className="py-3 flex items-start justify-between gap-3">
                    <div className="overflow-hidden flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs sm:text-sm text-primary-text">{appt.customerName}</span>
                        <StatusBadge label="مؤكد" variant="success" size="sm" />
                      </div>
                      <p className="text-xs text-secondary-text mt-1 truncate">{appt.propertyTitle}</p>
                      <p className="text-[11px] text-brand-gold-deep mt-0.5 font-medium">
                        المسؤول: {appt.assignedEmployeeName || "غير محدد"}
                      </p>
                    </div>

                    <div className="text-left shrink-0">
                      <span className="text-xs font-bold text-primary-text font-tabular block">{appt.requestedDate}</span>
                      <span className="text-[11px] text-secondary-text font-tabular">{formatTo12Hour(appt.requestedTime)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-secondary-text py-6 text-center">لا توجد مواعيد مؤكدة مجدولة حالياً.</p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-border-subtle text-left">
            <Link
              href="/appointments"
              className="text-xs font-semibold text-brand-gold-deep hover:text-brand-charcoal transition-colors inline-flex items-center gap-1"
            >
              <span>فتح سجل المعاينات الكامل</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Recent Properties & Admin Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Properties (2 Cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-surface border border-neutral-border shadow-xs text-right">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-primary-text">
                أحدث العقارات المسجلة
              </h3>
              <p className="text-xs text-secondary-text mt-0.5">آخر الوحدات المعروضة على المنصة</p>
            </div>
            <Link
              href="/properties"
              className="text-xs font-semibold text-brand-gold-deep hover:underline flex items-center gap-1"
            >
              <span>كافة العقارات</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-xl border border-neutral-border-subtle p-3 animate-pulse space-y-3 bg-warm-white/50">
                  <div className="aspect-video rounded-lg bg-zinc-200" />
                  <div className="h-3 w-16 bg-zinc-200 rounded-md" />
                  <div className="h-4 w-3/4 bg-zinc-200 rounded-md" />
                  <div className="h-3 w-1/3 bg-zinc-200 rounded-md" />
                </div>
              ))}
            </div>
          ) : recentProperties.length === 0 ? (
            <div className="p-8 text-center bg-warm-white/40 rounded-xl border border-dashed border-neutral-border text-xs text-secondary-text">
              لا توجد عقارات مضافة بعد. يمكنك النقر على &quot;إضافة عقار جديد&quot; لبدء إضافة عقاراتك.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentProperties.map((prop) => {
                const statusCfg = PROPERTY_STATUS_CONFIG[prop.status];
                return (
                  <Link
                    key={prop.id}
                    href={`/properties/${prop.id}`}
                    className="group rounded-xl border border-neutral-border-subtle p-3 hover:border-brand-gold/40 hover:shadow-xs transition-all bg-warm-white/50 block"
                  >
                    <div className="relative aspect-video rounded-lg overflow-hidden mb-2.5 bg-zinc-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={prop.images[0]?.url}
                        alt={prop.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2">
                        <StatusBadge label={statusCfg.label} variant={statusCfg.color} size="sm" />
                      </div>
                      {prop.originalPrice && prop.originalPrice > prop.price && prop.discountPercentage && (
                        <div className="absolute top-2 left-2">
                          <span className="px-1.5 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-bold shadow-xs">
                            خصم {prop.discountPercentage}%
                          </span>
                        </div>
                      )}
                    </div>

                    <span className="text-[11px] font-mono font-semibold text-brand-gold-deep">{prop.code}</span>
                    <h4 className="font-bold text-xs sm:text-sm text-primary-text truncate mt-0.5 group-hover:text-brand-gold-deep transition-colors">
                      {prop.title}
                    </h4>
                    {prop.originalPrice && prop.originalPrice > prop.price ? (
                      <div className="flex items-center gap-1.5 mt-1 font-tabular">
                        <span className="text-xs font-bold text-emerald-600">
                          {formatCurrency(prop.price)}
                        </span>
                        <span className="text-[10px] text-zinc-400 line-through">
                          {formatCurrency(prop.originalPrice)}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs font-semibold text-primary-text font-tabular mt-1">
                        {formatCurrency(prop.price)}
                      </p>
                    )}
                    <p className="text-[11px] text-secondary-text mt-0.5 truncate">{prop.location.area}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Audit Activity Log (1 Col) */}
        <div className="p-5 rounded-2xl bg-surface border border-neutral-border shadow-xs text-right">
          <div className="mb-4">
            <h3 className="font-bold text-sm sm:text-base text-primary-text">
              سجل النشاط الإداري الأخير
            </h3>
            <p className="text-xs text-secondary-text mt-0.5">عمليات الموظفين والمشرفين باللوحة (حي ومباشر)</p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="relative pr-4 border-r-2 border-zinc-200 animate-pulse space-y-2">
                  <span className="absolute -right-[5px] top-1.5 w-2 h-2 rounded-full bg-zinc-300" />
                  <div className="h-3.5 w-24 bg-zinc-200 rounded-md" />
                  <div className="h-3 w-40 bg-zinc-200 rounded-md" />
                  <div className="flex justify-between">
                    <div className="h-2.5 w-16 bg-zinc-100 rounded-md" />
                    <div className="h-2.5 w-12 bg-zinc-100 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : auditLog.length === 0 ? (
            <div className="p-6 text-center bg-warm-white/40 rounded-xl border border-dashed border-neutral-border text-xs text-secondary-text">
              لا توجد عمليات إدارية مسجلة بعد في قاعدة البيانات.
            </div>
          ) : (
            <div className="space-y-4">
              {auditLog.slice(0, 5).map((log) => (
                <div key={log.id} className="relative pr-4 border-r-2 border-brand-gold/40">
                  <span className="absolute -right-[5px] top-1.5 w-2 h-2 rounded-full bg-brand-gold" />
                  <p className="font-semibold text-xs text-primary-text leading-tight">{log.action}</p>
                  <p className="text-[11px] text-secondary-text mt-0.5 truncate" title={log.targetTitle}>
                    {log.targetTitle}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-muted-text mt-1">
                    <span>{log.actorName}</span>
                    <span>{formatDateTime(log.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
