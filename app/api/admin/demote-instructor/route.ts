import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/server";

export async function POST(request: Request) {
  try {
    // Check admin session
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("admin_session");

    if (!adminSession || adminSession.value !== "authenticated") {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다" },
        { status: 401 }
      );
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "사용자 ID가 필요합니다" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get user details to verify they are an instructor
    const { data: user, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (fetchError || !user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (user.role !== "instructor") {
      return NextResponse.json(
        { error: "해당 사용자는 강사가 아닙니다" },
        { status: 400 }
      );
    }

    // Update user role to student
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        role: "student",
        requested_instructor: false,
      })
      .eq("id", userId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Demote instructor error:", error);
    return NextResponse.json(
      { error: "처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
