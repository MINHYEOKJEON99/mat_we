import { createClient } from "@/lib/server"
import type { Course, CourseVideo } from "@/lib/database"

export type CourseWithInstructor = Course & {
  instructor: {
    id: string
    display_name: string
    avatar_url?: string | null
    bio?: string | null
  } | null
}

/**
 * Get all courses with instructor info
 */
export async function getAllCourses(): Promise<CourseWithInstructor[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("courses")
    .select(`
      *,
      instructor:profiles!courses_instructor_id_fkey (
        id, display_name, avatar_url
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[Courses] Error fetching courses:", error)
    return []
  }

  return data as CourseWithInstructor[]
}

/**
 * Get course by ID with instructor info
 */
export async function getCourseById(courseId: string): Promise<CourseWithInstructor | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("courses")
    .select(`
      *,
      instructor:profiles!courses_instructor_id_fkey (
        id, display_name, avatar_url, bio
      )
    `)
    .eq("id", courseId)
    .single()

  if (error) {
    console.error("[Courses] Error fetching course:", error)
    return null
  }

  return data as CourseWithInstructor
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
