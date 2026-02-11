import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { requireAuth, getEnrollmentsByStudent } from "@/lib/api/server"

export default async function StudentCoursesPage() {
  const user = await requireAuth()

  // Get enrolled courses
  const enrollments = await getEnrollmentsByStudent(user.id)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-2xl font-bold">
            Mat We
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost">대시보드</Button>
            </Link>
            <Link href="/courses">
              <Button variant="ghost">강의 둘러보기</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">내 강의</h1>
          <p className="text-muted-foreground">수강 중인 강의를 확인하세요</p>
        </div>

        {!enrollments || enrollments.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>수강 중인 강의가 없습니다</CardTitle>
              <CardDescription>강의를 둘러보고 학습을 시작하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/courses">강의 둘러보기</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((enrollment) => {
              const course = enrollment.course
              if (!course) return null
              return (
                <Card key={enrollment.id} className="flex flex-col">
                  <CardHeader>
                    {course.thumbnail_url && (
                      <div className="relative w-full h-48 mb-4">
                        <Image
                          src={course.thumbnail_url}
                          alt={course.title}
                          fill
                          className="object-cover rounded-lg"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>
                    )}
                    <CardTitle className="line-clamp-1">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col gap-2">
                    <div className="text-sm text-muted-foreground">
                      <p>강사: {course.instructor?.display_name}</p>
                      <p>
                        수강 시작:{" "}
                        {new Date(enrollment.enrolled_at).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <Button asChild className="w-full mt-auto">
                      <Link href={`/student/courses/${course.id}`}>학습 계속하기</Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
