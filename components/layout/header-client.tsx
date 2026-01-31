"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, LayoutDashboard, User, LogOut } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { Profile } from "@/lib/database";

interface HeaderClientProps {
  initialUser: SupabaseUser | null;
  initialProfile: Profile | null;
}

export function HeaderClient({ initialUser, initialProfile }: HeaderClientProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const { user, profile, isLoading } = useUser(initialUser, initialProfile);

  const handleLogout = () => {
    // 로그아웃 페이지로 이동하여 처리
    router.push("/auth/logout");
  };

  // 프로필 테이블의 avatar_url 우선 사용, 없으면 OAuth metadata 사용
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const userInitial = profile?.display_name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || "U";

  console.log(user);
  console.log(isLoading);

  // 로딩 중에는 아무것도 표시하지 않음 (깜빡임 방지)
  const showUserMenu = !isLoading && user;
  const showAuthButtons = !isLoading && !user;

  // 디버그 로그
  console.log(
    "[HeaderClient] isLoading:",
    isLoading,
    "user:",
    user?.email,
    "showUserMenu:",
    showUserMenu,
    "showAuthButtons:",
    showAuthButtons,
  );

  return (
    <header
      className="sticky top-0 shadow-lg z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      role="banner"
    >
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex h-16 items-center justify-between">
          <nav className="hidden md:flex items-center gap-6" aria-label="메인 네비게이션">
            <Link href="/courses" className="text-sm font-medium hover:text-primary transition-colors">
              강의
            </Link>
            <Link href="/instructors" className="text-sm font-medium hover:text-primary transition-colors">
              강사
            </Link>
            <Link href="/community" className="text-sm font-medium hover:text-primary transition-colors">
              커뮤니티
            </Link>
          </nav>
          <Link href="/" className="flex items-center space-x-2" aria-label="Mat We 홈으로 이동">
            <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: '"DM Serif Text", serif' }}>
              Mat We
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {showUserMenu ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={avatarUrl} alt="프로필" />
                      <AvatarFallback>{userInitial}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="h-4 w-4" />
                      대시보드
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/mypage" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      마이페이지
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <LogOut className="h-4 w-4" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : showAuthButtons ? (
              <>
                <Button asChild variant="ghost" className="hidden md:flex">
                  <Link href="/auth/login">로그인</Link>
                </Button>
                <Button asChild className="hidden md:flex">
                  <Link href="/auth/signup">시작하기</Link>
                </Button>
              </>
            ) : null}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <nav id="mobile-menu" className="md:hidden py-4 space-y-4 border-t" aria-label="모바일 네비게이션">
            <Link
              href="/courses"
              className="block py-2 text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              강의
            </Link>
            <Link
              href="/instructors"
              className="block py-2 text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              강사
            </Link>
            <Link
              href="/community"
              className="block py-2 text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              커뮤니티
            </Link>
            <div className="pt-4 space-y-2 border-t">
              {showUserMenu ? (
                <>
                  <Button asChild variant="ghost" className="w-full justify-start gap-2">
                    <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                      <LayoutDashboard className="h-4 w-4" />
                      대시보드
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" className="w-full justify-start gap-2">
                    <Link href="/mypage" onClick={() => setIsMenuOpen(false)}>
                      <User className="h-4 w-4" />
                      마이페이지
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-red-600 hover:text-red-600"
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    로그아웃
                  </Button>
                </>
              ) : showAuthButtons ? (
                <>
                  <Button asChild variant="ghost" className="w-full">
                    <Link href="/auth/login" onClick={() => setIsMenuOpen(false)}>
                      로그인
                    </Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link href="/auth/signup" onClick={() => setIsMenuOpen(false)}>
                      시작하기
                    </Link>
                  </Button>
                </>
              ) : null}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
