"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { MockStore, subscribeToMockStore } from "@/lib/services/mock-store";

export function DashboardCharts() {
  const [mounted, setMounted] = useState(false);
  const [properties, setProperties] = useState(MockStore.getProperties());
  const [appointments, setAppointments] = useState(MockStore.getAppointments());

  useEffect(() => {
    setMounted(true);
    const unsubscribe = subscribeToMockStore(() => {
      setProperties(MockStore.getProperties());
      setAppointments(MockStore.getAppointments());
    });
    return unsubscribe;
  }, []);

  // Compute live property type distribution from real store
  const propertyDistribution = useMemo(() => {
    const total = properties.length;
    if (total === 0) {
      return [
        { name: "سكني", count: 0, percentage: 0, color: "#C6A15B" },
        { name: "تجاري وإداري", count: 0, percentage: 0, color: "#1A1A1A" },
        { name: "أراضي ومزارع", count: 0, percentage: 0, color: "#10B981" },
      ];
    }
    const residential = properties.filter((p) => p.category === "RESIDENTIAL").length;
    const commercial = properties.filter((p) => p.category === "COMMERCIAL").length;
    const agricultural = properties.filter((p) => p.category === "AGRICULTURAL").length;

    return [
      { name: "سكني", count: residential, percentage: Math.round((residential / total) * 100), color: "#C6A15B" },
      { name: "تجاري وإداري", count: commercial, percentage: Math.round((commercial / total) * 100), color: "#1A1A1A" },
      { name: "أراضي ومزارع", count: agricultural, percentage: Math.round((agricultural / total) * 100), color: "#10B981" },
    ];
  }, [properties]);

  // Compute live appointments trend from real appointments in database
  const appointmentsTrend = useMemo(() => {
    const dayNames = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split("T")[0];
      const dayName = dayNames[d.getDay()] || `${d.getDate()}/${d.getMonth() + 1}`;

      const totalOnDay = appointments.filter(
        (a) => a.requestedDate === dateStr || (a.createdAt && a.createdAt.startsWith(dateStr))
      ).length;
      const confirmedOnDay = appointments.filter(
        (a) =>
          (a.requestedDate === dateStr || (a.createdAt && a.createdAt.startsWith(dateStr))) &&
          a.status === "CONFIRMED"
      ).length;

      return {
        date: dayName,
        requests: totalOnDay,
        confirmed: confirmedOnDay,
      };
    });
  }, [appointments]);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 rounded-2xl bg-surface border border-neutral-border animate-pulse" />
        <div className="h-72 rounded-2xl bg-surface border border-neutral-border animate-pulse" />
      </div>
    );
  }

  const hasChartData = propertyDistribution.some((p) => p.count > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Appointments & Viewing Requests Trend */}
      <div className="p-5 rounded-2xl bg-surface border border-neutral-border shadow-xs text-right">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-primary-text">
              حركة طلبات المعاينة والمواعيد المؤكدة
            </h3>
            <p className="text-xs text-secondary-text mt-0.5">متابعة نشاط الزيارات الحية خلال آخر 7 أيام</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-secondary-text">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-gold" />
              الطلبات الواردة
            </span>
            <span className="flex items-center gap-1.5 text-secondary-text">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              المؤكدة
            </span>
          </div>
        </div>

        <div className="h-64 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={appointmentsTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C6A15B" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#C6A15B" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0eb" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#71717A" }} />
              <YAxis tick={{ fontSize: 11, fill: "#71717A" }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E5E0",
                  borderRadius: "12px",
                  fontSize: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  textAlign: "right",
                  direction: "rtl",
                }}
              />
              <Area type="monotone" dataKey="requests" name="طلبات واردة" stroke="#C6A15B" strokeWidth={2} fillOpacity={1} fill="url(#goldGradient)" />
              <Area type="monotone" dataKey="confirmed" name="معاينات مؤكدة" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#greenGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Property Distribution by Category */}
      <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-neutral-border shadow-xs text-right overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-primary-text">
              توزيع العقارات حسب التصنيف
            </h3>
            <p className="text-xs text-secondary-text mt-0.5">نسبة المحفظة العقارية الحية بالمنصة</p>
          </div>
          <span className="text-xs font-semibold text-brand-gold-deep bg-brand-gold-light px-2.5 py-1 rounded-lg shrink-0">
            {properties.length} عقارات مسجلة
          </span>
        </div>

        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 min-h-[16rem] h-auto sm:h-64">
          <div className="h-40 w-40 sm:h-48 sm:w-48 shrink-0 my-1 sm:my-0" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={hasChartData ? propertyDistribution : [{ name: "فارغ", count: 1, color: "#E5E5E0" }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={hasChartData ? 4 : 0}
                  dataKey="count"
                >
                  {(hasChartData ? propertyDistribution : [{ name: "فارغ", color: "#E5E5E0" }]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                {hasChartData && (
                  <Tooltip
                    formatter={(value) => [`${value} عقار`, "العدد"]}
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E5E5E0",
                      borderRadius: "12px",
                      fontSize: "12px",
                      textAlign: "right",
                      direction: "rtl",
                    }}
                  />
                )}
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 w-full space-y-2 sm:space-y-3">
            {propertyDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-warm-white border border-neutral-border-subtle text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="font-medium text-primary-text">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="font-bold text-primary-text font-tabular">{item.count} وحدة</span>
                  <span className="font-semibold text-secondary-text font-tabular">({item.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
