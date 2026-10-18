"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  UserPlus,
  Users2,
  Check,
  X,
  Edit2,
  Sparkles,
  KeyRound,
  PlusCircle,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { MockStore, subscribeToMockStore } from "@/lib/services/mock-store";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { ActionTooltip } from "@/components/shared/action-tooltip";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ProtectedRoute } from "@/components/shared/protected-route";
import { useToast } from "@/components/shared/toast-provider";
import { ROLE_CONFIG } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/utils";
import { AdminUser, Role, RoleType, ModuleType, ActionType } from "@/types/team";

export default function TeamPermissionsPage() {
  const { success, warning, info } = useToast();
  const [users, setUsers] = useState<AdminUser[]>(MockStore.getUsers());
  const [roles, setRoles] = useState<Role[]>(MockStore.getRoles());

  const [activeTab, setActiveTab] = useState<"USERS" | "ROLES_MATRIX">("USERS");

  // Add/Edit User Modal
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userDepartment, setUserDepartment] = useState("");
  const [userRole, setUserRole] = useState<RoleType>("SALES_AGENT");

  // Selected Role for Permission Matrix
  const [selectedRoleType, setSelectedRoleType] = useState<string>("SUPER_ADMIN");

  // Delete Role confirmation state
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  // Add New Custom Role Modal
  const [newRoleModalOpen, setNewRoleModalOpen] = useState(false);
  const [newRoleTitle, setNewRoleTitle] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToMockStore(() => {
      setUsers(MockStore.getUsers());
      setRoles(MockStore.getRoles());
    });
    return unsubscribe;
  }, []);

  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserName("");
    setUserEmail("");
    setUserPhone("");
    setUserDepartment("قطاع المبيعات");
    setUserRole("SALES_AGENT");
    setUserModalOpen(true);
  };

  const handleOpenEditUser = (u: AdminUser) => {
    setEditingUser(u);
    setUserName(u.name);
    setUserEmail(u.email);
    setUserPhone(u.phone);
    setUserDepartment(u.department || "");
    setUserRole(u.role);
    setUserModalOpen(true);
  };

  const handleSaveUser = () => {
    if (!userName.trim() || !userEmail.trim()) return;

    if (editingUser) {
      MockStore.updateUser(editingUser.id, {
        name: userName.trim(),
        email: userEmail.trim(),
        phone: userPhone.trim(),
        department: userDepartment.trim(),
        role: userRole,
      });
      success("تم تحديث بيانات الموظف", `تم حفظ التعديلات على حساب (${userName}).`);
    } else {
      MockStore.addUser({
        name: userName.trim(),
        email: userEmail.trim(),
        phone: userPhone.trim(),
        department: userDepartment.trim(),
        role: userRole,
        status: "ACTIVE",
      });
      success("تمت إضافة الموظف بنجاح", `تم إنشاء حساب جديد لـ (${userName}).`);
    }
    setUserModalOpen(false);
  };

  const handleToggleUserStatus = (u: AdminUser) => {
    const newStatus = u.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    MockStore.updateUser(u.id, { status: newStatus });
    if (newStatus === "ACTIVE") {
      success("تم تفعيل الحساب", `تم تفعيل حساب الموظف (${u.name}).`);
    } else {
      warning("تم تعطيل الحساب", `تم تعطيل وصول الموظف (${u.name}) مؤقتاً.`);
    }
  };

  // Modules list for matrix
  const modulesList: { key: ModuleType; label: string }[] = [
    { key: "properties", label: "العقارات" },
    { key: "projects", label: "المشاريع والمطورون" },
    { key: "appointments", label: "طلبات المعاينة والمواعيد" },
    { key: "clients", label: "العملاء والـ Leads" },
    { key: "inquiries", label: "استفسارات الموقع" },
    { key: "websiteContent", label: "محتوى الموقع والصفحات" },
    { key: "team", label: "المسؤولون وفريق العمل" },
    { key: "reports", label: "التقارير الإحصائية" },
    { key: "settings", label: "الإعدادات العامة" },
  ];

  const actionsList: { key: ActionType; label: string }[] = [
    { key: "view", label: "عرض" },
    { key: "create", label: "إضافة" },
    { key: "edit", label: "تعديل" },
    { key: "delete", label: "حذف" },
    { key: "publish", label: "نشر" },
    { key: "assign", label: "إسناد" },
    { key: "managePermissions", label: "إدارة الصلاحيات" },
  ];

  const selectedRole = roles.find((r) => r.name === selectedRoleType || r.id === selectedRoleType) || roles[0];

  // Toggle role permission
  const handleTogglePermission = (modKey: ModuleType, actKey: ActionType) => {
    if (!selectedRole) return;

    // Warning if changing Super Admin view
    if (selectedRole.name === "SUPER_ADMIN" && actKey === "managePermissions") {
      warning("تنبيه أمني", "لا يمكن إلغاء صلاحية إدارة النظام عن مدير النظام العام.");
      return;
    }

    const modPerm = selectedRole.permissions.find((p) => p.module === modKey);
    const hasPerm = modPerm?.actions.includes(actKey);

    MockStore.toggleRolePermission(selectedRole.id, modKey, actKey);

    const modLabel = modulesList.find((m) => m.key === modKey)?.label || modKey;
    const actLabel = actionsList.find((a) => a.key === actKey)?.label || actKey;

    if (hasPerm) {
      info("تم سحب الصلاحية", `تم إلغاء صلاحية (${actLabel}) لوحدة (${modLabel}) عن دور (${selectedRole.titleArabic}).`);
    } else {
      success("تم منح الصلاحية", `تم تفعيل صلاحية (${actLabel}) لوحدة (${modLabel}) لدور (${selectedRole.titleArabic}).`);
    }
  };

  // Save new custom role
  const handleCreateCustomRole = () => {
    if (!newRoleTitle.trim()) {
      warning("خطأ", "يرجى كتابة اسم الدور الوظيفي");
      return;
    }
    const initialPerms = [
      { module: "properties" as ModuleType, actions: ["view" as ActionType] },
      { module: "clients" as ModuleType, actions: ["view" as ActionType] },
    ];
    const createdRole = MockStore.addCustomRole(
      newRoleTitle.trim(),
      newRoleDescription.trim() || `دور مخصص: ${newRoleTitle.trim()}`,
      initialPerms
    );
    setSelectedRoleType(createdRole.name);
    setNewRoleTitle("");
    setNewRoleDescription("");
    setNewRoleModalOpen(false);
    success("تم إنشاء الدور بنجاح", `تمت إضافة دور (${createdRole.titleArabic}) ويمكنك الآن تخصيص كافة صلاحياته.`);
  };

  // Delete role confirmation handler
  const handleDeleteRoleConfirm = () => {
    if (!roleToDelete) return;
    if (roleToDelete.name === "SUPER_ADMIN") {
      warning("إجراء غير متاح", "لا يمكن حذف دور مدير عام النظام للحفاظ على أمان واستقرار المنصة.");
      setRoleToDelete(null);
      return;
    }
    const roleTitle = roleToDelete.titleArabic;
    const ok = MockStore.deleteRole(roleToDelete.id);
    if (ok) {
      setSelectedRoleType("SUPER_ADMIN");
      setRoleToDelete(null);
      success("تم حذف الدور الوظيفي بنجاح", `تم حذف دور (${roleTitle}) وإزالته من النظام ومصفوفة الصلاحيات.`);
    } else {
      warning("تعذر الحذف", "حدث خطأ أثناء محاولة إزالة هذا الدور.");
      setRoleToDelete(null);
    }
  };

  return (
    <ProtectedRoute module="team" action="view">
      <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <PageHeader
        title="المسؤولون، فريق العمل والصلاحيات"
        description="إدارة حسابات مستخدمي لوحة التحكم، تعيين الأدوار الوظيفية، وتعديل مصفوفة الصلاحيات حسب الوحدات والإجراءات بصلاحية مدير عام النظام."
        breadcrumbs={[{ label: "المسؤولون والصلاحيات" }]}
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-gold/15 text-brand-gold-deep border border-brand-gold/30">
            <Sparkles className="w-3.5 h-3.5" />
            تحكم ديناميكي كامل بالصلاحيات
          </span>
        }
        primaryAction={
          <button
            onClick={handleOpenAddUser}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة موظف / مسؤول</span>
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-border pb-1">
        <button
          onClick={() => setActiveTab("USERS")}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === "USERS"
              ? "bg-brand-charcoal text-white shadow-xs"
              : "text-secondary-text hover:text-primary-text hover:bg-zinc-100"
          }`}
        >
          فريق العمل والمشرفون ({users.length})
        </button>
        <button
          onClick={() => setActiveTab("ROLES_MATRIX")}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === "ROLES_MATRIX"
              ? "bg-brand-charcoal text-white shadow-xs"
              : "text-secondary-text hover:text-primary-text hover:bg-zinc-100"
          }`}
        >
          مصفوفة الأدوار والصلاحيات (Permissions Matrix)
        </button>
      </div>

      {/* Tab 1: Users List */}
      {activeTab === "USERS" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              title="إجمالي الموظفين والمشرفين"
              value={users.length}
              icon={Users2}
              subtitle="حسابات مسجلة"
              variant="gold"
            />
            <StatCard
              title="الحسابات النشطة"
              value={users.filter((u) => u.status === "ACTIVE").length}
              icon={ShieldCheck}
              subtitle="تسجيل دخول مفعل"
              variant="success"
            />
            <StatCard
              title="مديرو النظام (Super Admins)"
              value={users.filter((u) => u.role === "SUPER_ADMIN").length}
              icon={KeyRound}
              subtitle="صلاحيات مطلقة"
              variant="info"
            />
            <StatCard
              title="مستشارو المبيعات"
              value={users.filter((u) => u.role === "SALES_AGENT").length}
              icon={Users2}
              subtitle="معاينات ومتابعة العملاء"
              variant="default"
            />
          </div>

          <div className="rounded-2xl bg-surface border border-neutral-border shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-zinc-50 border-b border-neutral-border text-secondary-text font-semibold select-none">
                  <tr>
                    <th className="py-3.5 px-4">الموظف / المسؤول</th>
                    <th className="py-3.5 px-4">البريد الإلكتروني ورقم الهاتف</th>
                    <th className="py-3.5 px-4">الدور الوظيفي</th>
                    <th className="py-3.5 px-4">القسم</th>
                    <th className="py-3.5 px-4">الحالة</th>
                    <th className="py-3.5 px-4">آخر نشاط</th>
                    <th className="py-3.5 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-border-subtle">
                  {users.map((user) => {
                    const roleInfo = ROLE_CONFIG[user.role];
                    return (
                      <tr key={user.id} className="hover:bg-zinc-50/70 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-brand-charcoal text-brand-gold font-bold flex items-center justify-center shrink-0 border border-brand-gold/30">
                              {user.name.slice(0, 2)}
                            </div>
                            <div>
                              <span className="font-bold text-primary-text block">{user.name}</span>
                              <span className="text-[11px] text-secondary-text">
                                انضم في {formatDate(user.createdAt)}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="text-primary-text dir-ltr block text-xs font-mono">{user.email}</span>
                          <span className="text-[11px] text-secondary-text font-tabular dir-ltr block mt-0.5">
                            {user.phone}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-semibold text-brand-gold-deep bg-brand-gold-light px-2.5 py-1 rounded-lg text-xs">
                            {roleInfo?.label || user.role}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-secondary-text">
                          {user.department || "عام"}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <StatusBadge
                            label={user.status === "ACTIVE" ? "نشط" : "معطل"}
                            variant={user.status === "ACTIVE" ? "success" : "neutral"}
                          />
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-secondary-text text-xs">
                          {formatDateTime(user.lastActiveAt)}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <ActionTooltip label="تعديل بيانات الحساب" variant="gold">
                              <button
                                onClick={() => handleOpenEditUser(user)}
                                className="p-1.5 text-secondary-text hover:text-blue-600 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </ActionTooltip>

                            {user.role !== "SUPER_ADMIN" && (
                              <ActionTooltip
                                label={user.status === "ACTIVE" ? "تعطيل وصول المستخدم مؤقتاً" : "إعادة تفعيل الحساب"}
                                variant={user.status === "ACTIVE" ? "amber" : "emerald"}
                              >
                                <button
                                  onClick={() => handleToggleUserStatus(user)}
                                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                                    user.status === "ACTIVE"
                                      ? "text-amber-700 bg-amber-50 hover:bg-amber-100"
                                      : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                                  }`}
                                >
                                  {user.status === "ACTIVE" ? "تعطيل" : "تفعيل"}
                                </button>
                              </ActionTooltip>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Permissions Matrix */}
      {activeTab === "ROLES_MATRIX" && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-brand-gold-light/40 border border-brand-gold/30 text-xs text-brand-charcoal leading-relaxed flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-brand-gold-deep shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-sm mb-0.5">
                  لوحة تحكم الصلاحيات المباشرة (بصلاحية مدير عام النظام):
                </strong>
                يمكنك النقر مباشرة على أي خانة في الجدول لتفعيل الصلاحية (✔) أو إلغائها (✖) فورا لهذا الدور الوظيفي.
              </div>
            </div>

            <button
              onClick={() => setNewRoleModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>إضافة دور وظيفي جديد</span>
            </button>
          </div>

          {/* Role Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {roles.map((r) => (
              <button
                key={r.name}
                onClick={() => setSelectedRoleType(r.name)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                  (selectedRole?.name === r.name || selectedRole?.id === r.id)
                    ? "bg-brand-gold text-brand-charcoal border-brand-gold shadow-xs font-bold"
                    : "bg-surface text-secondary-text border-neutral-border hover:bg-zinc-100"
                }`}
              >
                {r.titleArabic}
              </button>
            ))}
          </div>

          {/* Selected Role Description Card */}
          {selectedRole && (
            <div className="p-4 rounded-xl bg-surface border border-neutral-border text-right text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-secondary-text">الوصف الوظيفي للدور المحدد:</span>
                <p className="font-bold text-primary-text text-sm mt-0.5">{selectedRole.titleArabic}</p>
                <p className="text-secondary-text mt-1">{selectedRole.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 font-mono">
                  كود الدور: {selectedRole.name}
                </span>
                {selectedRole.name !== "SUPER_ADMIN" && (
                  <ActionTooltip label={`حذف دور (${selectedRole.titleArabic}) نهائياً من النظام`} variant="rose">
                    <button
                      onClick={() => setRoleToDelete(selectedRole)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف هذا الدور</span>
                    </button>
                  </ActionTooltip>
                )}
              </div>
            </div>
          )}

          {/* Matrix Grid Table */}
          <div className="rounded-2xl bg-surface border border-neutral-border shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-zinc-50 border-b border-neutral-border text-secondary-text font-semibold select-none">
                  <tr>
                    <th className="py-3.5 px-4">الوحدة / القسم</th>
                    {actionsList.map((act) => (
                      <th key={act.key} className="py-3.5 px-3 text-center">
                        {act.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-border-subtle">
                  {modulesList.map((mod) => {
                    const modPerm = selectedRole?.permissions.find((p) => p.module === mod.key);
                    return (
                      <tr key={mod.key} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-primary-text whitespace-nowrap">
                          {mod.label}
                        </td>
                        {actionsList.map((act) => {
                          const isAllowed = modPerm?.actions.includes(act.key);
                          return (
                            <td key={act.key} className="py-3 px-3 text-center whitespace-nowrap">
                              <ActionTooltip
                                label={
                                  isAllowed
                                    ? `إلغاء صلاحية (${act.label}) لوحدة (${mod.label})`
                                    : `منح صلاحية (${act.label}) لوحدة (${mod.label})`
                                }
                                variant={isAllowed ? "emerald" : "default"}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleTogglePermission(mod.key, act.key)}
                                  className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all cursor-pointer ${
                                    isAllowed
                                      ? "bg-emerald-100 text-emerald-800 hover:bg-rose-100 hover:text-rose-700"
                                      : "bg-zinc-100 text-zinc-300 hover:bg-emerald-50 hover:text-emerald-600"
                                  }`}
                                >
                                  {isAllowed ? (
                                    <Check className="w-4 h-4 stroke-[2.5]" />
                                  ) : (
                                    <X className="w-4 h-4" />
                                  )}
                                </button>
                              </ActionTooltip>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit User Modal */}
      {userModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
          onClick={() => setUserModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-surface border border-neutral-border p-6 shadow-xl text-right animate-in zoom-in-95 duration-150 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-border-subtle">
              <h3 className="text-base font-bold text-primary-text">
                {editingUser ? "تعديل حساب موظف" : "إضافة موظف جديد"}
              </h3>
              <button
                onClick={() => setUserModalOpen(false)}
                className="p-1 text-secondary-text hover:text-primary-text rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">الاسم بالكامل:</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="مثال: أ. عبد العزيز المطيري"
                  className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:ring-2 focus:ring-brand-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">البريد الإلكتروني:</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="name@eshraqat-realestate.com"
                  className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl dir-ltr focus:ring-2 focus:ring-brand-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">رقم الهاتف:</label>
                <input
                  type="tel"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  placeholder="05XXXXXXXX"
                  className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl dir-ltr focus:ring-2 focus:ring-brand-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">القسم / الإدارة:</label>
                <input
                  type="text"
                  value={userDepartment}
                  onChange={(e) => setUserDepartment(e.target.value)}
                  placeholder="قطاع المبيعات، التسويق، الشؤون العقارية..."
                  className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:ring-2 focus:ring-brand-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">الدور والصلاحيات:</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as RoleType)}
                  className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl cursor-pointer"
                >
                  {roles.map((r) => (
                    <option key={r.name} value={r.name}>
                      {r.titleArabic}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-border-subtle flex justify-end gap-2">
              <button
                onClick={() => setUserModalOpen(false)}
                className="px-3.5 py-2 text-xs font-medium text-secondary-text hover:bg-zinc-100 rounded-xl border border-neutral-border cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveUser}
                className="px-5 py-2 text-xs font-semibold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover rounded-xl shadow-xs cursor-pointer"
              >
                {editingUser ? "حفظ التعديلات" : "إضافة الحساب"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Role Modal */}
      {newRoleModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
          onClick={() => setNewRoleModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-surface border border-neutral-border p-6 shadow-xl text-right animate-in zoom-in-95 duration-150 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-border-subtle">
              <h3 className="text-base font-bold text-primary-text">إضافة دور وظيفي مخصص جديد</h3>
              <button
                onClick={() => setNewRoleModalOpen(false)}
                className="p-1 text-secondary-text hover:text-primary-text rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">
                  مسمى الدور بالعربية <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newRoleTitle}
                  onChange={(e) => setNewRoleTitle(e.target.value)}
                  placeholder="مثال: منسق علاقات المستثمرين، أخصائي تسويق رقمي..."
                  className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:ring-2 focus:ring-brand-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary-text mb-1">
                  الوصف الوظيفي ومسؤوليات الدور:
                </label>
                <textarea
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  placeholder="تحديد نطاق عمل هذا الدور والمسؤوليات الموكلة للموظفين المسجلين به..."
                  rows={3}
                  className="w-full p-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl focus:ring-2 focus:ring-brand-gold resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                💡 فور إنشاء الدور، ستتمكن من تعديل كافة صلاحياته التراكمية في الجدول مباشرة بالضغط على مربعات الاختيار.
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-border-subtle flex justify-end gap-2">
              <button
                onClick={() => setNewRoleModalOpen(false)}
                className="px-3.5 py-2 text-xs font-medium text-secondary-text hover:bg-zinc-100 rounded-xl border border-neutral-border cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateCustomRole}
                className="px-5 py-2 text-xs font-bold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                إنشاء الدور الوظيفي
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Role Confirmation Dialog (Password Protected) */}
      <ConfirmDialog
        isOpen={Boolean(roleToDelete)}
        onClose={() => setRoleToDelete(null)}
        title={`حذف الدور الوظيفي (${roleToDelete?.titleArabic})`}
        description={`هل أنت متأكد من رغبتك في حذف دور (${roleToDelete?.titleArabic}) نهائياً من مصفوفة الصلاحيات؟ لن يتمكن أي موظف من استخدام هذا الدور بعد الآن. يتطلب هذا الإجراء تأكيد كلمة مرور مدير عام النظام.`}
        confirmLabel="تأكيد حذف الدور"
        cancelLabel="إلغاء"
        variant="destructive"
        requirePassword={true}
        onConfirm={handleDeleteRoleConfirm}
      />
    </div>
  </ProtectedRoute>
  );
}
