import crypto from "crypto";

const OTP_SECRET = process.env.OTP_SECRET || process.env.RESEND_API_KEY || "eshraqat-otp-secret-key-2026";
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes expiry for the OTP validity
const MAX_ATTEMPTS = 5;

// In-memory fallback (useful in local dev / persistent processes)
const globalForOtp = global as unknown as {
  otpStore?: Map<string, { code: string; expiresAt: number; attempts: number }>;
};
const otpStore =
  globalForOtp.otpStore ||
  new Map<string, { code: string; expiresAt: number; attempts: number }>();
if (process.env.NODE_ENV !== "production") globalForOtp.otpStore = otpStore;

/**
 * Generates a random 6-digit OTP
 */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Creates a stateless signed verification token for Vercel Serverless multi-instance compatibility
 */
export function createOtpToken(email: string, code: string, expiresAt: number): string {
  const normalized = email.trim().toLowerCase();
  const data = `${normalized}:${code}:${expiresAt}`;
  const signature = crypto.createHmac("sha256", OTP_SECRET).update(data).digest("hex");
  return `${expiresAt}.${signature}`;
}

/**
 * Saves OTP in-memory and returns token + expiresAt
 */
export function saveOtp(
  email: string,
  code: string
): { expiresAt: number; token: string } {
  const normalized = email.trim().toLowerCase();
  const expiresAt = Date.now() + OTP_EXPIRY_MS;

  otpStore.set(normalized, {
    code,
    expiresAt,
    attempts: 0,
  });

  const token = createOtpToken(normalized, code, expiresAt);
  return { expiresAt, token };
}

/**
 * Verifies an OTP using either stateless token or in-memory map
 */
export function verifyOtp(
  email: string,
  inputCode: string,
  token?: string
): { success: boolean; message: string } {
  const normalized = email.trim().toLowerCase();
  const cleanCode = inputCode.trim();

  // 1. If signed token is provided (stateless verification for Vercel Serverless)
  if (token && token.includes(".")) {
    const [expiresAtStr, signature] = token.split(".");
    const expiresAt = parseInt(expiresAtStr, 10);

    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return {
        success: false,
        message: "انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد.",
      };
    }

    const expectedData = `${normalized}:${cleanCode}:${expiresAt}`;
    const expectedSig = crypto.createHmac("sha256", OTP_SECRET).update(expectedData).digest("hex");

    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      // Clear in-memory if present
      otpStore.delete(normalized);
      return {
        success: true,
        message: "تم التحقق من الرمز بنجاح.",
      };
    }
  }

  // 2. Fallback to in-memory store
  const entry = otpStore.get(normalized);
  if (!entry) {
    return {
      success: false,
      message: "رمز التحقق غير صحيح أو منتهي الصلاحية. يرجى طلب رمز جديد.",
    };
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(normalized);
    return {
      success: false,
      message: "انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد.",
    };
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(normalized);
    return {
      success: false,
      message: "تم تجاوز الحد الأقصى للمحاولات الخاطئة. يرجى طلب رمز جديد.",
    };
  }

  if (entry.code !== cleanCode) {
    entry.attempts += 1;
    return {
      success: false,
      message: `رمز التحقق غير صحيح. متبقي ${MAX_ATTEMPTS - entry.attempts} محاولات.`,
    };
  }

  otpStore.delete(normalized);
  return {
    success: true,
    message: "تم التحقق من الرمز بنجاح.",
  };
}
