"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { ToastProvider } from "@/components/shared/toast-provider";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("eshraqat_access_token");
      if (!token) {
        router.replace("/login");
        return;
      }
      setIsAuthChecking(false);
    }
  }, [router]);

  const handleCloseMobile = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const handleOpenMobile = useCallback(() => {
    setMobileMenuOpen(true);
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center dir-rtl">
        <div className="flex flex-col items-center gap-3 text-secondary-text">
          <Loader2 className="w-8 h-8 animate-spin text-brand-gold" />
          <p className="text-xs font-semibold text-primary-text">جاري التحقق من الجلسة وتحديث البيانات الحية...</p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-warm-white flex">
        {/* Desktop Sidebar */}
        <AppSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
        />

        {/* Mobile Drawer */}
        <MobileSidebar
          isOpen={mobileMenuOpen}
          onClose={handleCloseMobile}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader onOpenMobileMenu={handleOpenMobile} />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
