import { NextResponse } from "next/server";
import { generateOtp, saveOtp } from "@/lib/services/otp-store";
import { sendOtpEmail } from "@/lib/services/email";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "يرجى إدخال بريد إلكتروني صالح" },
        { status: 400 }
      );
    }

    const otp = generateOtp();
    const { expiresAt, token } = saveOtp(email, otp);

    const emailResult = await sendOtpEmail({
      to: email.trim(),
      otp,
      userName: name || "المشرف",
      expiryMinutes: 10,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            "فشل إرسال البريد الإلكتروني عبر Resend: " +
            (typeof emailResult.error === "object"
              ? JSON.stringify(emailResult.error)
              : emailResult.error),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "تم إرسال رمز التحقق إلى بريدك الإلكتروني بنجاح",
      expiresAt,
      token,
      fallbackSent: emailResult.fallbackSent,
      sentTo: emailResult.recipient,
      // For testing/development convenience only:
      debugOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
    });
  } catch (error: any) {
    console.error("[Send OTP API Error]:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "حدث خطأ غير متوقع أثناء إرسال رمز التحقق",
      },
      { status: 500 }
    );
  }
}
