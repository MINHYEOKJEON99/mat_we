import { createClient } from "@/lib/server"
import type { Enrollment } from "@/lib/database"
import type { CourseWithInstructor } from "./courses"

export type EnrollmentWithCourse = Enrollment & {
  course: CourseWithInstructor
}

/**
 * Get enrollments by student ID
 */
export async function getEnrollmentsByStudent(studentId: string): Promise<EnrollmentWithCourse[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
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
    .eq("student_id", studentId)
    .order("enrolled_at", { ascending: false })

  if (error) {
    console.error("[Enrollments] Error fetching enrollments:", error)
    return []
  }

  return data as EnrollmentWithCourse[]
}

/**
 * Check if user is enrolled in a course
 */
export async function isEnrolledInCourse(
  studentId: string,
  courseId: string
): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("enrollments")
    .select("id")
    .eq("student_id", studentId)
    .eq("course_id", courseId)
    .single()

  return !error && !!data
}

/**
 * Get enrolled course IDs for a student
 */
export async function getEnrolledCourseIds(studentId: string): Promise<string[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("student_id", studentId)

  if (error) {
    console.error("[Enrollments] Error fetching course IDs:", error)
    return []
  }

  return data?.map(e => e.course_id) || []
}
