import { createAdminClient } from "@/lib/supabase-admin";
import { Resend } from "resend";
import { VerificationEmail } from "@/emails/verification-email";
import { NextRequest, NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "이메일을 입력해주세요" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 사용자 확인
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      console.error("List users error:", userError);
      // 보안상 구체적인 에러 노출하지 않음
      return NextResponse.json({
        success: true,
        message: "해당 이메일로 가입된 계정이 있고 아직 인증되지 않았다면 인증 메일이 발송됩니다.",
      });
    }

    const user = users.users.find((u) => u.email === email);

    if (!user) {
      // 보안상 사용자가 없어도 성공으로 응답
      return NextResponse.json({
        success: true,
        message: "해당 이메일로 가입된 계정이 있고 아직 인증되지 않았다면 인증 메일이 발송됩니다.",
      });
    }

    // 이미 인증된 사용자 체크
    if (user.email_confirmed_at) {
      return NextResponse.json(
        { error: "이미 인증이 완료된 이메일입니다. 로그인을 시도해주세요." },
        { status: 400 }
      );
    }

    // 인증 링크 생성 (magiclink 타입 사용 - 이메일 인증 + 로그인)
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    if (linkError) {
      console.error("Generate link error:", linkError);
      return NextResponse.json(
        { error: "인증 링크 생성에 실패했습니다" },
        { status: 500 }
      );
    }

    const confirmationUrl = linkData.properties?.action_link;

    if (!confirmationUrl) {
      return NextResponse.json(
        { error: "인증 링크 생성에 실패했습니다" },
        { status: 500 }
      );
    }

    // 이메일 발송
    const userName = user.user_metadata?.display_name || "회원";

    const { error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Mat We <onboarding@resend.dev>",
      to: email,
      subject: "Mat We 이메일 인증",
      react: VerificationEmail({ confirmationUrl, userName }),
    });

    if (emailError) {
      console.error("Email send error:", emailError);
      return NextResponse.json(
        { error: "이메일 발송에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "인증 메일이 발송되었습니다. 이메일을 확인해주세요.",
    });

  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "인증 메일 발송 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
