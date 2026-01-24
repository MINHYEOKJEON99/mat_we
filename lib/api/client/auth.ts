/**
 * 클라이언트 사이드에서 사용자 로그아웃을 수행합니다.
 * 로컬 스토리지와 세션 스토리지를 직접 정리합니다.
 */
export function signOut(): void {
  console.log("[signOut] Starting storage cleanup...");

  // 세션 스토리지 클리어
  console.log("[signOut] Clearing sessionStorage...");
  sessionStorage.clear();

  // 로컬 스토리지 전체 클리어 (Supabase 세션 포함)
  console.log("[signOut] Clearing all localStorage...");
  if (typeof window !== "undefined") {
    localStorage.clear();
  }

  console.log("[signOut] Storage cleanup completed");
}
