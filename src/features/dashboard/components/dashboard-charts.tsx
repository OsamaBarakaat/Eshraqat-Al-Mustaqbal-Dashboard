"use client";

import React, { useState, useEffect } from "react";
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
import { PROPERTY_TYPE_DISTRIBUTION, APPOINTMENTS_TREND_DATA } from "@/lib/mock-data/stats";

export function DashboardCharts() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 rounded-2xl bg-surface border border-neutral-border animate-pulse" />
        <div className="h-72 rounded-2xl bg-surface border border-neutral-border animate-pulse" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Appointments & Viewing Requests Trend */}
      <div className="p-5 rounded-2xl bg-surface border border-neutral-border shadow-xs text-right">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-primary-text">
              حركة طلبات المعاينة والمواعيد المؤكدة
            </h3>
            <p className="text-xs text-secondary-text mt-0.5">متابعة نشاط الزيارات خلال آخر 7 أيام</p>
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
            <AreaChart data={APPOINTMENTS_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              <YAxis tick={{ fontSize: 11, fill: "#71717A" }} />
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
              <Area type="monotone" dataKey="requests" name="طلبات جديدة" stroke="#C6A15B" strokeWidth={2} fillOpacity={1} fill="url(#goldGradient)" />
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
            <p className="text-xs text-secondary-text mt-0.5">نسبة المحفظة العقارية الحالية بالمنصة</p>
          </div>
          <span className="text-xs font-semibold text-brand-gold-deep bg-brand-gold-light px-2.5 py-1 rounded-lg shrink-0">
            7 عقارات حالية
          </span>
        </div>

        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 min-h-[16rem] h-auto sm:h-64">
          <div className="h-40 w-40 sm:h-48 sm:w-48 shrink-0 my-1 sm:my-0" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={PROPERTY_TYPE_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {PROPERTY_TYPE_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
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
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 w-full space-y-2 sm:space-y-3">
            {PROPERTY_TYPE_DISTRIBUTION.map((item, idx) => (
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
