import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { EditCourseForm } from "@/components/course/edit-course-form"
import { requireAuth, getCourseById } from "@/lib/api/server"

export default async function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params

  const user = await requireAuth()

  const courseData = await getCourseById(courseId)

  if (!courseData || courseData.instructor_id !== user.id) {
    notFound()
  }

  // Extract only the course data without instructor info for EditCourseForm
  const course = {
    id: courseData.id,
    title: courseData.title,
    description: courseData.description,
    thumbnail_url: courseData.thumbnail_url,
    price: courseData.price,
    level: courseData.level,
    instructor_id: courseData.instructor_id,
    created_at: courseData.created_at,
    updated_at: courseData.updated_at,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-2xl font-bold">
            Mat We
          </Link>
          <div className="flex gap-2">
            <Button asChild variant="ghost">
              <Link href="/instructor/courses">← 내 강의</Link>
            </Button>
            <Button asChild>
              <Link href={`/instructor/courses/${courseId}/videos`}>영상 관리</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>강의 수정</CardTitle>
            <CardDescription>강의 정보를 수정하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <EditCourseForm course={course} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
