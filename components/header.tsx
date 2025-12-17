"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Menu } from "lucide-react"
import { useState } from "react"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold tracking-tight">Mat We</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
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

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" className="hidden md:flex">
              <Link href="/auth/login">로그인</Link>
            </Button>
            <Button asChild className="hidden md:flex">
              <Link href="/auth/signup">시작하기</Link>
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4 border-t">
            <Link href="/courses" className="block py-2 text-sm font-medium hover:text-primary transition-colors">
              강의
            </Link>
            <Link href="/instructors" className="block py-2 text-sm font-medium hover:text-primary transition-colors">
              강사
            </Link>
            <Link href="/community" className="block py-2 text-sm font-medium hover:text-primary transition-colors">
              커뮤니티
            </Link>
            <div className="pt-4 space-y-2 border-t">
              <Button asChild variant="ghost" className="w-full">
                <Link href="/auth/login">로그인</Link>
              </Button>
              <Button asChild className="w-full">
                <Link href="/auth/signup">시작하기</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
