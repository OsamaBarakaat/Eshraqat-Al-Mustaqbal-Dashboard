"use client";

import React, { useState, useEffect } from "react";
import {
  Users2,
  Phone,
  MessageSquare,
  Clock,
  Eye,
  CheckCircle,
  UserCheck,
  X,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { MockStore, subscribeToMockStore } from "@/lib/services/mock-store";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { SearchFilterBar } from "@/components/shared/search-filter-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { ActionTooltip } from "@/components/shared/action-tooltip";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { useToast } from "@/components/shared/toast-provider";
import { LEAD_STATUS_CONFIG, LEAD_SOURCE_LABELS } from "@/lib/constants";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/utils";
import { Client, LeadStatus } from "@/types/client";
import { useDebounce } from "@/lib/hooks/use-debounce";

const PAGE_SIZE = 5;

export default function ClientsPage() {
  const { success } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(MockStore.isLoading());
  const [isTableLoading, setIsTableLoading] = useState(true);
  const [totalClients, setTotalClients] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Search & Filters
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Client Details & Timeline Modal
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    setIsLoading(MockStore.isLoading());
    const unsubscribe = subscribeToMockStore(() => {
      setIsLoading(MockStore.isLoading());
      if (selectedClient) {
        const updated = MockStore.getClientById(selectedClient.id);
        if (updated) setSelectedClient({ ...updated });
      }
    });
    return unsubscribe;
  }, [selectedClient]);

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, sourceFilter]);

  // Execute Backend API Query on search / filter / page change
  useEffect(() => {
    let cancelled = false;
    setIsTableLoading(true);

    MockStore.queryClients({
      search: debouncedSearch,
      status: statusFilter,
      source: sourceFilter,
      page: currentPage,
      limit: PAGE_SIZE,
    })
      .then((res) => {
        if (!cancelled) {
          setClients(res.items);
          setTotalClients(res.total);
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
  }, [debouncedSearch, statusFilter, sourceFilter, currentPage]);

  // Statistics from central store
  const allClients = MockStore.getClients();
  const totalCount = allClients.length;
  const newCount = allClients.filter((c) => c.status === "NEW").length;
  const qualifiedCount = allClients.filter((c) => c.status === "QUALIFIED").length;
  const convertedCount = allClients.filter((c) => c.status === "CONVERTED").length;

  const handleStatusChange = (client: Client, newStatus: LeadStatus) => {
    MockStore.updateClientStatus(client.id, newStatus);
    success("تم تحديث حالة العميل", `تم تحويل العميل (${client.name}) إلى (${LEAD_STATUS_CONFIG[newStatus].label}).`);
  };

  const handleAddNote = () => {
    if (!selectedClient || !newNote.trim()) return;
    MockStore.addClientTimelineNote(selectedClient.id, newNote.trim());
    setNewNote("");
    success("تمت إضافة الملاحظة", "تم تسجيل نشاط المتابعة في سجل العميل.");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <PageHeader
        title="إدارة العملاء (CRM)"
        description="سجل متابعة العملاء المهتمين بالعقارات، مصادر جذب العملاء، سجل التواصل والملاحظات الميدانية."
        breadcrumbs={[{ label: "العملاء" }]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="إجمالي العملاء المسجلين"
          value={totalCount}
          icon={Users2}
          subtitle="قاعدة بيانات العملاء"
          variant="gold"
          loading={isLoading}
        />
        <StatCard
          title="عملاء جدد"
          value={newCount}
          icon={Clock}
          subtitle="بانتظار أول اتصال تمهيدي"
          variant="warning"
          loading={isLoading}
        />
        <StatCard
          title="عملاء مؤهلون وجادون"
          value={qualifiedCount}
          icon={UserCheck}
          subtitle="ميزانية نقدية جاهزة"
          variant="default"
          loading={isLoading}
        />
        <StatCard
          title="تم التعاقد والبيع"
          value={convertedCount}
          icon={CheckCircle}
          subtitle="صفقات ناجحة مكتملة"
          variant="success"
          loading={isLoading}
        />
      </div>

      {/* Search & Filter Toolbar */}
      <SearchFilterBar
        searchPlaceholder="بحث باسم العميل، رقم الهاتف، أو العقار المهتم به..."
        searchValue={search}
        onSearchChange={setSearch}
        isFiltered={Boolean(search) || statusFilter !== "ALL" || sourceFilter !== "ALL"}
        onReset={() => {
          setSearch("");
          setStatusFilter("ALL");
          setSourceFilter("ALL");
        }}
        totalResults={totalClients}
        filters={[
          {
            id: "status",
            label: "كل حالات العملاء",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: "عميل جديد", value: "NEW" },
              { label: "تم التواصل", value: "CONTACTED" },
              { label: "عميل مؤهل", value: "QUALIFIED" },
              { label: "تم التعاقد / حجز", value: "CONVERTED" },
              { label: "فرصة ضائعة", value: "LOST" },
            ],
          },
          {
            id: "source",
            label: "كل مصادر العملاء",
            value: sourceFilter,
            onChange: setSourceFilter,
            options: [
              { label: "استفسار موقع", value: "WEBSITE_INQUIRY" },
              { label: "واتساب", value: "WHATSAPP" },
              { label: "اتصال هاتفي", value: "PHONE_CALL" },
              { label: "توصية / ترشيح", value: "REFERRAL" },
            ],
          },
        ]}
      />

      {/* Clients Table */}
      {isTableLoading || isLoading ? (
        <TableSkeleton rows={PAGE_SIZE} columns={8} message="جاري جلب بيانات العملاء المحتملين..." />
      ) : (
        <div className="rounded-2xl bg-surface border border-neutral-border shadow-xs overflow-hidden">
          {clients.length > 0 ? (
            <>
              <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-zinc-50 border-b border-neutral-border text-secondary-text font-semibold select-none">
                  <tr>
                    <th className="py-3.5 px-4">اسم العميل</th>
                    <th className="py-3.5 px-4">بيانات الاتصال</th>
                    <th className="py-3.5 px-4">العقار المهتم به</th>
                    <th className="py-3.5 px-4">المصدر</th>
                    <th className="py-3.5 px-4">حالة العميل</th>
                    <th className="py-3.5 px-4">المسؤول</th>
                    <th className="py-3.5 px-4">آخر نشاط</th>
                    <th className="py-3.5 px-4 text-center">إجراءات سريعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-border-subtle">
                  {clients.map((client) => {
                    return (
                      <tr key={client.id} className="hover:bg-zinc-50/70 transition-colors">
                        {/* Name */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-bold text-primary-text block">{client.name}</span>
                          {client.budgetMax ? (
                            <span className="text-[11px] text-secondary-text">
                              الميزانية: حتى {formatCurrency(client.budgetMax)}
                            </span>
                          ) : null}
                        </td>

                        {/* Contact */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-tabular font-medium text-primary-text dir-ltr block text-xs">
                            {client.phone}
                          </span>
                          {client.email && (
                            <span className="text-[11px] text-secondary-text dir-ltr block">
                              {client.email}
                            </span>
                          )}
                        </td>

                        {/* Property */}
                        <td className="py-3 px-4 max-w-xs">
                          {client.interestedPropertyTitle ? (
                            <span className="font-medium text-primary-text line-clamp-1">
                              {client.interestedPropertyTitle}
                            </span>
                          ) : (
                            <span className="text-secondary-text text-xs">غير محدد</span>
                          )}
                        </td>

                        {/* Source */}
                        <td className="py-3 px-4 whitespace-nowrap text-secondary-text text-xs">
                          {LEAD_SOURCE_LABELS[client.source] || client.source}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <select
                            value={client.status}
                            onChange={(e) => handleStatusChange(client, e.target.value as LeadStatus)}
                            className="py-1 px-2 text-xs font-semibold rounded-lg border border-neutral-border bg-warm-white focus:ring-2 focus:ring-brand-gold cursor-pointer"
                          >
                            <option value="NEW">عميل جديد</option>
                            <option value="CONTACTED">تم التواصل</option>
                            <option value="QUALIFIED">عميل مؤهل</option>
                            <option value="CONVERTED">تم التعاقد</option>
                            <option value="LOST">فرصة ضائعة</option>
                          </select>
                        </td>

                        {/* Assigned Employee */}
                        <td className="py-3 px-4 whitespace-nowrap text-xs text-primary-text font-medium">
                          {client.assignedEmployeeName || "غير محدد"}
                        </td>

                        {/* Last Activity */}
                        <td className="py-3 px-4 whitespace-nowrap text-secondary-text text-xs">
                          {formatDate(client.lastActivityAt)}
                        </td>

                        {/* Quick Contact & Details Actions */}
                        <td className="py-3 px-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Details & Timeline */}
                            <ActionTooltip label="عرض سجل وتفاصيل العميل والملاحظات" variant="gold">
                              <button
                                onClick={() => setSelectedClient(client)}
                                className="p-1.5 text-secondary-text hover:text-brand-gold-deep hover:bg-brand-gold/10 rounded-lg transition-colors cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </ActionTooltip>

                            {/* WhatsApp link */}
                            <ActionTooltip label="بدء محادثة واتساب فورية" variant="emerald">
                              <a
                                href={`https://wa.me/${client.phone.replace(/[^0-9]/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </a>
                            </ActionTooltip>

                            {/* Phone Call */}
                            <ActionTooltip label="اتصال هاتفي مباشر" variant="blue">
                              <a
                                href={`tel:${client.phone}`}
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
                  {Math.min(currentPage * PAGE_SIZE, totalClients)}
                </span>{" "}
                من أصل{" "}
                <span className="font-bold text-primary-text font-tabular">
                  {totalClients}
                </span>{" "}
                عميل
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
            icon={Users2}
            title="لا يوجد عملاء مطابقون للبحث"
            description="جرّب تعديل الكلمات المفتاحية أو تصفية الحالات للعثور على العملاء."
            actionLabel="إعادة ضبط الفلاتر"
            onAction={() => {
              setSearch("");
              setStatusFilter("ALL");
              setSourceFilter("ALL");
            }}
            className="my-6"
          />
        )}
      </div>
      )}

      {/* Client Details and History Timeline Modal */}
      {selectedClient && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedClient(null)}
        >
          <div
            className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl bg-surface border border-neutral-border p-6 shadow-xl text-right animate-in zoom-in-95 duration-150 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-border-subtle shrink-0">
              <div>
                <h3 className="text-base font-bold text-primary-text">{selectedClient.name}</h3>
                <p className="text-xs text-secondary-text mt-0.5">
                  تاريخ التسجيل: {formatDate(selectedClient.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="p-1 text-secondary-text hover:text-primary-text rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 flex-1 pr-1">
              {/* Summary Info */}
              <div className="grid grid-cols-2 gap-3 text-xs p-3.5 rounded-xl bg-warm-white border border-neutral-border-subtle">
                <div>
                  <span className="text-secondary-text block">رقم الهاتف:</span>
                  <strong className="text-primary-text font-tabular dir-ltr block mt-0.5">{selectedClient.phone}</strong>
                </div>
                <div>
                  <span className="text-secondary-text block">البريد الإلكتروني:</span>
                  <span className="text-primary-text dir-ltr block mt-0.5">{selectedClient.email || "غير متوفر"}</span>
                </div>
                <div>
                  <span className="text-secondary-text block">المصدر:</span>
                  <strong className="text-primary-text block mt-0.5">{LEAD_SOURCE_LABELS[selectedClient.source]}</strong>
                </div>
                <div>
                  <span className="text-secondary-text block">العقار المهتم به:</span>
                  <strong className="text-primary-text block mt-0.5">{selectedClient.interestedPropertyTitle || "غير محدد"}</strong>
                </div>
              </div>

              {/* Add Note Input */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-primary-text">إضافة ملاحظة متابعة أو ملخص مكالمة:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="اكتب ملاحظة جديدة..."
                    className="flex-1 px-3 py-2 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddNote();
                      }
                    }}
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="px-4 py-2 text-xs font-semibold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover rounded-xl disabled:opacity-50 transition-colors shrink-0 cursor-pointer"
                  >
                    إضافة
                  </button>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h4 className="text-xs font-bold text-primary-text mb-3">سجل المتابعة والنشاط:</h4>
                <div className="space-y-3">
                  {selectedClient.timeline.map((event) => (
                    <div key={event.id} className="relative pr-4 border-r-2 border-brand-gold/50 text-xs">
                      <span className="absolute -right-[5px] top-1.5 w-2 h-2 rounded-full bg-brand-gold" />
                      <div className="flex items-center justify-between text-secondary-text">
                        <strong className="text-primary-text font-semibold">{event.title}</strong>
                        <span className="text-[10px] text-muted-text">{formatDateTime(event.timestamp)}</span>
                      </div>
                      <p className="text-primary-text mt-1 leading-relaxed">{event.description}</p>
                      <span className="text-[10px] text-brand-gold-deep mt-0.5 block">بواسطة: {event.authorName}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-border-subtle flex justify-end shrink-0">
              <button
                onClick={() => setSelectedClient(null)}
                className="px-4 py-2 text-xs font-semibold text-primary-text bg-zinc-100 hover:bg-zinc-200 rounded-xl cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
