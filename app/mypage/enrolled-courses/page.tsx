import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Play } from "lucide-react"

const LEVEL_LABELS = {
  beginner: "입문",
  intermediate: "중급",
  advanced: "고급",
}

export default async function EnrolledCoursesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // 수강 중인 강의 가져오기
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      id,
      enrolled_at,
      course:courses (
        id,
        title,
        description,
        thumbnail_url,
        level,
        instructor:profiles!courses_instructor_id_fkey (
          display_name
        )
      )
    `)
    .eq("student_id", user.id)
    .order("enrolled_at", { ascending: false })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">수강한 강의</h1>
        <Button asChild variant="outline">
          <Link href="/courses">
            <BookOpen className="h-4 w-4 mr-2" />
            강의 둘러보기
          </Link>
        </Button>
      </div>

      {enrollments && enrollments.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {enrollments.map((enrollment: any) => {
            const course = enrollment.course
            if (!course) return null

            return (
              <Card key={enrollment.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <Link href={`/courses/${course.id}`}>
                  <div className="aspect-video relative bg-muted">
                    {course.thumbnail_url ? (
                      <Image
                        src={course.thumbnail_url}
                        alt={course.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <BookOpen className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      {course.level && (
                        <Badge variant="secondary" className="text-xs">
                          {LEVEL_LABELS[course.level as keyof typeof LEVEL_LABELS] || course.level}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold line-clamp-2">{course.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {course.instructor?.display_name || "강사"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      수강 시작: {new Date(enrollment.enrolled_at).toLocaleDateString("ko-KR")}
                    </p>
                  </CardContent>
                </Link>
                <div className="px-4 pb-4">
                  <Button asChild className="w-full" size="sm">
                    <Link href={`/courses/${course.id}`}>
                      <Play className="h-4 w-4 mr-2" />
                      이어서 학습하기
                    </Link>
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">아직 수강 중인 강의가 없습니다</p>
            <Button asChild>
              <Link href="/courses">강의 둘러보기</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
