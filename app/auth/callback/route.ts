import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    try {
      const cookieStore = await cookies()

      // OAuth callback은 @supabase/ssr 사용 (PKCE 처리 필요)
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                )
              } catch (error) {
                console.warn("[Callback] Cookie setting error:", error)
              }
            },
          },
        }
      )

      // Code를 세션으로 교환 (PKCE verifier 자동 처리)
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error("[Callback] exchangeCodeForSession error:", exchangeError)
        return NextResponse.redirect(
          `${origin}/auth/error?message=${encodeURIComponent(exchangeError.message || "인증에 실패했습니다")}`
        )
      }

      // 사용자 정보 가져오기
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error("[Callback] getUser error:", userError)
        return NextResponse.redirect(`${origin}/auth/error?message=사용자 정보를 가져올 수 없습니다`)
      }

      console.log("[Callback] Session created for user:", user.email)

      // 프로필 확인
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_profile_complete, email")
        .eq("id", user.id)
        .single()

      // 프로필에 email이 없으면 저장
      if (profile && !profile.email && user.email) {
        await supabase
          .from("profiles")
          .update({ email: user.email })
          .eq("id", user.id)
      }

      // 강사 신청이 있으면 instructor_applications에 추가
      if (user.user_metadata?.requested_instructor) {
        // 이미 신청이 있는지 확인
        const { data: existingApp } = await supabase
          .from("instructor_applications")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "pending")
          .single()

        if (!existingApp) {
          await supabase
            .from("instructor_applications")
            .insert({
              user_id: user.id,
              from_role: "student",
              to_role: "instructor",
              status: "pending",
            })
          console.log("[Callback] Instructor application created for user:", user.email)
        }
      }

      // 프로필 미완성이면 프로필 완성 페이지로
      if (!profile || !profile.is_profile_complete) {
        console.log("[Callback] Profile incomplete, redirecting to complete-profile")
        return NextResponse.redirect(`${origin}/auth/complete-profile`)
      }

      // 성공 - 원하는 페이지로 리다이렉트
      console.log("[Callback] Login successful, redirecting to:", next)
      const forwardedHost = request.headers.get("x-forwarded-host")
      const isLocalEnv = process.env.NODE_ENV === "development"

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    } catch (error) {
      console.error("[Callback] Unexpected error:", error)
      return NextResponse.redirect(
        `${origin}/auth/error?message=${encodeURIComponent("인증 처리 중 오류가 발생했습니다")}`
      )
    }
  }

  // code가 없으면 에러
  return NextResponse.redirect(`${origin}/auth/error?message=${encodeURIComponent("인증 코드가 없습니다")}`)
}
