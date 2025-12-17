import { createClient } from "@/lib/server"
import { redirect, notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { EditCourseForm } from "@/components/edit-course-form"

export default async function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .eq("instructor_id", user.id)
    .single()

  if (!course) {
    notFound()
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
