import { FeaturedCourses } from "@/components/course/featured-courses";
import { FeaturedInstructors } from "@/components/landing/featured-instructors";
import { Footer } from "@/components/layout/footer";
import { FadeInSection } from "@/components/ui/fade-in-section";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function HomePage() {
  return (
    <>
      <main className="flex flex-col items-center overflow-x-hidden">
        {/* Hero Section - Service Introduction */}
        <section className="w-full max-w-[1024px] px-6 py-24 md:py-32">
          <FadeInSection>
            <div className="space-y-8 text-center">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
                매트 위에서 시작되는
                <br />
                <span className="text-muted-foreground">당신의 성장</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-[600px] mx-auto leading-relaxed">
                주짓수, 유도, 레슬링, 삼보까지.
                <br />
                모든 매트 스포츠를 위한 강의 플랫폼.
              </p>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 text-sm font-medium hover:gap-3 transition-all">
                강의 둘러보기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </FadeInSection>
        </section>

        {/* Instructors Section */}
        <section className="w-full max-w-[1024px] px-6 py-8">
          <FadeInSection delay={100}>
            <FeaturedInstructors />
          </FadeInSection>
        </section>

        {/* Courses Section */}
        <section className="w-full max-w-[1024px] px-6 py-8">
          <FadeInSection delay={100}>
            <FeaturedCourses />
          </FadeInSection>
        </section>

        {/* Community Section */}
        <section className="w-full max-w-[1024px] px-6 py-16">
          <FadeInSection delay={100}>
            <div className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-heading tracking-wide">COMMUNITY</h2>
              <p className="text-[13px] text-muted-foreground max-w-[500px]">
                전국의 주짓수 수련자들과 경험을 나누고, 함께 성장하세요.
              </p>
              <Link
                href="/community"
                className="inline-flex items-center gap-2 text-sm font-medium hover:gap-3 transition-all">
                커뮤니티 바로가기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </FadeInSection>
        </section>
      </main>

      <Footer />
    </>
  );
}
