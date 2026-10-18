"use client";

import React, { useState, useEffect } from "react";
import {
  Download,
  Calendar,
  Building2,
  Users2,
  CalendarDays,
  MailCheck,
  Sparkles,
} from "lucide-react";
import { MockStore, subscribeToMockStore } from "@/lib/services/mock-store";
import { PageHeader } from "@/components/layout/page-header";
import { ProtectedRoute } from "@/components/shared/protected-route";
import { useToast } from "@/components/shared/toast-provider";
import {
  PROPERTY_STATUS_CONFIG,
  APPOINTMENT_STATUS_CONFIG,
  LEAD_STATUS_CONFIG,
} from "@/lib/constants";

export default function ReportsPage() {
  const { success } = useToast();

  const [properties, setProperties] = useState(MockStore.getProperties());
  const [appointments, setAppointments] = useState(MockStore.getAppointments());
  const [clients, setClients] = useState(MockStore.getClients());
  const [inquiries, setInquiries] = useState(MockStore.getInquiries());
  const [dateFilter, setDateFilter] = useState("THIS_MONTH");

  useEffect(() => {
    const unsubscribe = subscribeToMockStore(() => {
      setProperties(MockStore.getProperties());
      setAppointments(MockStore.getAppointments());
      setClients(MockStore.getClients());
      setInquiries(MockStore.getInquiries());
    });
    return unsubscribe;
  }, []);

  // Aggregations
  const propertiesByCategory = {
    RESIDENTIAL: properties.filter((p) => p.category === "RESIDENTIAL").length,
    COMMERCIAL: properties.filter((p) => p.category === "COMMERCIAL").length,
    AGRICULTURAL: properties.filter((p) => p.category === "AGRICULTURAL").length,
  };

  const propertiesByStatus = {
    PUBLISHED: properties.filter((p) => p.status === "PUBLISHED").length,
    DRAFT: properties.filter((p) => p.status === "DRAFT").length,
    SOLD: properties.filter((p) => p.status === "SOLD").length,
    RENTED: properties.filter((p) => p.status === "RENTED").length,
    ARCHIVED: properties.filter((p) => p.status === "ARCHIVED").length,
  };

  const appointmentsByStatus = {
    PENDING_CONFIRMATION: appointments.filter((a) => a.status === "PENDING_CONFIRMATION").length,
    CONFIRMED: appointments.filter((a) => a.status === "CONFIRMED").length,
    COMPLETED: appointments.filter((a) => a.status === "COMPLETED").length,
    REJECTED: appointments.filter((a) => a.status === "REJECTED").length,
    CANCELLED: appointments.filter((a) => a.status === "CANCELLED").length,
    NO_SHOW: appointments.filter((a) => a.status === "NO_SHOW").length,
  };

  const leadsByStatus = {
    NEW: clients.filter((c) => c.status === "NEW").length,
    CONTACTED: clients.filter((c) => c.status === "CONTACTED").length,
    QUALIFIED: clients.filter((c) => c.status === "QUALIFIED").length,
    CONVERTED: clients.filter((c) => c.status === "CONVERTED").length,
    LOST: clients.filter((c) => c.status === "LOST").length,
  };

  // CSV Export
  const handleExportCSV = () => {
    // UTF-8 BOM for Arabic excel compatibility
    const BOM = "\uFEFF";
    let csvContent = BOM + "النوع,العنوان / الاسم,الكود / الهاتف,الحالة,التاريخ\n";

    // Add properties
    properties.forEach((p) => {
      csvContent += `عقار,"${p.title.replace(/"/g, '""')}",${p.code},${PROPERTY_STATUS_CONFIG[p.status].label},${p.createdAt.slice(0, 10)}\n`;
    });

    // Add appointments
    appointments.forEach((a) => {
      csvContent += `معاينة,"${a.customerName}",${a.customerPhone},${APPOINTMENT_STATUS_CONFIG[a.status].label},${a.requestedDate}\n`;
    });

    // Add clients
    clients.forEach((c) => {
      csvContent += `عميل,"${c.name}",${c.phone},${LEAD_STATUS_CONFIG[c.status].label},${c.createdAt.slice(0, 10)}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `تقرير_إشراقة_المستقبل_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    success("تم تصدير ملف CSV بنجاح", "تم تحميل ملف الإحصائيات والبيانات بتنسيق CSV متوافق مع Excel.");
  };

  return (
    <ProtectedRoute module="reports" action="view">
      <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <PageHeader
        title="التقارير والإحصائيات العامة"
        description="ملخص مجمع لأداء الأعمال، تصنيفات العقارات، نسب التحويل، وحركة المواعيد مع إمكانية التصدير إلى CSV."
        breadcrumbs={[{ label: "التقارير" }]}
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-gold/15 text-brand-gold-deep border border-brand-gold/30">
            <Sparkles className="w-3.5 h-3.5" />
            بيانات تجريبية استرشادية
          </span>
        }
        primaryAction={
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>تصدير البيانات (CSV)</span>
          </button>
        }
      />

      {/* Date Filter Bar */}
      <div className="p-4 rounded-2xl bg-surface border border-neutral-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
        <div className="flex items-center gap-2 text-xs font-semibold text-primary-text">
          <Calendar className="w-4 h-4 text-brand-gold-deep" />
          <span>الفترة الزمنية للتقرير:</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDateFilter("ALL_TIME")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              dateFilter === "ALL_TIME"
                ? "bg-brand-charcoal text-white"
                : "bg-warm-white border border-neutral-border text-secondary-text hover:bg-zinc-100"
            }`}
          >
            جميع السجلات
          </button>
          <button
            onClick={() => setDateFilter("THIS_MONTH")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              dateFilter === "THIS_MONTH"
                ? "bg-brand-charcoal text-white"
                : "bg-warm-white border border-neutral-border text-secondary-text hover:bg-zinc-100"
            }`}
          >
            الشهر الحالي (أكتوبر 2026)
          </button>
          <button
            onClick={() => setDateFilter("THIS_QUARTER")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              dateFilter === "THIS_QUARTER"
                ? "bg-brand-charcoal text-white"
                : "bg-warm-white border border-neutral-border text-secondary-text hover:bg-zinc-100"
            }`}
          >
            الربع الرابع Q4
          </button>
        </div>
      </div>

      {/* Summary Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right">
        {/* 1. Properties Distribution Report */}
        <div className="p-5 rounded-2xl bg-surface border border-neutral-border shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-neutral-border-subtle">
            <Building2 className="w-5 h-5 text-brand-gold-deep" />
            <div>
              <h3 className="font-bold text-sm sm:text-base text-primary-text">
                توزيع العقارات حسب التصنيف والحالة
              </h3>
              <p className="text-xs text-secondary-text">إجمالي العقارات المسجلة: {properties.length} وحدة</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-primary-text text-xs mb-1">حسب التصنيف:</h4>
            <div className="flex justify-between p-2 rounded-lg bg-warm-white">
              <span>سكني (فيلات وشقق):</span>
              <strong className="font-tabular text-primary-text">{propertiesByCategory.RESIDENTIAL} وحدة</strong>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-warm-white">
              <span>تجاري وإداري:</span>
              <strong className="font-tabular text-primary-text">{propertiesByCategory.COMMERCIAL} وحدة</strong>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-warm-white">
              <span>أراضي وزراعي:</span>
              <strong className="font-tabular text-primary-text">{propertiesByCategory.AGRICULTURAL} وحدة</strong>
            </div>

            <h4 className="font-bold text-primary-text text-xs mt-3 mb-1">حسب حالة النشر:</h4>
            <div className="flex justify-between p-2 rounded-lg bg-emerald-50 text-emerald-900">
              <span>منشور ومعروض للجمهور:</span>
              <strong className="font-tabular">{propertiesByStatus.PUBLISHED}</strong>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-amber-50 text-amber-900">
              <span>مسودة تحت المراجعة:</span>
              <strong className="font-tabular">{propertiesByStatus.DRAFT}</strong>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-blue-50 text-blue-900">
              <span>تم البيع أو التأجير:</span>
              <strong className="font-tabular">{propertiesByStatus.SOLD + propertiesByStatus.RENTED}</strong>
            </div>
          </div>
        </div>

        {/* 2. Appointments Report */}
        <div className="p-5 rounded-2xl bg-surface border border-neutral-border shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-neutral-border-subtle">
            <CalendarDays className="w-5 h-5 text-brand-gold-deep" />
            <div>
              <h3 className="font-bold text-sm sm:text-base text-primary-text">
                مؤشرات طلبات المعاينة والزيارات
              </h3>
              <p className="text-xs text-secondary-text">إجمالي الطلبات الواردة: {appointments.length} طلب</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2.5 rounded-lg bg-amber-50 text-amber-900 font-semibold">
              <span>في انتظار التأكيد (معلقة):</span>
              <strong className="font-tabular">{appointmentsByStatus.PENDING_CONFIRMATION}</strong>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-emerald-50 text-emerald-900 font-semibold">
              <span>معاينات مؤكدة ومجدولة:</span>
              <strong className="font-tabular">{appointmentsByStatus.CONFIRMED}</strong>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-blue-50 text-blue-900 font-semibold">
              <span>معاينات تمت بنجاح (مكتملة):</span>
              <strong className="font-tabular">{appointmentsByStatus.COMPLETED}</strong>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-rose-50 text-rose-900 font-semibold">
              <span>طلبات مرفوضة:</span>
              <strong className="font-tabular">{appointmentsByStatus.REJECTED}</strong>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-zinc-100 text-zinc-800">
              <span>مواعيد ملغاة من العميل:</span>
              <strong className="font-tabular">{appointmentsByStatus.CANCELLED}</strong>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-rose-50 text-rose-900">
              <span>لم يحضر العميل (No-Show):</span>
              <strong className="font-tabular">{appointmentsByStatus.NO_SHOW}</strong>
            </div>
          </div>
        </div>

        {/* 3. CRM Leads by Stage */}
        <div className="p-5 rounded-2xl bg-surface border border-neutral-border shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-neutral-border-subtle">
            <Users2 className="w-5 h-5 text-brand-gold-deep" />
            <div>
              <h3 className="font-bold text-sm sm:text-base text-primary-text">
                مراحل تحويل العملاء (Leads Funnel)
              </h3>
              <p className="text-xs text-secondary-text">إجمالي العملاء: {clients.length} عميل</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2.5 rounded-lg bg-warm-white">
              <span>عملاء جدد (New):</span>
              <strong className="font-tabular text-primary-text">{leadsByStatus.NEW}</strong>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-warm-white">
              <span>تم التواصل التمهيدي (Contacted):</span>
              <strong className="font-tabular text-primary-text">{leadsByStatus.CONTACTED}</strong>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-[#FBF8F1] text-[#8A6729] font-bold">
              <span>عملاء مؤهلون وميزانية جاهزة (Qualified):</span>
              <strong className="font-tabular">{leadsByStatus.QUALIFIED}</strong>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-emerald-50 text-emerald-900 font-bold">
              <span>تم التعاقد وسداد الحجز (Converted):</span>
              <strong className="font-tabular">{leadsByStatus.CONVERTED}</strong>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-zinc-100 text-zinc-700">
              <span>فرص ضائعة أو معتذرون (Lost):</span>
              <strong className="font-tabular">{leadsByStatus.LOST}</strong>
            </div>
          </div>
        </div>

        {/* 4. Inquiries Summary */}
        <div className="p-5 rounded-2xl bg-surface border border-neutral-border shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-neutral-border-subtle">
            <MailCheck className="w-5 h-5 text-brand-gold-deep" />
            <div>
              <h3 className="font-bold text-sm sm:text-base text-primary-text">
                صندوق رسائل واستفسارات الموقع
              </h3>
              <p className="text-xs text-secondary-text">إجمالي الرسائل الواردة: {inquiries.length} رسالة</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2.5 rounded-lg bg-amber-50 text-amber-900 font-semibold">
              <span>رسائل جديدة بانتظار القراءة:</span>
              <strong className="font-tabular">{inquiries.filter((i) => i.status === "NEW").length}</strong>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-blue-50 text-blue-900 font-semibold">
              <span>قيد المتابعة والتجهيز:</span>
              <strong className="font-tabular">{inquiries.filter((i) => i.status === "IN_PROGRESS").length}</strong>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-emerald-50 text-emerald-900 font-semibold">
              <span>تم الرد على العميل:</span>
              <strong className="font-tabular">{inquiries.filter((i) => i.status === "REPLIED").length}</strong>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-zinc-100 text-zinc-700">
              <span>استفسارات مغلقة:</span>
              <strong className="font-tabular">{inquiries.filter((i) => i.status === "CLOSED").length}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ProtectedRoute>
  );
}
