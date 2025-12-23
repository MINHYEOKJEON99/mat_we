import { createClient } from "@/lib/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if this is a new user who needs to complete their profile
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Check if profile exists and is complete
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

        // If no profile or profile is incomplete, redirect to complete-profile
        if (!profile || !profile.is_profile_complete) {
          return NextResponse.redirect(`${origin}/auth/complete-profile`)
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host")
      const isLocalEnv = process.env.NODE_ENV === "development"

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/error?message=인증에 실패했습니다`)
}
