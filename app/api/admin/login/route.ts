import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { adminId, password } = await request.json();

    const validAdminId = process.env.ADMIN_ID;
    const validPassword = process.env.ADMIN_PASSWORD;

    if (!validAdminId || !validPassword) {
      return NextResponse.json(
        { error: "관리자 설정이 완료되지 않았습니다" },
        { status: 500 }
      );
    }

    if (adminId !== validAdminId || password !== validPassword) {
      return NextResponse.json(
        { error: "아이디 또는 비밀번호가 올바르지 않습니다" },
        { status: 401 }
      );
    }

    // Set admin session cookie
    const cookieStore = await cookies();
    cookieStore.set("admin_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
