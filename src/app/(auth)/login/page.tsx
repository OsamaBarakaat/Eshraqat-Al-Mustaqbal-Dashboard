"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Eye, EyeOff, ArrowLeft, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("osama@eshraqat-realestate.com");
  const [password, setPassword] = useState("Eshraqat@2026");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }

    setIsLoading(true);
    // Safe prototype login simulation
    setTimeout(() => {
      setIsLoading(false);
      router.push("/dashboard");
    }, 600);
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
                  placeholder="admin@eshraqat-realestate.com"
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
              className="w-full mt-4 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-brand-charcoal bg-brand-gold hover:bg-brand-gold-hover shadow-md shadow-brand-gold/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isLoading ? "جارٍ التحقق..." : "دخول لوحة التحكم"}</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Security architecture footer note */}
        <div className="text-center text-xs text-secondary-text space-y-1">
          <p className="flex items-center justify-center gap-1.5 text-zinc-500 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-gold-deep" />
            <span>سيتم تفعيل المصادقة الإنتاجية المشفرة عبر Supabase Auth في المرحلة التالية.</span>
          </p>
          <p className="text-[10px] text-muted-text">
            جميع الحقوق محفوظة © {new Date().getFullYear()} إشراقة المستقبل للعقارات
          </p>
        </div>
      </div>
    </div>
  );
}
