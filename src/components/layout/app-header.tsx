"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  User,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { ConfirmDialog } from "../shared/confirm-dialog";
import { useToast } from "../shared/toast-provider";
import { BrandLogo } from "../shared/brand-logo";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { MockStore } from "@/lib/services/mock-store";

interface AppHeaderProps {
  onOpenMobileMenu: () => void;
}

export function AppHeader({ onOpenMobileMenu }: AppHeaderProps) {
  const router = useRouter();
  const { success } = useToast();
  const { user, role, hasModule } = usePermissions();

  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setLogoutDialogOpen(false);
    MockStore.logout();
    success("تم تسجيل الخروج بنجاح", "تم إنهاء الجلسة والعودة لصفحة الدخول.");
    router.push("/login");
  };

  return (
    <>
      <header className="sticky top-0 z-20 h-16 bg-surface/95 backdrop-blur-md border-b border-neutral-border px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Right side: Mobile Menu Trigger & Mobile Logo */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenMobileMenu}
            className="p-2 -mr-2 text-primary-text hover:bg-zinc-100 rounded-xl lg:hidden transition-colors cursor-pointer"
            aria-label="فتح القائمة الجانبية"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="lg:hidden flex items-center">
            <BrandLogo variant="light" size="sm" withTagline={false} href="/dashboard" />
          </div>
        </div>

        {/* Left side: Admin Profile (Search and Notifications removed temporarily as requested) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Admin Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-brand-charcoal text-brand-gold font-bold text-xs flex items-center justify-center border border-brand-gold/30 shadow-2xs">
                {user.name.split(" ").slice(0, 2).map((n) => n[0]).join("") || "أب"}
              </div>

              <div className="hidden md:flex flex-col text-right leading-tight">
                <span className="font-semibold text-xs text-primary-text">{user.name}</span>
                <span className="text-[10px] text-secondary-text">{role?.titleArabic || user.role}</span>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-secondary-text hidden md:block" />
            </button>

            {/* Profile Dropdown Menu */}
            {profileOpen && (
              <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-surface border border-neutral-border shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-right p-1.5 space-y-1">
                <div className="px-3 py-2 border-b border-neutral-border-subtle mb-1">
                  <p className="font-bold text-xs text-primary-text">{user.name}</p>
                  <p className="text-[11px] text-secondary-text truncate">{user.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-semibold text-brand-gold-deep bg-brand-gold/15 px-2 py-0.5 rounded-md border border-brand-gold/25">
                    الدور: {role?.titleArabic || user.role}
                  </span>
                </div>

                <Link
                  href="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-primary-text hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-secondary-text" />
                  <span>الإعدادات العامة</span>
                </Link>

                {hasModule("team") && (
                  <Link
                    href="/team"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-primary-text hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
                  >
                    <User className="w-4 h-4 text-secondary-text" />
                    <span>فريق العمل والصلاحيات</span>
                  </Link>
                )}

                <div className="border-t border-neutral-border-subtle pt-1">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      setLogoutDialogOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-right cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        onConfirm={handleLogout}
        title="تأكيد تسجيل الخروج"
        description="هل أنت متأكد من رغبتك في تسجيل الخروج من لوحة تحكم إشراقة المستقبل؟"
        confirmLabel="تسجيل الخروج"
        cancelLabel="البقاء في اللوحة"
        variant="destructive"
      />
    </>
  );
}
