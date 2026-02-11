import { createClient } from "@/lib/server"
import type { CourseReview, Profile } from "@/lib/database"

export type ReviewWithStudent = CourseReview & {
  student: Pick<Profile, "id" | "display_name" | "avatar_url"> | null
}

/**
 * Get reviews for a course
 */
export async function getCourseReviews(courseId: string): Promise<ReviewWithStudent[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("course_reviews")
    .select(`
      *,
      student:profiles!course_reviews_student_id_fkey (
        id, display_name, avatar_url
      )
    `)
    .eq("course_id", courseId)
    .eq("is_visible", true)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[Reviews] Error fetching course reviews:", error)
    return []
  }

  return data as ReviewWithStudent[]
}

/**
 * Get review by student for a course
 */
export async function getStudentReview(courseId: string, studentId: string): Promise<CourseReview | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("course_reviews")
    .select("*")
    .eq("course_id", courseId)
    .eq("student_id", studentId)
    .single()

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("[Reviews] Error fetching student review:", error)
    }
    return null
  }

  return data as CourseReview
}

/**
 * Get all reviews by a student
 */
export async function getReviewsByStudent(studentId: string): Promise<CourseReview[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("course_reviews")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[Reviews] Error fetching student reviews:", error)
    return []
  }

  return data as CourseReview[]
}

/**
 * Get course rating stats
 */
export async function getCourseRatingStats(courseId: string): Promise<{
  averageRating: number
  reviewCount: number
  ratingDistribution: Record<number, number>
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("course_reviews")
    .select("rating")
    .eq("course_id", courseId)
    .eq("is_visible", true)

  if (error) {
    console.error("[Reviews] Error fetching rating stats:", error)
    return {
      averageRating: 0,
      reviewCount: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    }
  }

  const ratings = data?.map(r => r.rating) || []
  const reviewCount = ratings.length
  const averageRating = reviewCount > 0
    ? Math.round((ratings.reduce((a, b) => a + b, 0) / reviewCount) * 10) / 10
    : 0

  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  ratings.forEach(r => {
    ratingDistribution[r] = (ratingDistribution[r] || 0) + 1
  })

  return { averageRating, reviewCount, ratingDistribution }
}
