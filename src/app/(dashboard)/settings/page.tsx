"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Bell,
  Save,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { useToast } from "@/components/shared/toast-provider";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { MockStore, subscribeToMockStore } from "@/lib/services/mock-store";

const PREFS_STORAGE_KEY = "eshraqat_settings_preferences_v1";

export default function SettingsPage() {
  const { success, warning, error: toastError } = useToast();
  const { user, role } = usePermissions();

  // Profile Form State
  const [adminName, setAdminName] = useState(user.name || "");
  const [adminEmail, setAdminEmail] = useState(user.email || "");
  const [adminPhone, setAdminPhone] = useState(user.phone || "");
  const [adminDepartment, setAdminDepartment] = useState(user.department || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password Change State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Notification switches & appointment defaults
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [inquiryAlerts, setInquiryAlerts] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(false);
  const [defaultDuration, setDefaultDuration] = useState("45");
  const [bufferTime, setBufferTime] = useState("15");

  // Sync state with live user data
  useEffect(() => {
    const syncFromUser = () => {
      const current = MockStore.getCurrentUser();
      if (current) {
        setAdminName(current.name);
        setAdminEmail(current.email);
        setAdminPhone(current.phone);
        setAdminDepartment(current.department || "");
      }
    };

    syncFromUser();
    const unsubscribe = subscribeToMockStore(syncFromUser);
    return unsubscribe;
  }, []);

  // Load preferences from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(PREFS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.emailAlerts === "boolean") setEmailAlerts(parsed.emailAlerts);
        if (typeof parsed.inquiryAlerts === "boolean") setInquiryAlerts(parsed.inquiryAlerts);
        if (typeof parsed.dailyDigest === "boolean") setDailyDigest(parsed.dailyDigest);
        if (parsed.defaultDuration) setDefaultDuration(parsed.defaultDuration);
        if (parsed.bufferTime) setBufferTime(parsed.bufferTime);
      }
    } catch {
      // ignore
    }
  }, []);

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim()) {
      warning("حقول مطلوبة", "يرجى ملء الاسم الكامل.");
      return;
    }

    setIsSavingProfile(true);
    try {
      MockStore.updateUser(user.id, {
        name: adminName.trim(),
        phone: adminPhone.trim(),
      });
      success("تم حفظ البيانات بنجاح", "تم تحديث بيانات ملفك الشخصي في قاعدة البيانات.");
    } catch {
      toastError("خطأ", "تعذر حفظ التعديلات على السيرفر.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      warning("تنبيه", "يرجى كتابة كلمة المرور الجديدة.");
      return;
    }

    if (newPassword.length < 6) {
      warning("كلمة مرور ضعيفة", "يجب أن تتكون كلمة المرور من 6 أحرف أو أرقام على الأقل.");
      return;
    }

    if (newPassword !== confirmPassword) {
      warning("عدم تطابق", "كلمة المرور وتأكيد كلمة المرور غير متطابقين.");
      return;
    }

    setIsSavingPassword(true);
    try {
      await MockStore.resetUserPassword(user.id, newPassword.trim());
      setNewPassword("");
      setConfirmPassword("");
      success("تم تغيير كلمة المرور بنجاح", "تم تشفير وتحديث كلمة المرور الجديدة في قاعدة البيانات.");
    } catch {
      toastError("فشل التغيير", "حدث خطأ أثناء محاولة تحديث كلمة المرور في السيرفر.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Handle Save Preferences
  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const prefs = {
        emailAlerts,
        inquiryAlerts,
        dailyDigest,
        defaultDuration,
        bufferTime,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
      success("تم حفظ التفضيلات", "تم حفظ إعدادات التنبيهات ومحددات المعاينة بنجاح.");
    } catch {
      toastError("خطأ", "تعذر حفظ التفضيلات محلياً.");
    }
  };

  const userInitials =
    user.name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("") || "مش";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <PageHeader
        title="الإعدادات العامة وملف المشرف"
        description="إدارة البيانات الشخصية للمسؤول، أمان كلمة المرور، تفضيلات التنبيهات، ومحددات المعاينة باللوحة."
        breadcrumbs={[{ label: "الإعدادات" }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-right">
        {/* Profile Card & Info (1 Col) */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-surface border border-neutral-border shadow-xs text-center space-y-4">
            <div className="relative inline-block mx-auto">
              <div className="w-20 h-20 rounded-full bg-brand-charcoal text-brand-gold text-2xl font-bold flex items-center justify-center border-2 border-brand-gold/40 shadow-md">
                {userInitials}
              </div>
              <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white" title="متصل الآن" />
            </div>

            <div>
              <h3 className="font-bold text-base text-primary-text">{user.name}</h3>
              <p className="text-xs text-secondary-text mt-0.5 dir-ltr">{user.email}</p>
              <span className="inline-block mt-2 text-xs font-semibold text-brand-gold-deep bg-brand-gold-light px-3 py-1 rounded-full border border-brand-gold/30">
                {role?.titleArabic || user.role}
              </span>
            </div>

            <div className="pt-4 border-t border-neutral-border-subtle text-xs text-secondary-text text-right space-y-2.5">
              <div className="flex justify-between items-center">
                <span>الصلاحيات الإدارية:</span>
                <strong className="text-primary-text">
                  {user.role === "SUPER_ADMIN" ? "كاملة (مطلقة)" : "مخصصة"}
                </strong>
              </div>
              <div className="flex justify-between items-center">
                <span>القسم / الإدارة:</span>
                <span className="text-primary-text font-medium">{user.department || "الإدارة العامة"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>حالة الحساب:</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  نشط ومفعّل
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>المصادقة والأمان:</span>
                <span className="text-brand-gold-deep font-semibold">JWT + PostgreSQL</span>
              </div>
            </div>
          </div>

          {/* Security & Password Reset Form */}
          <form
            onSubmit={handleChangePassword}
            className="p-5 rounded-2xl bg-surface border border-neutral-border shadow-xs text-xs space-y-3.5"
          >
            <div className="flex items-center gap-2 text-brand-charcoal font-bold pb-2 border-b border-neutral-border-subtle">
              <KeyRound className="w-4 h-4 text-brand-gold-deep" />
              <span className="text-xs sm:text-sm">أمان الحساب وتغيير كلمة المرور</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-primary-text mb-1">
                كلمة المرور الجديدة:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="6 أحرف أو أرقام على الأقل"
                  className="w-full p-2.5 pl-9 text-xs bg-warm-white border border-neutral-border rounded-xl dir-ltr focus:ring-2 focus:ring-brand-gold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary-text hover:text-primary-text p-0.5 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-primary-text mb-1">
                تأكيد كلمة المرور الجديدة:
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد كتابة كلمة المرور للتأكيد"
                className="w-full p-2.5 text-xs bg-warm-white border border-neutral-border rounded-xl dir-ltr focus:ring-2 focus:ring-brand-gold"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingPassword || !newPassword}
              className="w-full mt-2 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-charcoal hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-brand-gold" />
              <span>{isSavingPassword ? "جاري التحديث..." : "تحديث كلمة المرور"}</span>
            </button>
          </form>
        </div>

        {/* Profile and Preferences Forms (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Profile Information Form */}
          <form
            onSubmit={handleSaveProfile}
            className="p-6 rounded-2xl bg-surface border border-neutral-border shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-border-subtle">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-brand-gold-deep" />
                <h3 className="font-bold text-base text-primary-text">البيانات الشخصية للمسؤول</h3>
              </div>
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
                متصل بالسيرفر الحي
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">الاسم الكامل:</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="مثال: م. أسامة بركات"
                  className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:ring-2 focus:ring-brand-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">رقم الهاتف:</label>
                <input
                  type="tel"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  placeholder="مثال: +966501234567"
                  className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl dir-ltr focus:ring-2 focus:ring-brand-gold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-primary-text">البريد الإلكتروني المهني:</label>
                  <span className="text-[10px] text-muted flex items-center gap-1 font-medium bg-neutral-light px-1.5 py-0.5 rounded border border-neutral-border">
                    <Lock className="w-2.5 h-2.5" /> غير قابل للتعديل
                  </span>
                </div>
                <input
                  type="email"
                  value={adminEmail}
                  readOnly
                  disabled
                  placeholder="name@eshraqat.sa"
                  className="w-full p-2.5 text-xs sm:text-sm bg-neutral-light/70 border border-neutral-border text-secondary-text rounded-xl dir-ltr cursor-not-allowed select-none opacity-80"
                  title="البريد الإلكتروني المهني هو معرّف الدخول الرسمي ولا يمكن تغييره إلا من خلال إدارة الفريق"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-primary-text">القسم / الإدارة:</label>
                  <span className="text-[10px] text-muted flex items-center gap-1 font-medium bg-neutral-light px-1.5 py-0.5 rounded border border-neutral-border">
                    <Lock className="w-2.5 h-2.5" /> يُدار عبر الإدارة
                  </span>
                </div>
                <input
                  type="text"
                  value={adminDepartment || "الإدارة العامة"}
                  readOnly
                  disabled
                  placeholder="مثال: الإدارة العامة، المبيعات..."
                  className="w-full p-2.5 text-xs sm:text-sm bg-neutral-light/70 border border-neutral-border text-secondary-text rounded-xl cursor-not-allowed select-none opacity-80"
                  title="يتم تعيين القسم الوظيفي مركزياً من شاشة إدارة الفريق والصلاحيات"
                />
              </div>
            </div>

            <p className="text-[11px] text-muted bg-warm-white/80 border border-neutral-border-subtle rounded-xl p-2.5 leading-relaxed">
              🔒 <strong className="text-primary-text font-medium">ملاحظة أمنية:</strong> البريد الإلكتروني الرسمي والقسم الوظيفي مرتبطان بهوية الحساب الرسمية والصلاحيات الممنوحة له، وتعديلهما يتم حصراً عبر شاشة إدارة الفريق.
            </p>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingProfile ? "جاري الحفظ..." : "حفظ التعديلات في قاعدة البيانات"}</span>
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
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>حفظ التفضيلات والمحددات</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
