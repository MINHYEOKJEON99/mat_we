import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Play, Clock } from "lucide-react"
import { EnrolledCourseCard } from "./enrolled-course-card"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirectTo=/dashboard")
  }

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // Get enrollments with courses
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      *,
      course:courses (
        *,
        instructor:profiles!courses_instructor_id_fkey (
          id, display_name, avatar_url
        )
      )
    `)
    .eq("student_id", user.id)
    .order("enrolled_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            환영합니다{profile?.display_name ? `, ${profile.display_name}님` : ""}!
          </h1>
        </div>

        {/* PT 세션 Section - Placeholder */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">PT 세션</h2>
          </div>
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="py-12 text-center">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">예정된 PT 세션이 없습니다</p>
              <p className="text-sm text-muted-foreground">곧 PT 예약 기능이 추가됩니다</p>
            </CardContent>
          </Card>
        </section>

        {/* 수강중인 강의 Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Play className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">수강중인 강의</h2>
          </div>

          {/* Course Count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {enrollments?.length || 0}개의 강의
            </p>
          </div>

          {/* Course Grid */}
          {!enrollments || enrollments.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>수강 중인 강의가 없습니다</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">강의를 둘러보고 학습을 시작하세요</p>
                <Button asChild>
                  <Link href="/courses">강의 둘러보기</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {enrollments.map((enrollment: any) => {
                const course = enrollment.course
                if (!course) return null

                return (
                  <EnrolledCourseCard
                    key={enrollment.id}
                    enrollment={enrollment}
                    course={course}
                  />
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
