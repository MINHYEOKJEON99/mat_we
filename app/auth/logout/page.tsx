"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { signOut } from "@/lib/api/client";

export default function LogoutPage() {
  const [status, setStatus] = useState<"logging-out" | "complete" | "error">("logging-out");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const performLogout = async () => {
      try {
        console.log("[Logout] Starting logout process...");
        setStatus("logging-out");

        // 1. 클라이언트에서 스토리지 정리
        try {
          signOut();
          console.log("[Logout] Storage cleanup successful");
        } catch (error) {
          console.error("[Logout] Error during storage cleanup, continuing anyway:", error);
        }

        // 2. 서버 사이드에서 쿠키 삭제 (타임아웃 설정)
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include',
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          console.log("[Logout] Server-side cookies cleared");
        } catch (error) {
          console.error("[Logout] Error during server logout, continuing anyway:", error);
        }

        setStatus("complete");

        // 3. 홈으로 리다이렉트 (전체 페이지 새로고침)
        console.log("[Logout] Redirecting to home...");
        setTimeout(() => {
          window.location.href = "/";
        }, 500);

      } catch (error) {
        console.error("[Logout] Error during logout:", error);
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "로그아웃 중 오류가 발생했습니다");

        // 에러가 발생해도 5초 후 홈으로 이동 (전체 페이지 새로고침)
        setTimeout(() => {
          window.location.href = "/";
        }, 5000);
      }
    };

    performLogout();
  }, []);

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
