import { createClient } from "@/lib/server"
import { redirect } from "next/navigation"
import { HeroCarousel } from "@/components/hero-carousel"
import { AmbassadorsSection } from "@/components/ambassadors-section"
import { FeaturedCourses } from "@/components/featured-courses"
import { StatsSection } from "@/components/stats-section"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <HeroCarousel />
        <StatsSection />
        <AmbassadorsSection />
        <FeaturedCourses />

        {/* CTA Section */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">
              지금 Mat We와 함께 시작하세요
            </h2>
            <p className="text-xl text-muted-foreground text-pretty">
              전문 강사진의 체계적인 커리큘럼과 1:1 맞춤 PT로
              <br className="hidden md:block" />
              당신의 주짓수 실력을 한 단계 끌어올리세요
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8 py-6 h-auto">
                <Link href="/auth/signup">무료로 시작하기</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6 h-auto bg-transparent">
                <Link href="/courses">강의 둘러보기</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Mat We</h3>
              <p className="text-sm text-muted-foreground">주짓수 강사와 수강생을 연결하는 프리미엄 플랫폼</p>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">서비스</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/courses" className="hover:text-primary transition-colors">
                    강의
                  </Link>
                </li>
                <li>
                  <Link href="/instructors" className="hover:text-primary transition-colors">
                    강사
                  </Link>
                </li>
                <li>
                  <Link href="/community" className="hover:text-primary transition-colors">
                    커뮤니티
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">회사</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/about" className="hover:text-primary transition-colors">
                    소개
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-primary transition-colors">
                    문의
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">법적 고지</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/privacy" className="hover:text-primary transition-colors">
                    개인정보처리방침
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-primary transition-colors">
                    이용약관
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; 2025 Mat We. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
