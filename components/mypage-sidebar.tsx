"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { User, FileText, BookOpen, Upload } from "lucide-react"

const navItems = [
  {
    href: "/mypage",
    label: "프로필",
    icon: User,
  },
  {
    href: "/mypage/posts",
    label: "작성한 게시글",
    icon: FileText,
  },
  {
    href: "/mypage/enrolled-courses",
    label: "수강한 강의",
    icon: BookOpen,
  },
  {
    href: "/mypage/uploaded-courses",
    label: "올린 강의",
    icon: Upload,
  },
]

export function MypageSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r bg-background hidden md:block">
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

export function MypageMobileNav() {
  const pathname = usePathname()

  return (
    <nav className="flex md:hidden overflow-x-auto border-b bg-background">
      <div className="flex gap-1 p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
