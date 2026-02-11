import { createAdminClient } from "@/lib/supabase-admin";
import { Resend } from "resend";
import { VerificationEmail } from "@/emails/verification-email";
import { NextRequest, NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName, role, interestedSports, requestedInstructor } = await request.json();

    // 입력 검증
    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: "필수 정보를 모두 입력해주세요" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1. 사용자 생성 (이메일 확인 비활성화 상태로)
    const { data: userData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // 이메일 확인 필요
      user_metadata: {
        display_name: displayName,
        role: role,
        interested_sports: interestedSports,
        requested_instructor: requestedInstructor,
      },
    });

    if (signUpError) {
      console.error("Signup error:", signUpError);

      if (signUpError.message.includes("already registered") || signUpError.message.includes("already exists")) {
        return NextResponse.json(
          { error: "이미 가입된 이메일입니다" },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "회원가입 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }

    // 2. 인증 링크 생성
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "signup",
      email,
      password,
    });

    if (linkError) {
      console.error("Generate link error:", linkError);
      // 사용자는 생성됐지만 링크 생성 실패 - 삭제하지 않고 재시도 가능하게
      return NextResponse.json(
        { error: "인증 메일 발송 준비 중 오류가 발생했습니다. 로그인 페이지에서 인증 메일을 다시 요청해주세요." },
        { status: 500 }
      );
    }

    // 3. Resend로 이메일 발송
    const confirmationUrl = linkData.properties?.action_link;

    if (!confirmationUrl) {
      return NextResponse.json(
        { error: "인증 링크 생성에 실패했습니다" },
        { status: 500 }
      );
    }

    const { error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Mat We <onboarding@resend.dev>",
      to: email,
      subject: "Mat We 이메일 인증",
      react: VerificationEmail({ confirmationUrl, userName: displayName }),
    });

    if (emailError) {
      console.error("Email send error:", emailError);
      return NextResponse.json(
        { error: "인증 메일 발송에 실패했습니다. 로그인 페이지에서 다시 요청해주세요." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "회원가입이 완료되었습니다. 이메일을 확인해주세요.",
      requestedInstructor,
    });

  } catch (error) {
    console.error("Signup API error:", error);
    return NextResponse.json(
      { error: "회원가입 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
