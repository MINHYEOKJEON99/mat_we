import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, Plus, Settings, Users } from "lucide-react"
import type { Course } from "@/lib/database"

const LEVEL_LABELS = {
  beginner: "입문",
  intermediate: "중급",
  advanced: "고급",
}

export default async function UploadedCoursesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // 프로필 정보 가져오기 (역할 확인)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  // 올린 강의 가져오기
  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .eq("instructor_id", user.id)
    .order("created_at", { ascending: false })

  // 각 강의별 수강생 수 가져오기
  const coursesWithEnrollmentCount = await Promise.all(
    (courses || []).map(async (course: Course) => {
      const { count } = await supabase
        .from("enrollments")
        .select("*", { count: "exact", head: true })
        .eq("course_id", course.id)
      return { ...course, enrollment_count: count || 0 }
    })
  )

  // 강사가 아닌 경우
  if (profile?.role !== "instructor") {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">올린 강의</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">강사만 강의를 업로드할 수 있습니다</p>
            <p className="text-sm text-muted-foreground">
              강사로 전환하려면 프로필 설정에서 역할을 변경해주세요
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">올린 강의</h1>
        <Button asChild>
          <Link href="/instructor/courses/new">
            <Plus className="h-4 w-4 mr-2" />
            새 강의 만들기
          </Link>
        </Button>
      </div>

      {coursesWithEnrollmentCount && coursesWithEnrollmentCount.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {coursesWithEnrollmentCount.map((course) => (
            <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <Link href={`/instructor/courses/${course.id}`}>
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
                      <Upload className="h-12 w-12 text-muted-foreground" />
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
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      수강생 {course.enrollment_count}명
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    생성일: {new Date(course.created_at).toLocaleDateString("ko-KR")}
                  </p>
                </CardContent>
              </Link>
              <div className="px-4 pb-4">
                <Button asChild variant="outline" className="w-full" size="sm">
                  <Link href={`/instructor/courses/${course.id}`}>
                    <Settings className="h-4 w-4 mr-2" />
                    강의 관리
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">아직 업로드한 강의가 없습니다</p>
            <Button asChild>
              <Link href="/instructor/courses/new">첫 강의 만들기</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
