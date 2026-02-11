import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const { currentRole, requestedRole } = await request.json();

    if (requestedRole !== "instructor") {
      return NextResponse.json(
        { error: "강사 신청만 가능합니다" },
        { status: 400 }
      );
    }

    // Check if there's already a pending application
    const { data: existingApp } = await supabase
      .from("instructor_applications")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .single();

    if (existingApp) {
      return NextResponse.json(
        { error: "이미 대기 중인 신청이 있습니다" },
        { status: 400 }
      );
    }

    // Create new application
    const { error: insertError } = await supabase
      .from("instructor_applications")
      .insert({
        user_id: user.id,
        from_role: currentRole || "student",
        to_role: requestedRole,
        status: "pending",
      });

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Instructor application error:", error);
    return NextResponse.json(
      { error: "신청 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// Get application status
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const { data: application } = await supabase
      .from("instructor_applications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({ application: application || null });
  } catch {
    return NextResponse.json({ application: null });
  }
}
