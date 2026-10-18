import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number into Saudi Riyals (SAR / ر.س) currency representation in Arabic.
 */
export function formatCurrency(amount: number, currency: string = "ر.س"): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "0 " + currency;
  const formatted = new Intl.NumberFormat("ar-SA", {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${formatted} ${currency}`;
}

/**
 * Formats a plain number with localized thousands separators.
 */
export function formatNumber(num: number): string {
  if (num === null || num === undefined || isNaN(num)) return "0";
  return new Intl.NumberFormat("ar-SA").format(num);
}

/**
 * Formats a date string into readable Arabic format in Saudi Arabia timezone.
 */
export function formatDate(dateString: string | Date, options?: Intl.DateTimeFormatOptions): string {
  if (!dateString) return "-";
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return "-";

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  };

  return new Intl.DateTimeFormat("ar-SA", defaultOptions).format(date);
}

/**
 * Formats date and time in 12-hour Arabic format with Saudi Arabia timezone.
 */
export function formatDateTime(dateString: string | Date): string {
  if (!dateString) return "-";
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("ar-SA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * Formats time only in 12-hour Arabic format with AM/PM (ص/م).
 */
export function formatTime12(timeString: string): string {
  if (!timeString) return "-";
  const [hoursStr, minutesStr] = timeString.split(":");
  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr || "00";
  if (isNaN(hours)) return timeString;

  const isPM = hours >= 12;
  const period = isPM ? "م" : "ص";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${period}`;
}
