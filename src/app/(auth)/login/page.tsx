"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { MockStore } from "@/lib/services/mock-store";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("admin@eshraqat.sa");
  const [password, setPassword] = useState("Eshraqat@2026");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }

    setIsLoading(true);
    try {
      await MockStore.login(email.trim(), password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "فشل تسجيل الدخول. تحقق من صحة البريد الإلكتروني وكلمة المرور.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-white flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Decorative architectural background radiance */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-charcoal/5 rounded-full blur-3xl pointer-events-none translate-y-1/3 -translate-x-1/3" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Logo Card Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <BrandLogo variant="light" href="/login" withTagline={true} size="lg" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-primary-text">
            تسجيل الدخول إلى لوحة الإدارة
          </h2>
          <p className="text-xs text-secondary-text">
            أدخل بيانات حسابك للمتابعة إلى منصة إدارة إشراقة المستقبل
          </p>
        </div>

        {/* Login Form Container */}
        <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-neutral-border shadow-xl space-y-5 text-right">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1.5">
                البريد الإلكتروني المهني:
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@eshraqat.sa"
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl dir-ltr focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold transition-colors font-mono"
                  required
                />
                <Mail className="w-4 h-4 text-secondary-text absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1.5">
                كلمة المرور:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl dir-ltr focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold transition-colors font-mono"
                  required
                />
                <Lock className="w-4 h-4 text-secondary-text absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-secondary-text hover:text-primary-text absolute left-2.5 top-1/2 -translate-y-1/2 rounded-md"
                  aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-brand-gold hover:bg-brand-gold/90 text-primary-text font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-primary-text border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>دخول المنصة</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-secondary-text">
          منصة إشراقة المستقبل للعقارات © 2026 — نحو غدٍ مشرق
        </p>
      </div>
    </div>
  );
}
