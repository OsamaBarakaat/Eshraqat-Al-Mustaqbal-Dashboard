import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/services/otp-store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp, token } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: "يرجى تقديم البريد الإلكتروني ورمز التحقق" },
        { status: 400 }
      );
    }

    const verification = verifyOtp(email, otp, token);

    if (!verification.success) {
      return NextResponse.json(
        { success: false, message: verification.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "تم التحقق بنجاح من الرمز",
    });
  } catch (error: any) {
    console.error("[Verify OTP API Error]:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "حدث خطأ غير متوقع أثناء التحقق من الرمز",
      },
      { status: 500 }
    );
  }
}
