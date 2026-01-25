import { notFound } from "next/navigation"
import { EditCourseForm } from "@/components/course/edit-course-form"
import { requireAuth, getCourseById, getAllCategories } from "@/lib/api/server"
import { createClient } from "@/lib/server"

export default async function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params

  const user = await requireAuth()
  const supabase = await createClient()

  // Get course with categories
  const { data: courseData } = await supabase
    .from("courses")
    .select(`
      *,
      categories:course_categories(
        id,
        category_id,
        category:categories(*)
      )
    `)
    .eq("id", courseId)
    .single()

  if (!courseData || courseData.instructor_id !== user.id) {
    notFound()
  }

  // Flatten categories
  const course = {
    ...courseData,
    categories: courseData.categories?.map((cc: any) => cc.category) || [],
  }

  // Get course videos
  const { data: videos } = await supabase
    .from("course_videos")
    .select("*")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true })

  // Get all categories for selection
  const categories = await getAllCategories()

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">강의 수정</h1>
          <p className="text-muted-foreground">강의 정보와 영상을 수정하세요</p>
        </div>
        <EditCourseForm
          course={course}
          initialVideos={videos || []}
          categories={categories}
        />
      </main>
    </div>
  )
}
