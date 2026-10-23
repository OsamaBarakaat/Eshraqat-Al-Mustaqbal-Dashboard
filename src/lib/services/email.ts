import { Resend } from "resend";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const VERIFIED_RECEIVER = process.env.RESEND_VERIFIED_RECEIVER || "osaamabarakaat@gmail.com";

let resendInstance: Resend | null = null;

export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!resendInstance) {
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

interface SendOtpOptions {
  to: string;
  otp: string;
  userName?: string;
  expiryMinutes?: number;
}

/**
 * Sends a luxury branded OTP email using Resend
 */
export async function sendOtpEmail({
  to,
  otp,
  userName = "مستخدم المنصة",
  expiryMinutes = 10,
}: SendOtpOptions) {
  const resend = getResendClient();
  if (!resend) {
    console.error("[Resend Error]: RESEND_API_KEY is missing in environment variables.");
    return {
      success: false,
      error: "مفتاح RESEND_API_KEY غير موجود في إعدادات البيئة (Environment Variables).",
    };
  }

  // On Resend free tier (using onboarding@resend.dev), only the account owner's email can receive emails.
  // In development/testing, if the recipient is an internal or placeholder email, we ensure it goes to the verified email.
  const recipientEmail =
    to.endsWith("@eshraqat.sa") || to.includes("localhost")
      ? VERIFIED_RECEIVER
      : to;

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>رمز التحقق - إشراقة المستقبل</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 24px; background-color: #F8F9FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; direction: rtl; text-align: right;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06); border: 1px solid #EAEAEA;">
        <!-- Header -->
        <tr>
          <td style="background-color: #1A1A1A; padding: 32px 24px; text-align: center;">
            <h1 style="color: #D4AF37; font-size: 22px; font-weight: 700; margin: 0 0 6px; letter-spacing: 0.5px;">
              إشراقة المستقبل للعقارات
            </h1>
            <p style="color: #A0A0A0; font-size: 13px; margin: 0; font-weight: 300;">
              بوابتك الذكية لإدارة التطوير والاستثمار العقاري
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding: 36px 32px; text-align: center;">
            <h2 style="color: #1F2937; font-size: 19px; font-weight: 600; margin: 0 0 12px;">
              رمز التحقق لتسجيل الدخول (OTP)
            </h2>
            <p style="color: #4B5563; font-size: 14px; line-height: 1.6; margin: 0 0 28px;">
              مرحباً <strong style="color: #111827;">${userName}</strong>،<br>
              لقد تلقينا طلباً للدخول إلى حسابك في لوحة تحكم إشراقة المستقبل. استخدم الرمز السري أدناه لتأكيد هويتك:
            </p>

            <!-- OTP Box -->
            <div style="background-color: #FCFBF7; border: 2px dashed #D4AF37; border-radius: 16px; padding: 20px; display: inline-block; margin-bottom: 24px; min-width: 260px;">
              <span style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #1A1A1A; font-family: 'Courier New', monospace; display: block; padding-right: 10px;">
                ${otp}
              </span>
            </div>

            <p style="color: #DC2626; font-size: 13px; font-weight: 500; margin: 0 0 8px;">
              ⚠️ هذا الرمز صالح لمدة ${expiryMinutes} دقائق فقط.
            </p>
            <p style="color: #6B7280; font-size: 12px; margin: 0;">
              إذا لم تقم بطلب هذا الرمز، يُرجى تجاهل هذا البريد الإلكتروني أو إبلاغ المشرف الفني فوراً.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color: #F9FAFB; padding: 20px 24px; text-align: center; border-top: 1px solid #F3F4F6;">
            <p style="color: #9CA3AF; font-size: 12px; margin: 0 0 4px;">
              مرسل إلى: <span dir="ltr" style="font-family: monospace;">${to}</span>
            </p>
            <p style="color: #9CA3AF; font-size: 11px; margin: 0;">
              جميع الحقوق محفوظة © ${new Date().getFullYear()} شركة إشراقة المستقبل للعقارات
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: `رمز التحقق الخاص بك: ${otp} - إشراقة المستقبل`,
      html,
    });

    if (error) {
      console.error("[Resend Error]:", error);
      // If error is 403 because domain is not verified, try sending to verified receiver as dev fallback
      if (recipientEmail !== VERIFIED_RECEIVER) {
        console.warn(`[Resend Fallback]: Retrying delivery to verified receiver ${VERIFIED_RECEIVER}`);
        const retry = await resend.emails.send({
          from: FROM_EMAIL,
          to: VERIFIED_RECEIVER,
          subject: `[تجربة/تحويل لـ ${to}] رمز التحقق: ${otp} - إشراقة المستقبل`,
          html,
        });
        return {
          success: !retry.error,
          data: retry.data,
          error: retry.error,
          fallbackSent: true,
          recipient: VERIFIED_RECEIVER,
        };
      }
      return { success: false, error };
    }

    return {
      success: true,
      data,
      recipient: recipientEmail,
      fallbackSent: recipientEmail !== to,
    };
  } catch (err: any) {
    console.error("[Email Exception]:", err);
    return { success: false, error: err?.message || "Unknown error occurred" };
  }
}
