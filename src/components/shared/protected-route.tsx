"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowRight, LayoutDashboard } from "lucide-react";
import { ModuleType, ActionType } from "@/types/team";
import { usePermissions } from "@/lib/hooks/use-permissions";

interface ProtectedRouteProps {
  module: ModuleType;
  action?: ActionType;
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

const MODULE_NAMES: Record<ModuleType, string> = {
  properties: "العقارات",
  projects: "المشاريع",
  clients: "العملاء",
  inquiries: "استفسارات الموقع",
  appointments: "المعاينات والمواعيد",
  websiteContent: "محتوى الموقع والصفحات",
  reports: "التقارير الإحصائية",
  team: "المسؤولون وفريق العمل",
  settings: "الإعدادات العامة",
};

const ACTION_NAMES: Record<ActionType, string> = {
  view: "عرض ومطالعة",
  create: "إضافة وتسجيل",
  edit: "تعديل وحفظ",
  delete: "حذف وإزالة",
  publish: "نشر وإلغاء النشر",
  assign: "إسناد وتعيين",
  managePermissions: "إدارة الصلاحيات",
};

/**
 * ProtectedRoute guards entire pages or main view sections.
 * If the current user lacks permission, it renders an informative Arabic 403 Forbidden screen.
 */
export function ProtectedRoute({
  module,
  action = "view",
  children,
  fallbackTitle,
  fallbackDescription,
}: ProtectedRouteProps) {
  const { hasPermission, user, role } = usePermissions();

  const isAllowed = hasPermission(module, action);

  if (!isAllowed) {
    const modLabel = MODULE_NAMES[module] || module;
    const actLabel = ACTION_NAMES[action] || action;
    const roleTitle = role?.titleArabic || user.role;

    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4 select-none animate-in fade-in duration-300">
        <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-surface border border-neutral-border shadow-lg text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-700 mx-auto flex items-center justify-center shadow-xs">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              خطأ 403: غير مصرح بالدخول
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-primary-text">
              {fallbackTitle || `صلاحية وصول مقيدة: قسم ${modLabel}`}
            </h2>
            <p className="text-xs text-secondary-text leading-relaxed">
              {fallbackDescription ||
                `حسابك الحالي مسجل بدور (${roleTitle}). هذا الدور لا يتضمن صلاحية (${actLabel}) لقسم (${modLabel}). يمكنك مراجعة مدير عام النظام لتعديل الصلاحيات.`}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-warm-white border border-neutral-border text-xs text-secondary-text text-right space-y-1 font-mono">
            <div className="flex justify-between">
              <span>المستخدم النشط:</span>
              <span className="font-bold text-primary-text font-sans">{user.name}</span>
            </div>
            <div className="flex justify-between">
              <span>الدور الوظيفي:</span>
              <span className="font-semibold text-brand-gold-deep font-sans">{roleTitle}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <Link
              href="/dashboard"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover transition-colors cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>الرئيسية</span>
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-secondary-text bg-warm-white hover:bg-zinc-100 border border-neutral-border transition-colors cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>رجوع</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
