"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Clock,
  CheckCircle,
  XCircle,
  UserCheck,
  Eye,
  X,
  UserX,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
} from "lucide-react";
import { MockStore, subscribeToMockStore } from "@/lib/services/mock-store";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { SearchFilterBar } from "@/components/shared/search-filter-bar";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ActionTooltip } from "@/components/shared/action-tooltip";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { useToast } from "@/components/shared/toast-provider";
import { APPOINTMENT_STATUS_CONFIG } from "@/lib/constants";
import { formatDate, cn } from "@/lib/utils";
import { Appointment } from "@/types/appointment";
import { AdminUser } from "@/types/team";
import { useDebounce } from "@/lib/hooks/use-debounce";

const PAGE_SIZE = 5;

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

export default function AppointmentsPage() {
  const { success, warning, info } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [employees, setEmployees] = useState<AdminUser[]>(MockStore.getUsers());
  const [isLoading, setIsLoading] = useState(MockStore.isLoading());
  const [isTableLoading, setIsTableLoading] = useState(true);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Search & Filters
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [employeeFilter, setEmployeeFilter] = useState("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Dialogs State
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [storeVersion, setStoreVersion] = useState(0);

  useEffect(() => {
    setIsLoading(MockStore.isLoading());
    const unsubscribe = subscribeToMockStore(() => {
      setEmployees(MockStore.getUsers());
      setIsLoading(MockStore.isLoading());
      setStoreVersion((v) => v + 1);
    });
    return unsubscribe;
  }, []);

  // Fetch Appointments Callback (Direct Backend + Store Sync)
  const fetchAppointments = useCallback(async () => {
    setIsTableLoading(true);
    try {
      const res = await MockStore.queryAppointments({
        search: debouncedSearch,
        status: statusFilter,
        assignedEmployeeId: employeeFilter,
        page: currentPage,
        limit: PAGE_SIZE,
      });
      setAppointments(res.items);
      setTotalAppointments(res.total);
      setTotalPages(res.totalPages);
    } catch {
      // keep existing
    } finally {
      setIsTableLoading(false);
    }
  }, [debouncedSearch, statusFilter, employeeFilter, currentPage]);

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, employeeFilter]);

  // Execute query on search / filter / page change
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Global KPI Statistics (Reactive to store changes & local operations)
  const allAppointments = useMemo(() => {
    if (storeVersion < 0) return [];
    return MockStore.getAppointments();
  }, [storeVersion]);
  const pendingCount = allAppointments.filter((a) => a.status === "PENDING_CONFIRMATION").length;
  const confirmedCount = allAppointments.filter((a) => a.status === "CONFIRMED").length;
  const completedCount = allAppointments.filter((a) => a.status === "COMPLETED").length;
  const rejectedOrCancelledCount = allAppointments.filter(
    (a) => a.status === "REJECTED" || a.status === "CANCELLED"
  ).length;

  // Actions with Instant UI Update + Backend Refetch
  const handleConfirm = async (appt: Appointment) => {
    // 1. Instant optimistic state update
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appt.id ? { ...a, status: "CONFIRMED", updatedAt: new Date().toISOString() } : a
      )
    );
    success("تم تأكيد موعد المعاينة", `تم تأكيد موعد المعاينة للعميل (${appt.customerName}) بنجاح.`);

    // 2. Persist to Backend database
    await MockStore.updateAppointmentStatus(appt.id, "CONFIRMED");

    // 3. Refetch to guarantee 100% sync
    await fetchAppointments();
    setStoreVersion((v) => v + 1);
  };

  const handleOpenReject = (appt: Appointment) => {
    setSelectedAppointment(appt);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async (reason?: string) => {
    if (!selectedAppointment) return;
    const targetId = selectedAppointment.id;
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === targetId ? { ...a, status: "REJECTED", rejectionReason: reason, updatedAt: new Date().toISOString() } : a
      )
    );
    setRejectDialogOpen(false);
    warning("تم رفض طلب المعاينة", `تم تسجيل سبب الرفض وإشعار مسؤولي المبيعات.`);

    await MockStore.updateAppointmentStatus(targetId, "REJECTED", reason);
    await fetchAppointments();
    setStoreVersion((v) => v + 1);
  };

  const handleOpenCancel = (appt: Appointment) => {
    setSelectedAppointment(appt);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async (reason?: string) => {
    if (!selectedAppointment) return;
    const targetId = selectedAppointment.id;
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === targetId ? { ...a, status: "CANCELLED", cancellationReason: reason, updatedAt: new Date().toISOString() } : a
      )
    );
    setCancelDialogOpen(false);
    info("تم إلغاء الموعد", `تم إلغاء موعد المعاينة للعميل (${selectedAppointment.customerName}).`);

    await MockStore.updateAppointmentStatus(targetId, "CANCELLED", reason);
    await fetchAppointments();
    setStoreVersion((v) => v + 1);
  };

  const handleMarkCompleted = async (appt: Appointment) => {
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appt.id ? { ...a, status: "COMPLETED", updatedAt: new Date().toISOString() } : a
      )
    );
    success("اكتملت المعاينة", `تم وضع علامة "مكتمل" للمعاينة الميدانية.`);

    await MockStore.updateAppointmentStatus(appt.id, "COMPLETED");
    await fetchAppointments();
    setStoreVersion((v) => v + 1);
  };

  const handleMarkNoShow = async (appt: Appointment) => {
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appt.id ? { ...a, status: "NO_SHOW", updatedAt: new Date().toISOString() } : a
      )
    );
    warning("لم يحضر العميل", `تم تسجيل تخلف العميل عن الحضور في الموعد المحدد.`);

    await MockStore.updateAppointmentStatus(appt.id, "NO_SHOW");
    await fetchAppointments();
    setStoreVersion((v) => v + 1);
  };

  const handleOpenAssign = (appt: Appointment) => {
    setSelectedAppointment(appt);
    setSelectedEmployeeId(appt.assignedEmployeeId || "");
    setAssignModalOpen(true);
  };

  const handleSaveAssign = async () => {
    if (!selectedAppointment || !selectedEmployeeId) return;
    const emp = employees.find((e) => e.id === selectedEmployeeId);
    if (!emp) return;
    const targetId = selectedAppointment.id;

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === targetId
          ? {
              ...a,
              assignedEmployeeId: emp.id,
              assignedEmployeeName: emp.name,
              updatedAt: new Date().toISOString(),
            }
          : a
      )
    );
    setAssignModalOpen(false);
    success("تم تعيين الموظف المسؤول", `تم إسناد المعاينة إلى (${emp.name}).`);

    await MockStore.assignAppointmentEmployee(targetId, emp.id, emp.name);
    await fetchAppointments();
    setStoreVersion((v) => v + 1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <PageHeader
        title="إدارة طلبات المعاينة والمواعيد"
        description="متابعة وتأكيد طلبات المعاينة الواردة من موقع إشراقة المستقبل، جدولة المواعيد الميدانية، وتعيين مسؤولي المبيعات."
        breadcrumbs={[{ label: "المعاينات" }]}
        primaryAction={
          <button
            onClick={() => fetchAppointments()}
            disabled={isTableLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-neutral-surface border border-neutral-border text-foreground hover:bg-neutral-surface-hover hover:border-[#C5A059]/40 transition-colors cursor-pointer disabled:opacity-50"
            title="تحديث قائمة المعاينات من الخادم"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-[#C5A059]", isTableLoading && "animate-spin")} />
            <span>تحديث المواعيد</span>
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="طلبات معلقة بانتظار التأكيد"
          value={pendingCount}
          icon={Clock}
          subtitle="تتطلب مراجعة فورية"
          variant="warning"
          loading={isLoading}
        />
        <StatCard
          title="معاينات مؤكدة ومجدولة"
          value={confirmedCount}
          icon={CheckCircle}
          subtitle="جاهزة للتنفيذ الميداني"
          variant="success"
          loading={isLoading}
        />
        <StatCard
          title="معاينات مكتملة"
          value={completedCount}
          icon={UserCheck}
          subtitle="تمت المعاينة بنجاح"
          variant="info"
          loading={isLoading}
        />
        <StatCard
          title="مرفوضة / ملغاة"
          value={rejectedOrCancelledCount}
          icon={XCircle}
          subtitle="اعتذار أو تعارض مواعيد"
          variant="default"
          loading={isLoading}
        />
      </div>

      {/* Search & Filter Toolbar */}
      <SearchFilterBar
        searchPlaceholder="بحث باسم العميل، رقم الهاتف، أو اسم العقار..."
        searchValue={search}
        onSearchChange={setSearch}
        isFiltered={Boolean(search) || statusFilter !== "ALL" || employeeFilter !== "ALL"}
        onReset={() => {
          setSearch("");
          setStatusFilter("ALL");
          setEmployeeFilter("ALL");
        }}
        totalResults={totalAppointments}
        filters={[
          {
            id: "status",
            label: "كل حالات المواعيد",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: "في انتظار التأكيد", value: "PENDING_CONFIRMATION" },
              { label: "مؤكد", value: "CONFIRMED" },
              { label: "مكتمل", value: "COMPLETED" },
              { label: "مرفوض", value: "REJECTED" },
              { label: "ملغي", value: "CANCELLED" },
              { label: "لم يحضر العميل", value: "NO_SHOW" },
            ],
          },
          {
            id: "employee",
            label: "كل الموظفين المسؤولين",
            value: employeeFilter,
            onChange: setEmployeeFilter,
            options: employees.map((e) => ({ label: e.name, value: e.id })),
          },
        ]}
      />

      {/* Appointments Table */}
      {isTableLoading || isLoading ? (
        <TableSkeleton rows={PAGE_SIZE} columns={7} message="جاري جلب قائمة طلبات المعاينة والمواعيد..." />
      ) : (
        <div className="rounded-2xl bg-surface border border-neutral-border shadow-xs overflow-hidden">
          {appointments.length > 0 ? (
            <>
              <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-zinc-50 border-b border-neutral-border text-secondary-text font-semibold select-none">
                  <tr>
                    <th className="py-3.5 px-4">العميل ورقم الهاتف</th>
                    <th className="py-3.5 px-4">العقار المطلوب</th>
                    <th className="py-3.5 px-4">الموعد والتوقيت</th>
                    <th className="py-3.5 px-4">الحالة</th>
                    <th className="py-3.5 px-4">الموظف المسؤول</th>
                    <th className="py-3.5 px-4">تاريخ الطلب</th>
                    <th className="py-3.5 px-4 text-center">إجراءات الموعد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-border-subtle">
                  {appointments.map((appt) => {
                    const statusCfg = APPOINTMENT_STATUS_CONFIG[appt.status];
                    return (
                      <tr key={appt.id} className="hover:bg-zinc-50/70 transition-colors">
                        {/* Customer */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-bold text-primary-text block">{appt.customerName}</span>
                          <span className="text-[11px] text-secondary-text font-tabular dir-ltr block mt-0.5">
                            {appt.customerPhone}
                          </span>
                        </td>

                        {/* Property */}
                        <td className="py-3 px-4 max-w-xs">
                          <span className="font-mono text-[11px] font-semibold text-brand-gold-deep block">
                            {appt.propertyCode}
                          </span>
                          <Link
                            href={`/properties/${appt.propertyId}`}
                            className="font-medium text-primary-text hover:text-brand-gold-deep transition-colors line-clamp-1 mt-0.5 cursor-pointer"
                            title={appt.propertyTitle}
                          >
                            {appt.propertyTitle}
                          </Link>
                          <span className="text-[11px] text-secondary-text truncate block">
                            {appt.propertyLocation}
                          </span>
                        </td>

                        {/* Requested Date & Time (12 Hour format) */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-bold text-primary-text font-tabular">
                            <CalendarDays className="w-3.5 h-3.5 text-brand-gold-deep shrink-0" />
                            <span>{appt.requestedDate}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-secondary-text text-xs font-tabular mt-0.5 mr-5">
                            <Clock className="w-3 h-3 text-secondary-text" />
                            <span>الساعة {formatTo12Hour(appt.requestedTime)}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <StatusBadge label={statusCfg.label} variant={statusCfg.color} />
                        </td>

                        {/* Assigned Employee */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {appt.assignedEmployeeName ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-primary-text font-medium text-xs">
                                {appt.assignedEmployeeName}
                              </span>
                              <button
                                onClick={() => handleOpenAssign(appt)}
                                className="text-[10px] text-brand-gold-deep hover:underline cursor-pointer"
                              >
                                (تغيير)
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenAssign(appt)}
                              className="px-2.5 py-1 text-[11px] font-medium text-brand-gold-deep bg-brand-gold-light hover:bg-[#F3EBD8] rounded-lg transition-colors border border-brand-gold/30 cursor-pointer"
                            >
                              + تعيين موظف
                            </button>
                          )}
                        </td>

                        {/* Created date */}
                        <td className="py-3 px-4 whitespace-nowrap text-secondary-text text-xs">
                          {formatDate(appt.createdAt)}
                        </td>

                        {/* Actions based on current status */}
                        <td className="py-3 px-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Details Button */}
                            <ActionTooltip label="عرض تفاصيل الموعد والملاحظات" variant="gold">
                              <button
                                onClick={() => {
                                  setSelectedAppointment(appt);
                                  setDetailsModalOpen(true);
                                }}
                                className="p-1.5 text-secondary-text hover:text-brand-gold-deep hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </ActionTooltip>

                            {/* PENDING: Confirm or Reject */}
                            {appt.status === "PENDING_CONFIRMATION" && (
                              <>
                                <ActionTooltip label="تأكيد موعد المعاينة وإشعار العميل" variant="emerald">
                                  <button
                                    onClick={() => handleConfirm(appt)}
                                    className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors cursor-pointer"
                                  >
                                    تأكيد
                                  </button>
                                </ActionTooltip>

                                <ActionTooltip label="اعتذار ورفض طلب المعاينة" variant="rose">
                                  <button
                                    onClick={() => handleOpenReject(appt)}
                                    className="px-2.5 py-1 text-xs font-semibold text-rose-800 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors cursor-pointer"
                                  >
                                    رفض
                                  </button>
                                </ActionTooltip>
                              </>
                            )}

                            {/* CONFIRMED: Mark Completed, Cancel, or No-Show */}
                            {appt.status === "CONFIRMED" && (
                              <>
                                <ActionTooltip label="تسجيل اكتمال المعاينة الميدانية" variant="blue">
                                  <button
                                    onClick={() => handleMarkCompleted(appt)}
                                    className="px-2.5 py-1 text-xs font-semibold text-blue-800 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors cursor-pointer"
                                  >
                                    اكتمل
                                  </button>
                                </ActionTooltip>

                                <ActionTooltip label="لم يحضر العميل في الموعد المحدد" variant="amber">
                                  <button
                                    onClick={() => handleMarkNoShow(appt)}
                                    className="p-1.5 text-secondary-text hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <UserX className="w-4 h-4" />
                                  </button>
                                </ActionTooltip>

                                <ActionTooltip label="إلغاء الموعد" variant="rose">
                                  <button
                                    onClick={() => handleOpenCancel(appt)}
                                    className="p-1.5 text-secondary-text hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </ActionTooltip>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-neutral-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-secondary-text">
              <div>
                عرض{" "}
                <span className="font-bold text-primary-text font-tabular">
                  {(currentPage - 1) * PAGE_SIZE + 1}
                </span>{" "}
                إلى{" "}
                <span className="font-bold text-primary-text font-tabular">
                  {Math.min(currentPage * PAGE_SIZE, totalAppointments)}
                </span>{" "}
                من أصل{" "}
                <span className="font-bold text-primary-text font-tabular">
                  {totalAppointments}
                </span>{" "}
                موعد
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-border bg-warm-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span>السابق</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        page === currentPage
                          ? "bg-brand-gold text-brand-charcoal"
                          : "text-secondary-text hover:bg-zinc-100"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-border bg-warm-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <span>التالي</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            icon={CalendarDays}
            title="لا توجد طلبات معاينة مطابقة"
            description="لم يتم العثور على أي مواعيد تطابق محددات البحث الحالية."
            actionLabel="إعادة ضبط الفلاتر"
            onAction={() => {
              setSearch("");
              setStatusFilter("ALL");
              setEmployeeFilter("ALL");
            }}
            className="my-6"
          />
        )}
      </div>
      )}

      {/* Appointment Details Modal */}
      {detailsModalOpen && selectedAppointment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
          onClick={() => setDetailsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl bg-surface border border-neutral-border p-6 shadow-xl text-right animate-in zoom-in-95 duration-150 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-border-subtle">
              <h3 className="text-base font-bold text-primary-text">تفاصيل طلب المعاينة</h3>
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="p-1 text-secondary-text hover:text-primary-text rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between py-1 border-b border-neutral-border-subtle">
                <span className="text-secondary-text">العميل:</span>
                <strong className="text-primary-text">{selectedAppointment.customerName}</strong>
              </div>

              <div className="flex justify-between py-1 border-b border-neutral-border-subtle">
                <span className="text-secondary-text">رقم الهاتف:</span>
                <strong className="text-primary-text font-tabular dir-ltr">{selectedAppointment.customerPhone}</strong>
              </div>

              {selectedAppointment.customerEmail && (
                <div className="flex justify-between py-1 border-b border-neutral-border-subtle">
                  <span className="text-secondary-text">البريد الإلكتروني:</span>
                  <span className="text-primary-text dir-ltr">{selectedAppointment.customerEmail}</span>
                </div>
              )}

              <div className="flex justify-between py-1 border-b border-neutral-border-subtle">
                <span className="text-secondary-text">العقار:</span>
                <strong className="text-primary-text text-left max-w-xs">{selectedAppointment.propertyTitle}</strong>
              </div>

              <div className="flex justify-between py-1 border-b border-neutral-border-subtle">
                <span className="text-secondary-text">الموعد المطلوب:</span>
                <strong className="text-primary-text font-tabular">
                  {selectedAppointment.requestedDate} الساعة {formatTo12Hour(selectedAppointment.requestedTime)}
                </strong>
              </div>

              <div className="flex justify-between py-1 border-b border-neutral-border-subtle">
                <span className="text-secondary-text">الحالة:</span>
                <StatusBadge
                  label={APPOINTMENT_STATUS_CONFIG[selectedAppointment.status].label}
                  variant={APPOINTMENT_STATUS_CONFIG[selectedAppointment.status].color}
                />
              </div>

              <div className="flex justify-between py-1 border-b border-neutral-border-subtle">
                <span className="text-secondary-text">الموظف المسؤول:</span>
                <strong className="text-primary-text">{selectedAppointment.assignedEmployeeName || "غير محدد"}</strong>
              </div>

              {selectedAppointment.notes && (
                <div className="py-2">
                  <span className="text-secondary-text block mb-1">ملاحظات العميل:</span>
                  <p className="p-3 rounded-xl bg-warm-white border border-neutral-border text-xs text-primary-text leading-relaxed">
                    {selectedAppointment.notes}
                  </p>
                </div>
              )}

              {selectedAppointment.rejectionReason && (
                <div className="py-2">
                  <span className="text-rose-700 font-semibold block mb-1">سبب الرفض:</span>
                  <p className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 leading-relaxed">
                    {selectedAppointment.rejectionReason}
                  </p>
                </div>
              )}

              {selectedAppointment.cancellationReason && (
                <div className="py-2">
                  <span className="text-zinc-700 font-semibold block mb-1">سبب الإلغاء:</span>
                  <p className="p-3 rounded-xl bg-zinc-100 border border-zinc-200 text-xs text-zinc-900 leading-relaxed">
                    {selectedAppointment.cancellationReason}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-neutral-border-subtle flex justify-end">
              <button
                onClick={() => setDetailsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-primary-text bg-zinc-100 hover:bg-zinc-200 rounded-xl cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Employee Dialog */}
      {assignModalOpen && selectedAppointment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
          onClick={() => setAssignModalOpen(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl bg-surface border border-neutral-border p-6 shadow-xl text-right animate-in zoom-in-95 duration-150 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-primary-text">إسناد المعاينة لمسؤول مبيعات</h3>
            <p className="text-xs text-secondary-text">
              اختر الموظف المسؤول عن مرافقة العميل ({selectedAppointment.customerName}) في المعاينة الميدانية.
            </p>

            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1.5">الموظف المسند إليه:</label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:ring-2 focus:ring-brand-gold cursor-pointer"
              >
                <option value="">-- اختر مسؤول مبيعات --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.department || "فريق المبيعات"})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2">
              <button
                onClick={() => setAssignModalOpen(false)}
                className="px-3 py-1.5 text-xs text-secondary-text hover:bg-zinc-100 rounded-lg border border-neutral-border cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveAssign}
                disabled={!selectedEmployeeId}
                className="px-4 py-1.5 text-xs font-semibold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover rounded-lg disabled:opacity-50 cursor-pointer"
              >
                حفظ التعيين
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Dialog with Required Reason */}
      <ConfirmDialog
        isOpen={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        onConfirm={handleRejectConfirm}
        title="رفض طلب المعاينة"
        description={`يرجى توضيح سبب رفض طلب المعاينة للعميل (${selectedAppointment?.customerName}) ليتم حفظه في السجلات.`}
        confirmLabel="رفض الطلب"
        cancelLabel="تراجع"
        variant="destructive"
        requireReason={true}
        reasonLabel="سبب رفض الطلب:"
        reasonPlaceholder="مثال: الموعد يتعارض مع صيانة العقار، أو تم حجز العقار بالفعل..."
      />

      {/* Cancel Dialog */}
      <ConfirmDialog
        isOpen={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={handleCancelConfirm}
        title="إلغاء موعد المعاينة"
        description={`هل أنت متأكد من إلغاء موعد المعاينة المؤكد للعميل (${selectedAppointment?.customerName})؟`}
        confirmLabel="إلغاء الموعد"
        cancelLabel="تراجع"
        variant="warning"
        requireReason={true}
        reasonLabel="سبب الإلغاء:"
        reasonPlaceholder="مثال: اعتذار العميل، ظرف طارئ..."
      />
    </div>
  );
}
