"use client";

import React, { useState } from "react";
import { AlertCircle, AlertTriangle, HelpCircle, X, Lock, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "warning" | "primary";
  requireReason?: boolean;
  reasonPlaceholder?: string;
  reasonLabel?: string;
  requirePassword?: boolean;
}

const DEFAULT_ADMIN_PASSWORD = "Eshraqat@2026";

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  variant = "destructive",
  requireReason = false,
  reasonPlaceholder = "يرجى كتابة السبب هنا بالتفصيل...",
  reasonLabel = "سبب الإجراء:",
  requirePassword = false,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requirePassword) {
      if (!password.trim()) {
        setError("يرجى إدخال كلمة المرور للتأكيد الأمني");
        return;
      }
      if (password !== DEFAULT_ADMIN_PASSWORD) {
        setError("كلمة المرور غير صحيحة، يرجى التحقق وإعادة المحاولة");
        return;
      }
    }

    if (requireReason && !reason.trim()) {
      setError("يرجى إدخال السبب قبل المتابعة");
      return;
    }

    onConfirm(reason.trim());
    setReason("");
    setPassword("");
    setError("");
  };

  const handleClose = () => {
    setReason("");
    setPassword("");
    setError("");
    onClose();
  };

  const getVariantDetails = () => {
    switch (variant) {
      case "destructive":
        return {
          icon: <AlertCircle className="w-6 h-6 text-rose-600" />,
          iconBg: "bg-rose-100",
          buttonBg: "bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500",
        };
      case "warning":
        return {
          icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
          iconBg: "bg-amber-100",
          buttonBg: "bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500",
        };
      case "primary":
      default:
        return {
          icon: <HelpCircle className="w-6 h-6 text-brand-gold-deep" />,
          iconBg: "bg-brand-gold-light",
          buttonBg: "bg-brand-gold hover:bg-brand-gold-hover text-brand-charcoal font-semibold focus:ring-brand-gold",
        };
    }
  };

  const v = getVariantDetails();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-surface border border-neutral-border p-6 shadow-xl animate-in zoom-in-95 duration-200 text-right cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 left-4 p-1.5 text-secondary-text hover:text-primary-text hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
          aria-label="إغلاق النافذة"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className={cn("p-3 rounded-xl shrink-0", v.iconBg)}>{v.icon}</div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-primary-text">{title}</h3>
            <p className="mt-1.5 text-xs sm:text-sm text-secondary-text leading-relaxed">{description}</p>
          </div>
        </div>

        {/* Reason field */}
        {requireReason && (
          <div className="mt-4">
            <label className="block text-xs font-semibold text-primary-text mb-1.5">{reasonLabel}</label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError("");
              }}
              placeholder={reasonPlaceholder}
              rows={3}
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-neutral-border bg-warm-white focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-gold focus:border-brand-gold resize-none transition-colors"
            />
          </div>
        )}

        {/* Password verification field */}
        {requirePassword && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50/60 border border-rose-200/80 space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-rose-950">
              <Lock className="w-3.5 h-3.5 text-rose-600" />
              <span>تأكيد صلاحية المشرف — أدخل كلمة المرور:</span>
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                placeholder="أدخل كلمة المرور لتأكيد الحذف..."
                className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-white border border-rose-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-mono dir-ltr text-right"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-secondary-text hover:text-primary-text absolute left-2.5 top-1/2 -translate-y-1/2 rounded cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            <p className="text-[11px] text-zinc-500">
              💡 كلمة المرور التجريبية للمشرف: <strong className="font-mono text-zinc-700">Eshraqat@2026</strong>
            </p>
          </div>
        )}

        {error && <p className="text-xs text-rose-600 mt-2 font-medium">{error}</p>}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-secondary-text hover:text-primary-text hover:bg-zinc-100 rounded-xl transition-colors border border-neutral-border cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={cn(
              "px-5 py-2 text-xs sm:text-sm rounded-xl transition-all shadow-xs focus:ring-2 focus:ring-offset-2 cursor-pointer font-bold",
              v.buttonBg
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
