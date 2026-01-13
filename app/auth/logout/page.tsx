"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LogoutPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"logging-out" | "complete" | "error">("logging-out");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const performLogout = async () => {
      try {
        console.log("[Logout] Starting logout process...");
        setStatus("logging-out");

        // 1. 클라이언트에서 Supabase 로그아웃
        const { createClient } = await import("@/lib/client");
        const supabase = createClient();
        await supabase.auth.signOut();
        console.log("[Logout] Supabase signOut successful");

        // 2. 서버 사이드에서 쿠키 삭제
        await fetch('/api/logout', {
          method: 'POST',
          credentials: 'include',
        });

        console.log("[Logout] Server-side cookies cleared");

        // 3. 클라이언트 사이드에서 추가 쿠키 삭제
        const cookies = document.cookie.split(';');
        const domain = window.location.hostname;
        const domainParts = domain.split('.');

        for (let cookie of cookies) {
          const eqPos = cookie.indexOf('=');
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();

          if (!name) continue;

          // 기본 삭제
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          document.cookie = `${name}=;max-age=0;path=/`;

          // 도메인 지정 삭제
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${domain}`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${domain}`;

          // 상위 도메인들에서 쿠키 삭제
          for (let i = 0; i < domainParts.length; i++) {
            const currentDomain = domainParts.slice(i).join('.');
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${currentDomain}`;
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${currentDomain}`;
          }
        }

        console.log("[Logout] Client-side cookies cleared");

        // 4. 세션 스토리지와 로컬 스토리지 클리어
        sessionStorage.clear();

        if (typeof window !== "undefined") {
          const keys = Object.keys(localStorage);
          keys.forEach((key) => {
            if (key.includes("supabase") || key.includes("auth")) {
              localStorage.removeItem(key);
            }
          });
        }

        console.log("[Logout] Storage cleared");
        setStatus("complete");

        // 5. 홈으로 리다이렉트
        console.log("[Logout] Redirecting to home...");
        setTimeout(() => {
          router.push("/");
        }, 500);

      } catch (error) {
        console.error("[Logout] Error during logout:", error);
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "로그아웃 중 오류가 발생했습니다");

        // 에러가 발생해도 5초 후 홈으로 이동
        setTimeout(() => {
          router.push("/");
        }, 5000);
      }
    };

    performLogout();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="text-center space-y-6">
          {/* 로딩 아이콘 */}
          {status !== "error" && (
            <div className="flex justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          )}

          {/* 상태 메시지 */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">
              {status === "logging-out" && "로그아웃 중..."}
              {status === "complete" && "로그아웃 완료"}
              {status === "error" && "오류 발생"}
            </h1>

            <p className="text-muted-foreground">
              {status === "logging-out" && "잠시만 기다려주세요."}
              {status === "complete" && "홈 페이지로 이동합니다."}
              {status === "error" && errorMessage}
            </p>
          </div>

          {status === "error" && (
            <p className="text-xs text-muted-foreground">
              5초 후 자동으로 홈 페이지로 이동합니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
