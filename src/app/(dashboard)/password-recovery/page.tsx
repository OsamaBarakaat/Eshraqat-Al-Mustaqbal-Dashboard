"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Search,
  MapPin,
  ChevronRight,
  ChevronLeft,
  X,
  FileText,
  Loader2,
} from "lucide-react";
import { MockStore } from "@/lib/services/mock-store";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { useToast } from "@/components/shared/toast-provider";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { PASSWORD_RECOVERY_STATUS_CONFIG } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import {
  PasswordRecoveryRequest,
  PasswordRecoveryStatus,
} from "@/types/recovery";
import { useDebounce } from "@/lib/hooks/use-debounce";

const PAGE_SIZE = 10;

export default function PasswordRecoveryPage() {
  const { success, error, info } = useToast();

  const [requests, setRequests] = useState<PasswordRecoveryRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalRequests, setTotalRequests] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // Action Dialogs
  const [activeRequest, setActiveRequest] = useState<PasswordRecoveryRequest | null>(null);
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | "VIEW" | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvedResult, setApprovedResult] = useState<PasswordRecoveryRequest | null>(null);

  // Reset page when search or status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  // Load requests
  const loadRequests = useCallback(() => {
    setIsLoading(true);
    MockStore.queryPasswordRecoveryRequests({
      search: debouncedSearch,
      status: statusFilter === "ALL" ? undefined : (statusFilter as PasswordRecoveryStatus),
      page: currentPage,
      limit: PAGE_SIZE,
    })
      .then((res) => {
        setRequests(res.items);
        setTotalRequests(res.total);
        setTotalPages(res.totalPages);
      })
      .catch((err) => {
        console.error("Error loading recovery requests:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [debouncedSearch, statusFilter, currentPage]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Quick stats
  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const approvedCount = requests.filter((r) => r.status === "APPROVED" || r.status === "COMPLETED").length;
  const rejectedCount = requests.filter((r) => r.status === "REJECTED").length;

  const handleOpenAction = (request: PasswordRecoveryRequest, type: "APPROVE" | "REJECT" | "VIEW") => {
    setActiveRequest(request);
    setActionType(type);
    setAdminNotes(request.adminNotes || "");
    setApprovedResult(null);
  };

  const handleCloseModal = () => {
    setActiveRequest(null);
    setActionType(null);
    setAdminNotes("");
    setApprovedResult(null);
  };

  const handleConfirmAction = async () => {
    if (!activeRequest || !actionType || actionType === "VIEW") return;

    if (actionType === "REJECT" && !adminNotes.trim()) {
      error("تنبيه", "يرجى كتابة سبب الرفض لتوضيح السبب في السجل.");
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await MockStore.reviewPasswordRecoveryRequest(
        activeRequest.id,
        actionType === "APPROVE" ? "APPROVED" : "REJECTED",
        adminNotes.trim() || undefined
      );

      if (actionType === "APPROVE") {
        setApprovedResult(updated);
        success("تمت الموافقة بنجاح", `تم إنشاء رابط الاستعادة الآمن للعميل (${activeRequest.client?.name || activeRequest.requestedEmail}).`);
      } else {
        success("تم الرفض", `تم رفض طلب استعادة كلمة المرور.`);
        handleCloseModal();
      }

      loadRequests();
    } catch (err: any) {
      error("حدث خطأ", err?.message || "فشلت معالجة الطلب. يرجى المحاولة لاحقاً.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    info("تم النسخ", "تم نسخ رابط استعادة كلمة المرور إلى الحافظة.");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir="rtl">
      {/* Page Header */}
      <PageHeader
        title="طلبات استعادة كلمة المرور"
        description="إدارة ومراجعة طلبات استعادة الحسابات للعملاء وتوليد روابط إعادة التعيين الآمنة أحادية الاستخدام."
        breadcrumbs={[
          { label: "الرئيسية", href: "/dashboard" },
          { label: "العملاء", href: "/clients" },
          { label: "طلبات استعادة كلمة المرور" },
        ]}
      />

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي الطلبات"
          value={totalRequests}
          icon={KeyRound}
          variant="gold"
          subtitle="جميع الطلبات المسجلة في النظام"
        />
        <StatCard
          title="بانتظار المراجعة"
          value={pendingCount}
          icon={Clock}
          variant="warning"
          subtitle="تتطلب تدقيق وموافقة المشرف"
        />
        <StatCard
          title="تمت الموافقة"
          value={approvedCount}
          icon={ShieldCheck}
          variant="success"
          subtitle="روابط استعادة مفعلة أو مكتملة"
        />
        <StatCard
          title="مرفوضة"
          value={rejectedCount}
          icon={ShieldAlert}
          variant="default"
          subtitle="طلبات مرفوضة من قبل الإدارة"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface rounded-2xl border border-neutral-border p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-secondary-text absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="البحث بالاسم، البريد أو رقم الهاتف..."
              className="w-full pr-10 pl-4 py-2 bg-zinc-50 border border-neutral-border rounded-xl text-sm text-primary-text placeholder-secondary-text focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {[
              { id: "ALL", label: "الكل" },
              { id: "PENDING", label: "قيد المراجعة" },
              { id: "APPROVED", label: "تمت الموافقة" },
              { id: "REJECTED", label: "مرفوضة" },
              { id: "COMPLETED", label: "مكتملة" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                  statusFilter === tab.id
                    ? "bg-[#C5A059] text-black font-semibold shadow-xs"
                    : "bg-zinc-100 text-secondary-text hover:bg-zinc-200/70 hover:text-primary-text"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <TableSkeleton rows={PAGE_SIZE} columns={6} message="جاري تحميل طلبات استعادة كلمة المرور..." />
      ) : (
        <div className="rounded-2xl bg-surface border border-neutral-border shadow-xs overflow-hidden">
          {requests.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs sm:text-sm">
                  <thead className="bg-zinc-50 border-b border-neutral-border text-secondary-text font-semibold select-none">
                    <tr>
                      <th className="py-3.5 px-4">العميل / الحساب</th>
                      <th className="py-3.5 px-4">المعرف المطلوب</th>
                      <th className="py-3.5 px-4">تاريخ الطلب</th>
                      <th className="py-3.5 px-4">الحالة</th>
                      <th className="py-3.5 px-4">المراجعة</th>
                      <th className="py-3.5 px-4 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-border-subtle">
                    {requests.map((req) => {
                      const cfg = PASSWORD_RECOVERY_STATUS_CONFIG[req.status] || {
                        label: req.status,
                        color: "neutral",
                      };
                      return (
                        <tr key={req.id} className="hover:bg-zinc-50/70 transition-colors">
                          {/* Client Info */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-bold text-primary-text block">
                              {req.client?.name || "عميل غير مسجل"}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-secondary-text">
                              {req.client?.region && (
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-[#C5A059]" />
                                  {req.client.region}
                                </span>
                              )}
                              {req.client?.phone && (
                                <span className="dir-ltr font-tabular">
                                  {req.client.phone}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Identifier */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="space-y-0.5">
                              {req.requestedEmail && (
                                <span className="text-xs text-primary-text font-medium block dir-ltr text-right">
                                  {req.requestedEmail}
                                </span>
                              )}
                              {req.requestedPhone && (
                                <span className="text-[11px] text-secondary-text font-tabular block dir-ltr text-right">
                                  {req.requestedPhone}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Date */}
                          <td className="py-3 px-4 whitespace-nowrap text-xs text-secondary-text">
                            <span className="font-tabular block">{formatDateTime(req.createdAt)}</span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <StatusBadge
                              label={cfg.label}
                              variant={cfg.color as any}
                              size="sm"
                            />
                          </td>

                          {/* Reviewer */}
                          <td className="py-3 px-4 whitespace-nowrap text-xs text-secondary-text">
                            {req.reviewedBy ? (
                              <div>
                                <span className="font-medium text-primary-text block">
                                  {req.reviewedBy.name}
                                </span>
                                {req.reviewedAt && (
                                  <span className="text-[11px] font-tabular">
                                    {formatDateTime(req.reviewedAt)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-zinc-400">بانتظار المراجعة</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {req.status === "PENDING" ? (
                                <PermissionGuard module="clients" action="edit">
                                  <button
                                    onClick={() => handleOpenAction(req, "APPROVE")}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    موافقة
                                  </button>
                                  <button
                                    onClick={() => handleOpenAction(req, "REJECT")}
                                    className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    رفض
                                  </button>
                                </PermissionGuard>
                              ) : (
                                <button
                                  onClick={() => handleOpenAction(req, "VIEW")}
                                  className="px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 text-xs font-medium flex items-center gap-1 transition-colors"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  التفاصيل
                                </button>
                              )}

                              {/* Direct Copy Button for Approved Requests */}
                              {(req.status === "APPROVED" || req.status === "COMPLETED") && req.resetUrl && (
                                <button
                                  onClick={() => copyToClipboard(req.resetUrl!)}
                                  title="نسخ رابط الاستعادة"
                                  className="p-1.5 rounded-lg text-secondary-text hover:text-[#C5A059] hover:bg-zinc-100 transition-colors"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 border-t border-neutral-border text-xs text-secondary-text">
                  <span>
                    عرض الصفحة {currentPage} من {totalPages} (إجمالي {totalRequests} طلب)
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1 rounded-lg hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <span className="px-2 font-medium">{currentPage}</span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1 rounded-lg hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={KeyRound}
              title="لا توجد طلبات استعادة مطابقة"
              description="لم يتم العثور على أي طلبات استعادة تطابق معايير البحث الحالية."
            />
          )}
        </div>
      )}

      {/* Action / Detail Modal */}
      {activeRequest && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg bg-surface rounded-2xl border border-neutral-border shadow-xl overflow-hidden animate-in zoom-in-95 duration-200"
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-border bg-zinc-50/50">
              <div className="flex items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    actionType === "APPROVE"
                      ? "bg-emerald-50 text-emerald-600"
                      : actionType === "REJECT"
                      ? "bg-rose-50 text-rose-600"
                      : "bg-[#C5A059]/10 text-[#C5A059]"
                  }`}
                >
                  {actionType === "APPROVE" ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : actionType === "REJECT" ? (
                    <XCircle className="w-5 h-5" />
                  ) : (
                    <KeyRound className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-primary-text">
                    {actionType === "APPROVE"
                      ? "الموافقة على طلب الاستعادة"
                      : actionType === "REJECT"
                      ? "رفض طلب الاستعادة"
                      : "تفاصيل طلب استعادة كلمة المرور"}
                  </h3>
                  <p className="text-xs text-secondary-text">
                    العميل: {activeRequest.client?.name || activeRequest.requestedEmail}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 rounded-lg text-secondary-text hover:text-primary-text hover:bg-zinc-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-sm">
              {/* Client Info Summary */}
              <div className="p-3.5 bg-zinc-50 rounded-xl border border-neutral-border-subtle space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-secondary-text">الاسم الكامل:</span>
                  <span className="font-bold text-primary-text">{activeRequest.client?.name || "غير متوفر"}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-secondary-text">البريد الإلكتروني:</span>
                  <span className="font-mono text-primary-text dir-ltr">{activeRequest.client?.email || activeRequest.requestedEmail || "-"}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-secondary-text">رقم الهاتف:</span>
                  <span className="font-mono text-primary-text dir-ltr">{activeRequest.client?.phone || activeRequest.requestedPhone || "-"}</span>
                </div>
                {activeRequest.client?.region && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-secondary-text">المنطقة:</span>
                    <span className="text-primary-text">{activeRequest.client.region}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-secondary-text">تاريخ الطلب:</span>
                  <span className="text-primary-text font-tabular">{formatDateTime(activeRequest.createdAt)}</span>
                </div>
              </div>

              {/* Approval Success State (Displays Reset URL) */}
              {approvedResult?.resetUrl ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>تم توليد رابط إعادة التعيين بنجاح!</span>
                    </div>
                    <p className="text-xs text-emerald-700 leading-relaxed">
                      تم إرسال بريد إلكتروني للعميل عبر Resend (في حال تفعيل الخدمة)، كما يمكنك نسخ الرابط المباشر وإرساله للعميل يدوياً:
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        readOnly
                        value={approvedResult.resetUrl}
                        className="w-full text-xs font-mono bg-white border border-emerald-300 rounded-lg px-3 py-2 text-emerald-900 select-all"
                      />
                      <button
                        onClick={() => copyToClipboard(approvedResult.resetUrl!)}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors shadow-xs"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        نسخ
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-secondary-text flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>صلاحية الرابط: 24 ساعة من وقت الاعتماد، ويُستخدم لمرة واحدة فقط.</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Notes / Reason input for Approve / Reject */}
                  {actionType !== "VIEW" && (
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-primary-text">
                        {actionType === "APPROVE" ? "ملاحظات إدارية (اختياري):" : "سبب الرفض (إلزامي):"}
                      </label>
                      <textarea
                        rows={3}
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder={
                          actionType === "APPROVE"
                            ? "ملاحظات مرجعية للمشرفين..."
                            : "اكتب سبب رفض الطلب للتسجيل والمراجعة..."
                        }
                        className="w-full p-3 bg-zinc-50 border border-neutral-border rounded-xl text-xs text-primary-text placeholder-secondary-text focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors"
                      />
                    </div>
                  )}

                  {/* View Details details */}
                  {actionType === "VIEW" && (
                    <div className="space-y-3">
                      {activeRequest.adminNotes && (
                        <div className="p-3 bg-zinc-50 rounded-xl border border-neutral-border-subtle">
                          <span className="block text-xs font-semibold text-secondary-text mb-1">الملاحظات الإدارية:</span>
                          <p className="text-xs text-primary-text">{activeRequest.adminNotes}</p>
                        </div>
                      )}

                      {activeRequest.resetUrl && (
                        <div className="p-3 bg-zinc-50 rounded-xl border border-neutral-border-subtle space-y-1.5">
                          <span className="block text-xs font-semibold text-secondary-text">رابط الاستعادة الأمني:</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              readOnly
                              value={activeRequest.resetUrl}
                              className="w-full text-xs font-mono bg-white border border-neutral-border rounded-lg px-2.5 py-1.5 text-primary-text select-all"
                            />
                            <button
                              onClick={() => copyToClipboard(activeRequest.resetUrl!)}
                              className="px-2.5 py-1.5 bg-[#C5A059] hover:bg-[#B38E46] text-black rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              نسخ
                            </button>
                          </div>
                        </div>
                      )}

                      {activeRequest.reviewedBy && (
                        <div className="text-xs text-secondary-text flex items-center justify-between pt-1">
                          <span>المراجع: {activeRequest.reviewedBy.name}</span>
                          {activeRequest.reviewedAt && (
                            <span className="font-tabular">{formatDateTime(activeRequest.reviewedAt)}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-neutral-border bg-zinc-50/50">
              {approvedResult ? (
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-[#C5A059] text-black font-semibold rounded-xl text-xs hover:bg-[#B38E46] transition-colors"
                >
                  إغلاق
                </button>
              ) : actionType === "VIEW" ? (
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-zinc-200 text-zinc-800 font-medium rounded-xl text-xs hover:bg-zinc-300 transition-colors"
                >
                  إغلاق
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-secondary-text hover:text-primary-text text-xs font-medium transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleConfirmAction}
                    disabled={isSubmitting}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 ${
                      actionType === "APPROVE"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-rose-600 hover:bg-rose-700 text-white"
                    }`}
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{actionType === "APPROVE" ? "تأكيد الموافقة وتوليد الرابط" : "تأكيد الرفض"}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
