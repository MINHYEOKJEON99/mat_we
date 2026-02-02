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

    const { applicationId, action } = await request.json();

    if (!applicationId || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "잘못된 요청입니다" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get application details
    const { data: application, error: fetchError } = await supabase
      .from("instructor_applications")
      .select("*")
      .eq("id", applicationId)
      .single();

    if (fetchError || !application) {
      return NextResponse.json(
        { error: "신청을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (application.status !== "pending") {
      return NextResponse.json(
        { error: "이미 처리된 신청입니다" },
        { status: 400 }
      );
    }

    // Update application status (트리거가 자동으로 profiles.role과 requested_instructor 업데이트)
    const newStatus = action === "approve" ? "approved" : "rejected";
    const { error: updateAppError } = await supabase
      .from("instructor_applications")
      .update({
        status: newStatus,
      })
      .eq("id", applicationId);

    if (updateAppError) {
      throw updateAppError;
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error("Application processing error:", error);
    return NextResponse.json(
      { error: "처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
