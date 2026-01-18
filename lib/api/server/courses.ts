import { createClient } from "@/lib/server"
import type { Course, CourseVideo, Category } from "@/lib/database"

export type CourseWithInstructor = Course & {
  instructor: {
    id: string
    display_name: string
    avatar_url?: string | null
    bio?: string | null
  } | null
}

export type CourseWithDetails = CourseWithInstructor & {
  categories?: Category[]
}

/**
 * Get all courses with instructor info and categories
 */
export async function getAllCourses(): Promise<CourseWithDetails[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("courses")
    .select(`
      *,
      instructor:profiles!courses_instructor_id_fkey (
        id, display_name, avatar_url
      ),
      course_categories (
        category:categories (*)
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[Courses] Error fetching courses:", error)
    return []
  }

  // Transform the data to flatten categories
  return (data || []).map(course => ({
    ...course,
    categories: course.course_categories
      ?.map((cc: { category: Category | null }) => cc.category)
      .filter(Boolean) as Category[] || []
  })) as CourseWithDetails[]
}

/**
 * Get course by ID with instructor info and categories
 */
export async function getCourseById(courseId: string): Promise<CourseWithDetails | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("courses")
    .select(`
      *,
      instructor:profiles!courses_instructor_id_fkey (
        id, display_name, avatar_url, bio
      ),
      course_categories (
        category:categories (*)
      )
    `)
    .eq("id", courseId)
    .single()

  if (error) {
    console.error("[Courses] Error fetching course:", error)
    return null
  }

  // Transform the data to flatten categories
  return {
    ...data,
    categories: data.course_categories
      ?.map((cc: { category: Category | null }) => cc.category)
      .filter(Boolean) as Category[] || []
  } as CourseWithDetails
}

/**
 * Get courses by instructor ID
 */
export async function getCoursesByInstructor(instructorId: string): Promise<Course[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("instructor_id", instructorId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[Courses] Error fetching instructor courses:", error)
    return []
  }

  return data as Course[]
}

/**
 * Get course videos by course ID
 */
export async function getCourseVideos(courseId: string): Promise<CourseVideo[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("course_videos")
    .select("*")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true })

  if (error) {
    console.error("[Courses] Error fetching course videos:", error)
    return []
  }

  return data as CourseVideo[]
}
