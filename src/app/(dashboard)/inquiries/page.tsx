"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MailCheck,
  Mail,
  Clock,
  CheckCircle2,
  MessageSquare,
  Phone,
  Eye,
  X,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { MockStore, subscribeToMockStore } from "@/lib/services/mock-store";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { SearchFilterBar } from "@/components/shared/search-filter-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { ActionTooltip } from "@/components/shared/action-tooltip";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { useToast } from "@/components/shared/toast-provider";
import { INQUIRY_STATUS_CONFIG, INQUIRY_TYPE_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import { Inquiry, InquiryStatus } from "@/types/inquiry";
import { useDebounce } from "@/lib/hooks/use-debounce";

const PAGE_SIZE = 5;

export default function InquiriesPage() {
  const { success } = useToast();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(MockStore.isLoading());
  const [isTableLoading, setIsTableLoading] = useState(true);
  const [totalInquiries, setTotalInquiries] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Search & Filters
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Details & Reply Modal
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [replyNotes, setReplyNotes] = useState("");

  useEffect(() => {
    setIsLoading(MockStore.isLoading());
    const unsubscribe = subscribeToMockStore(() => {
      setIsLoading(MockStore.isLoading());
      if (selectedInquiry) {
        const found = MockStore.getInquiries().find((i) => i.id === selectedInquiry.id);
        if (found) setSelectedInquiry({ ...found });
      }
    });
    return unsubscribe;
  }, [selectedInquiry]);

  // Reset page on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, typeFilter]);

  // Execute Backend API Query on search / filter / page change
  useEffect(() => {
    let cancelled = false;
    setIsTableLoading(true);

    MockStore.queryInquiries({
      search: debouncedSearch,
      status: statusFilter,
      type: typeFilter,
      page: currentPage,
      limit: PAGE_SIZE,
    })
      .then((res) => {
        if (!cancelled) {
          setInquiries(res.items);
          setTotalInquiries(res.total);
          setTotalPages(res.totalPages);
          setIsTableLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setIsTableLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, statusFilter, typeFilter, currentPage]);

  // Statistics from central store or live query
  const allInquiries = MockStore.getInquiries();
  const effectiveInquiries = allInquiries.length > 0 ? allInquiries : inquiries;
  const totalCount = Math.max(allInquiries.length, totalInquiries);
  const newCount = effectiveInquiries.filter((i) => i.status === "NEW").length;
  const inProgressCount = effectiveInquiries.filter((i) => i.status === "IN_PROGRESS").length;
  const repliedCount = effectiveInquiries.filter((i) => i.status === "REPLIED").length;

  const handleUpdateStatus = (inq: Inquiry, newStatus: InquiryStatus, note?: string) => {
    MockStore.updateInquiryStatus(inq.id, newStatus, note);
    success("تم تحديث حالة الاستفسار", `تم تحويل الاستفسار إلى (${INQUIRY_STATUS_CONFIG[newStatus].label}).`);
  };

  const handleSaveReply = () => {
    if (!selectedInquiry || !replyNotes.trim()) return;
    const updated = MockStore.updateInquiryStatus(selectedInquiry.id, "REPLIED", replyNotes.trim());
    if (updated) setSelectedInquiry({ ...updated });
    setReplyNotes("");
    success("تم تسجيل الرد", "تم حفظ الرد وتحديث حالة الرسالة إلى 'تم الرد' وإشعار العميل على الموقع.");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <PageHeader
        title="صندوق استفسارات ورسائل الموقع"
        description="إدارة رسائل واستفسارات الزوار الواردة عبر نماذج التواصل وصفحات العقارات، وتوثيق الردود والمتابعات."
        breadcrumbs={[{ label: "استفسارات الموقع" }]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="إجمالي الرسائل"
          value={totalCount}
          icon={Mail}
          subtitle="صندوق الوارد الكلي"
          variant="gold"
          loading={isLoading}
        />
        <StatCard
          title="رسائل جديدة لم تقرأ"
          value={newCount}
          icon={Clock}
          subtitle="تتطلب استجابة سريعة"
          variant="warning"
          loading={isLoading}
        />
        <StatCard
          title="قيد المتابعة"
          value={inProgressCount}
          icon={MessageSquare}
          subtitle="جارٍ التواصل مع العميل"
          variant="info"
          loading={isLoading}
        />
        <StatCard
          title="تم الرد والمعالجة"
          value={repliedCount}
          icon={CheckCircle2}
          subtitle="استفسارات منجزة"
          variant="success"
          loading={isLoading}
        />
      </div>

      {/* Search & Filter Toolbar */}
      <SearchFilterBar
        searchPlaceholder="بحث باسم المرسل، رقم الهاتف، أو نص الرسالة..."
        searchValue={search}
        onSearchChange={setSearch}
        isFiltered={Boolean(search) || statusFilter !== "ALL" || typeFilter !== "ALL"}
        onReset={() => {
          setSearch("");
          setStatusFilter("ALL");
          setTypeFilter("ALL");
        }}
        totalResults={totalInquiries}
        filters={[
          {
            id: "status",
            label: "كل حالات الرسائل",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: "جديد لم يُقرأ", value: "NEW" },
              { label: "قيد المتابعة", value: "IN_PROGRESS" },
              { label: "تم الرد", value: "REPLIED" },
              { label: "مغلق", value: "CLOSED" },
            ],
          },
          {
            id: "type",
            label: "كل أنواع الاستفسارات",
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
              { label: "استفسار عن عقار محدد", value: "PROPERTY_INQUIRY" },
              { label: "طلب تسعير / عرض أسعار", value: "PRICE_REQUEST" },
              { label: "تواصل عام", value: "GENERAL_CONTACT" },
              { label: "شراكة أو عرض مطور", value: "PARTNERSHIP" },
            ],
          },
        ]}
      />

      {/* Inquiries Table */}
      {isTableLoading || isLoading ? (
        <TableSkeleton rows={PAGE_SIZE} columns={7} message="جاري جلب استفسارات ورسائل الموقع..." />
      ) : (
        <div className="rounded-2xl bg-surface border border-neutral-border shadow-xs overflow-hidden">
          {inquiries.length > 0 ? (
            <>
              <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-zinc-50 border-b border-neutral-border text-secondary-text font-semibold select-none">
                  <tr>
                    <th className="py-3.5 px-4">المرسل وبيانات الاتصال</th>
                    <th className="py-3.5 px-4">نوع الاستفسار</th>
                    <th className="py-3.5 px-4">موضوع الرسالة والعقار</th>
                    <th className="py-3.5 px-4">الحالة</th>
                    <th className="py-3.5 px-4">الموظف المسند إليه</th>
                    <th className="py-3.5 px-4">تاريخ الإرسال</th>
                    <th className="py-3.5 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-border-subtle">
                  {inquiries.map((inq) => {
                    const statusCfg = INQUIRY_STATUS_CONFIG[inq.status];
                    return (
                      <tr
                        key={inq.id}
                        className={`hover:bg-zinc-50/70 transition-colors ${
                          inq.status === "NEW" ? "bg-amber-50/30" : ""
                        }`}
                      >
                        {/* Sender */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-bold text-primary-text block">{inq.senderName}</span>
                          <span className="text-[11px] text-secondary-text font-tabular dir-ltr block mt-0.5">
                            {inq.senderPhone}
                          </span>
                        </td>

                        {/* Type */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="text-xs font-medium text-brand-gold-deep bg-brand-gold-light px-2.5 py-1 rounded-lg">
                            {INQUIRY_TYPE_LABELS[inq.type]}
                          </span>
                        </td>

                        {/* Subject & Message Preview */}
                        <td className="py-3 px-4 max-w-xs">
                          <span className="font-semibold text-primary-text block truncate">{inq.subject}</span>
                          <p className="text-[11px] text-secondary-text truncate mt-0.5">{inq.message}</p>
                          {inq.relatedPropertyTitle && (
                            <Link
                              href={`/properties/${inq.relatedPropertyId}`}
                              className="text-[10px] font-semibold text-brand-gold-deep hover:underline mt-1 block truncate cursor-pointer"
                            >
                              🔗 {inq.relatedPropertyTitle}
                            </Link>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <StatusBadge label={statusCfg.label} variant={statusCfg.color} />
                        </td>

                        {/* Assigned Employee */}
                        <td className="py-3 px-4 whitespace-nowrap text-xs text-primary-text">
                          {inq.assignedEmployeeName || "غير محدد"}
                        </td>

                        {/* Submission Date */}
                        <td className="py-3 px-4 whitespace-nowrap text-secondary-text text-xs">
                          {formatDateTime(inq.submittedAt)}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <ActionTooltip label="قراءة الرسالة الكاملة والرد" variant="gold">
                              <button
                                onClick={() => {
                                  setSelectedInquiry(inq);
                                  if (inq.status === "NEW") {
                                    MockStore.updateInquiryStatus(inq.id, "IN_PROGRESS");
                                  }
                                }}
                                className="p-1.5 text-secondary-text hover:text-brand-gold-deep hover:bg-brand-gold/10 rounded-lg transition-colors cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </ActionTooltip>

                            <ActionTooltip label="رد سريع عبر واتساب" variant="emerald">
                              <a
                                href={`https://wa.me/${inq.senderPhone.replace(/[^0-9]/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </a>
                            </ActionTooltip>

                            <ActionTooltip label="اتصال هاتفي مباشر" variant="blue">
                              <a
                                href={`tel:${inq.senderPhone}`}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Phone className="w-4 h-4" />
                              </a>
                            </ActionTooltip>
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
                  {Math.min(currentPage * PAGE_SIZE, totalInquiries)}
                </span>{" "}
                من أصل{" "}
                <span className="font-bold text-primary-text font-tabular">
                  {totalInquiries}
                </span>{" "}
                استفسار
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
            icon={MailCheck}
            title="لا توجد رسائل مطابقة"
            description="لم يتم العثور على أي استفسارات أو رسائل تطابق محددات البحث."
            actionLabel="إعادة ضبط الفلاتر"
            onAction={() => {
              setSearch("");
              setStatusFilter("ALL");
              setTypeFilter("ALL");
            }}
            className="my-6"
          />
        )}
      </div>
      )}

      {/* Inquiry Detail and Reply Modal */}
      {selectedInquiry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedInquiry(null)}
        >
          <div
            className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl bg-surface border border-neutral-border p-6 shadow-xl text-right animate-in zoom-in-95 duration-150 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-border-subtle shrink-0">
              <div>
                <h3 className="text-base font-bold text-primary-text">{selectedInquiry.subject}</h3>
                <p className="text-xs text-secondary-text mt-0.5">
                  تاريخ الإرسال: {formatDateTime(selectedInquiry.submittedAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="p-1 text-secondary-text hover:text-primary-text rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 flex-1 pr-1">
              {/* Sender Details Card */}
              <div className="grid grid-cols-2 gap-3 text-xs p-3.5 rounded-xl bg-warm-white border border-neutral-border-subtle">
                <div>
                  <span className="text-secondary-text block">اسم المرسل:</span>
                  <strong className="text-primary-text block mt-0.5">{selectedInquiry.senderName}</strong>
                </div>
                <div>
                  <span className="text-secondary-text block">رقم الهاتف:</span>
                  <strong className="text-primary-text font-tabular dir-ltr block mt-0.5">
                    {selectedInquiry.senderPhone}
                  </strong>
                </div>
                <div>
                  <span className="text-secondary-text block">البريد الإلكتروني:</span>
                  <span className="text-primary-text dir-ltr block mt-0.5">
                    {selectedInquiry.senderEmail || "غير متوفر"}
                  </span>
                </div>
                <div>
                  <span className="text-secondary-text block">نوع الاستفسار:</span>
                  <strong className="text-primary-text block mt-0.5">
                    {INQUIRY_TYPE_LABELS[selectedInquiry.type]}
                  </strong>
                </div>
              </div>

              {/* Message Body */}
              <div className="p-4 rounded-xl bg-zinc-50 border border-neutral-border text-xs leading-relaxed">
                <span className="font-bold text-secondary-text block mb-1">نص الرسالة:</span>
                <p className="text-primary-text whitespace-pre-wrap">{selectedInquiry.message}</p>
              </div>

              {/* Related Property if any */}
              {selectedInquiry.relatedPropertyTitle && (
                <div className="p-3 rounded-xl bg-brand-gold-light border border-brand-gold/30 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-secondary-text block text-[11px]">الاستفسار بخصوص العقار:</span>
                    <strong className="text-brand-charcoal">{selectedInquiry.relatedPropertyTitle}</strong>
                  </div>
                  <Link
                    href={`/properties/${selectedInquiry.relatedPropertyId}`}
                    className="px-3 py-1 bg-brand-gold text-brand-charcoal font-semibold rounded-lg hover:bg-brand-gold-hover transition-colors cursor-pointer"
                  >
                    معاينة العقار
                  </Link>
                </div>
              )}

              {/* Internal Notes / Previous Reply */}
              {selectedInquiry.replyNotes && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                  <span className="font-bold text-emerald-900 block mb-1">
                    الملاحظات المسجلة / تم الرد بتاريخ: {formatDateTime(selectedInquiry.repliedAt || "")}
                  </span>
                  <p className="text-emerald-800">{selectedInquiry.replyNotes}</p>
                </div>
              )}

              {/* Reply / Documentation Input */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-primary-text">
                  توثيق الملاحظات أو نص الرد الذي تم إرساله للعميل:
                </label>
                <textarea
                  value={replyNotes}
                  onChange={(e) => setReplyNotes(e.target.value)}
                  placeholder="مثال: تم الاتصال بالعميل وشرح خطة السداد وإرسال الكتالوج عبر واتساب..."
                  rows={3}
                  className="w-full p-3 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold resize-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-border-subtle flex items-center justify-between shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdateStatus(selectedInquiry, "CLOSED")}
                  className="px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                >
                  إغلاق وأرشفة الاستفسار
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedInquiry(null)}
                  className="px-4 py-2 text-xs font-semibold text-secondary-text hover:bg-zinc-100 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveReply}
                  disabled={!replyNotes.trim()}
                  className="px-4 py-2 text-xs font-semibold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover rounded-xl disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
                >
                  حفظ وتأكيد الرد
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
