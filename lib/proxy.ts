import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 인증이 필요한 라우트 목록
  const protectedRoutes = ["/dashboard", "/instructor", "/student", "/chat", "/community/new"];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // 프로필 완성 체크가 필요 없는 인증 관련 라우트
  const authRoutes = [
    "/auth/login",
    "/auth/signup",
    "/auth/callback",
    "/auth/complete-profile",
    "/auth/error",
    "/auth/signup-success",
  ];
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // 비로그인 상태로 보호된 라우트 접근 시 → 로그인 페이지로 리다이렉트
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // 로그인 상태 + 인증 라우트 아님 → 프로필 완성 여부 체크
  if (user && !isAuthRoute) {
    const { data: profile } = await supabase.from("profiles").select("is_profile_complete").eq("id", user.id).single();

    // 프로필이 없거나 미완성이면 → 프로필 완성 페이지로 리다이렉트
    if (!profile || !profile.is_profile_complete) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/complete-profile";
      return NextResponse.redirect(url);
    }
  }

  // 로그인 상태에서 로그인/회원가입 페이지 접근 시 → 루트 페이지로 리다이렉트
  if (user && (pathname === "/auth/login" || pathname === "/auth/signup")) {
    const { data: profile } = await supabase.from("profiles").select("is_profile_complete").eq("id", user.id).single();

    if (profile?.is_profile_complete) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
