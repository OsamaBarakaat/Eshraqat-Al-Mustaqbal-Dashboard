"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Eye, EyeOff, ArrowLeft, KeyRound, ShieldCheck, RefreshCw } from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { MockStore } from "@/lib/services/mock-store";

export default function LoginPage() {
  const router = useRouter();

  // Mode: "PASSWORD" | "OTP"
  const [authMode, setAuthMode] = useState<"PASSWORD" | "OTP">("PASSWORD");

  // Credentials
  const [email, setEmail] = useState("admin@eshraqat.sa");
  const [password, setPassword] = useState("Eshraqat@2026");
  const [showPassword, setShowPassword] = useState(false);

  // OTP State
  const [otpStep, setOtpStep] = useState<"REQUEST" | "VERIFY">("REQUEST");
  const [otpCode, setOtpCode] = useState("");
  const [otpToken, setOtpToken] = useState<string>("");
  const [countdown, setCountdown] = useState(0); // in seconds
  const [sentInfo, setSentInfo] = useState<{ sentTo?: string; fallback?: boolean } | null>(null);

  // Common UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Countdown timer for OTP resend (decrements every second)
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Format seconds as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Standard Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

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

  // Step 1: Send OTP via Resend (3 minutes countdown = 180s)
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!email.trim() || !email.includes("@")) {
      setError("يرجى إدخال بريد إلكتروني صالح لاستلام رمز التحقق");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "فشل إرسال رمز التحقق عبر Resend");
      }

      setOtpToken(data.token || "");
      setSentInfo({
        sentTo: data.sentTo,
        fallback: data.fallbackSent,
      });
      setOtpStep("VERIFY");
      setCountdown(180); // 3 minutes countdown
      setSuccessMessage(data.message || "تم إرسال رمز التحقق بنجاح إلى بريدك الإلكتروني");
    } catch (err: any) {
      setError(err?.message || "تعذر إرسال رمز التحقق. يرجى التحقق من اتصال الإنترنت.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and Login
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setError("يرجى إدخال رمز التحقق المكون من 6 أرقام");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          otp: otpCode.trim(),
          token: otpToken,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "رمز التحقق غير صحيح");
      }

      setSuccessMessage("تم التحقق بنجاح! جاري تحويلك إلى لوحة التحكم...");

      // Complete login in MockStore
      await MockStore.login(email.trim(), password || "Eshraqat@2026").catch(() => {
        // Fallback for demo login if needed
      });

      setTimeout(() => {
        router.push("/dashboard");
      }, 700);
    } catch (err: any) {
      setError(err?.message || "رمز التحقق غير صحيح أو انتهت صلاحيته.");
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
          {/* Auth Mode Toggle */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-warm-white rounded-2xl border border-neutral-border text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setAuthMode("PASSWORD");
                setError("");
                setSuccessMessage("");
              }}
              className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === "PASSWORD"
                  ? "bg-brand-charcoal text-white shadow-xs"
                  : "text-secondary-text hover:text-primary-text"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>كلمة المرور</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("OTP");
                setError("");
                setSuccessMessage("");
              }}
              className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === "OTP"
                  ? "bg-brand-charcoal text-white shadow-xs"
                  : "text-secondary-text hover:text-primary-text"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-brand-gold" />
              <span>رمز التحقق OTP</span>
            </button>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
              {successMessage}
            </div>
          )}

          {/* MODE 1: STANDARD PASSWORD */}
          {authMode === "PASSWORD" && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
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
          )}

          {/* MODE 2: OTP LOGIN (RESEND) */}
          {authMode === "OTP" && (
            <div className="space-y-4">
              {otpStep === "REQUEST" ? (
                /* Step 1: Request OTP */
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-primary-text mb-1.5">
                      البريد الإلكتروني لاستلام رمز التحقق:
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="osaamabarakaat@gmail.com"
                        className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm bg-warm-white border border-neutral-border rounded-xl dir-ltr focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold transition-colors font-mono"
                        required
                      />
                      <Mail className="w-4 h-4 text-secondary-text absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div className="p-3 bg-brand-gold/10 rounded-xl border border-brand-gold/20 text-[11px] text-primary-text space-y-1 leading-relaxed">
                    <p className="font-semibold flex items-center gap-1.5 text-brand-charcoal">
                      <ShieldCheck className="w-4 h-4 text-brand-gold shrink-0" />
                      <span>إرسال آمن عبر Resend Email</span>
                    </p>
                    <p className="text-secondary-text">
                      سيتم إرسال رمز تحقق مكوّن من 6 أرقام صالح لمدة 10 دقائق لتسجيل الدخول الفوري دون كلمة مرور.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl bg-brand-gold hover:bg-brand-gold/90 text-primary-text font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-primary-text border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>إرسال رمز التحقق</span>
                        <ArrowLeft className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Step 2: Verify OTP */
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-primary-text">
                        أدخل رمز التحقق (6 أرقام):
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpStep("REQUEST");
                          setError("");
                        }}
                        className="text-[11px] text-brand-gold hover:underline cursor-pointer"
                      >
                        تعديل البريد
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="••••••"
                        className="w-full px-4 py-3 text-center text-xl tracking-[0.5em] font-mono font-bold bg-warm-white border border-neutral-border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold transition-colors"
                        autoFocus
                        required
                      />
                    </div>

                    {sentInfo?.fallback && (
                      <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg mt-2 border border-amber-200">
                        ملاحظة الخطة التجريبية (Resend): تم توجيه الرسالة إلى البريد المعتمد في Resend (<strong>{sentInfo.sentTo}</strong>).
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otpCode.length !== 6}
                    className="w-full py-3 px-4 rounded-xl bg-brand-gold hover:bg-brand-gold/90 text-primary-text font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-primary-text border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>تأكيد وتسجيل الدخول</span>
                        <ArrowLeft className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    {countdown > 0 ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-warm-white border border-neutral-border rounded-full text-xs text-secondary-text">
                        <span>إعادة الإرسال بعد:</span>
                        <strong className="text-primary-text font-mono text-xs font-bold text-brand-charcoal">
                          {formatTime(countdown)}
                        </strong>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendOtp()}
                        disabled={isLoading}
                        className="text-xs font-semibold text-brand-charcoal hover:text-brand-gold transition-colors flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>إعادة إرسال الرمز</span>
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-secondary-text">
          منصة إشراقة المستقبل للعقارات © 2026 — نحو غدٍ مشرق
        </p>
      </div>
    </div>
  );
}
