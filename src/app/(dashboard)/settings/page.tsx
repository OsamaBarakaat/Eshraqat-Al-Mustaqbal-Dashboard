"use client";

import React, { useState } from "react";
import {
  User,
  Bell,
  Save,
  KeyRound,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { useToast } from "@/components/shared/toast-provider";

export default function SettingsPage() {
  const { success } = useToast();

  const [adminName, setAdminName] = useState("م. أسامة بركات");
  const [adminEmail, setAdminEmail] = useState("osama@eshraqat-realestate.com");
  const [adminPhone, setAdminPhone] = useState("01000000001");

  // Notification switches
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [inquiryAlerts, setInquiryAlerts] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(false);

  // Appointment Defaults
  const [defaultDuration, setDefaultDuration] = useState("45");
  const [bufferTime, setBufferTime] = useState("15");

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    success("تم حفظ الملف الشخصي", "تم تحديث بيانات المسؤول بنجاح.");
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    success("تم حفظ التفضيلات", "تم حفظ إعدادات الإشعارات ومواعيد المعاينات الافتراضية.");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <PageHeader
        title="الإعدادات العامة وملف المشرف"
        description="إدارة البيانات الشخصية للمسؤول، تفضيلات التنبيهات، ومحددات المعاينة الافتراضية باللوحة."
        breadcrumbs={[{ label: "الإعدادات" }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-right">
        {/* Profile Card & Info (1 Col) */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-surface border border-neutral-border shadow-xs text-center space-y-4">
            <div className="relative inline-block mx-auto">
              <div className="w-20 h-20 rounded-full bg-brand-charcoal text-brand-gold text-2xl font-bold flex items-center justify-center border-2 border-brand-gold shadow-md">
                أب
              </div>
            </div>

            <div>
              <h3 className="font-bold text-base text-primary-text">{adminName}</h3>
              <p className="text-xs text-secondary-text mt-0.5">{adminEmail}</p>
              <span className="inline-block mt-2 text-xs font-semibold text-brand-gold-deep bg-brand-gold-light px-3 py-1 rounded-full border border-brand-gold/30">
                مدير النظام العام (Super Admin)
              </span>
            </div>

            <div className="pt-4 border-t border-neutral-border-subtle text-xs text-secondary-text text-right space-y-2">
              <div className="flex justify-between">
                <span>الصلاحيات:</span>
                <strong className="text-primary-text">كاملة (مطلقة)</strong>
              </div>
              <div className="flex justify-between">
                <span>المصادقة:</span>
                <span className="text-brand-gold-deep font-semibold">Supabase Auth (مستقبلاً)</span>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="p-5 rounded-2xl bg-zinc-900 text-zinc-300 text-xs space-y-2">
            <div className="flex items-center gap-2 text-brand-gold font-bold">
              <KeyRound className="w-4 h-4" />
              <span>أمان الحساب والمصادقة</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              في مرحلة الإنتاج القادمة، سيتم ربط تسجيل الدخول وتغيير كلمة المرور والتحقق بخطوتين عبر Supabase Auth وخادم NestJS.
            </p>
          </div>
        </div>

        {/* Profile and Preferences Forms (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Profile Information */}
          <form
            onSubmit={handleSaveProfile}
            className="p-6 rounded-2xl bg-surface border border-neutral-border shadow-xs space-y-4"
          >
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-border-subtle">
              <User className="w-5 h-5 text-brand-gold-deep" />
              <h3 className="font-bold text-base text-primary-text">البيانات الشخصية للمسؤول</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">الاسم الكامل:</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:ring-2 focus:ring-brand-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">رقم الهاتف:</label>
                <input
                  type="tel"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl dir-ltr focus:ring-2 focus:ring-brand-gold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-primary-text mb-1">البريد الإلكتروني المهني:</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl dir-ltr focus:ring-2 focus:ring-brand-gold"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover rounded-xl shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>حفظ التعديلات</span>
              </button>
            </div>
          </form>

          {/* 2. Notifications & Appointment Settings */}
          <form
            onSubmit={handleSavePreferences}
            className="p-6 rounded-2xl bg-surface border border-neutral-border shadow-xs space-y-5"
          >
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-border-subtle">
              <Bell className="w-5 h-5 text-brand-gold-deep" />
              <h3 className="font-bold text-base text-primary-text">تفضيلات التنبيهات ومحددات المواعيد</h3>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl bg-warm-white border border-neutral-border-subtle cursor-pointer hover:bg-zinc-100 transition-colors">
                <div>
                  <span className="font-bold text-xs sm:text-sm text-primary-text block">
                    تنبيهات طلبات المعاينة الجديدة
                  </span>
                  <span className="text-[11px] text-secondary-text">
                    إشعار فوري عند قيام عميل بطلب معاينة عقار عبر الموقع
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 text-brand-gold accent-brand-gold rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-warm-white border border-neutral-border-subtle cursor-pointer hover:bg-zinc-100 transition-colors">
                <div>
                  <span className="font-bold text-xs sm:text-sm text-primary-text block">
                    تنبيهات استفسارات الموقع الواردة
                  </span>
                  <span className="text-[11px] text-secondary-text">
                    إشعار عند وصول رسالة جديدة في صندوق الوارد
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={inquiryAlerts}
                  onChange={(e) => setInquiryAlerts(e.target.checked)}
                  className="w-4 h-4 text-brand-gold accent-brand-gold rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-warm-white border border-neutral-border-subtle cursor-pointer hover:bg-zinc-100 transition-colors">
                <div>
                  <span className="font-bold text-xs sm:text-sm text-primary-text block">
                    التقرير الصباحي اليومي (Daily Digest)
                  </span>
                  <span className="text-[11px] text-secondary-text">
                    ملخص يومي للمواعيد المجدولة لليوم وقائمة المهام
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={dailyDigest}
                  onChange={(e) => setDailyDigest(e.target.checked)}
                  className="w-4 h-4 text-brand-gold accent-brand-gold rounded cursor-pointer"
                />
              </label>
            </div>

            {/* Viewing Parameters */}
            <div className="pt-3 border-t border-neutral-border-subtle grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">
                  المدة الافتراضية للمعاينة الميدانية:
                </label>
                <select
                  value={defaultDuration}
                  onChange={(e) => setDefaultDuration(e.target.value)}
                  className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl cursor-pointer"
                >
                  <option value="30">30 دقيقة</option>
                  <option value="45">45 دقيقة (موصى بها)</option>
                  <option value="60">ساعة كاملة (60 دقيقة)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">
                  الوقت الفاصل بين المعاينات المتتالية:
                </label>
                <select
                  value={bufferTime}
                  onChange={(e) => setBufferTime(e.target.value)}
                  className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl cursor-pointer"
                >
                  <option value="15">15 دقيقة</option>
                  <option value="30">30 دقيقة</option>
                  <option value="45">45 دقيقة</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover rounded-xl shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>حفظ التفضيلات</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
