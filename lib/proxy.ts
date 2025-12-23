import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Routes that require authentication
  const protectedRoutes = ["/dashboard", "/instructor", "/student", "/chat", "/community/new"]
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  // Routes that don't need profile completion check
  const authRoutes = ["/auth/login", "/auth/signup", "/auth/callback", "/auth/complete-profile", "/auth/error", "/auth/signup-success"]
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // If accessing protected route without authentication, redirect to login
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // If user is authenticated and not on auth routes, check profile completeness
  if (user && !isAuthRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_profile_complete")
      .eq("id", user.id)
      .single()

    // If profile doesn't exist or is not complete, redirect to complete-profile
    if (!profile || !profile.is_profile_complete) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/complete-profile"
      return NextResponse.redirect(url)
    }
  }

  // If user is already logged in and tries to access login/signup, redirect to dashboard
  if (user && (pathname === "/auth/login" || pathname === "/auth/signup")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_profile_complete")
      .eq("id", user.id)
      .single()

    if (profile?.is_profile_complete) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
