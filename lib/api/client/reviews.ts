import { createClient } from "@/lib/client"
import type { CourseReview } from "@/lib/database"

/**
 * Create a new review (client-side)
 */
export async function createReview(data: {
  course_id: string
  student_id: string
  rating: number
  content?: string
}): Promise<CourseReview> {
  const supabase = createClient()

  const { data: review, error } = await supabase
    .from("course_reviews")
    .insert({
      course_id: data.course_id,
      student_id: data.student_id,
      rating: data.rating,
      content: data.content || null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`리뷰 작성에 실패했습니다: ${error.message}`)
  }

  return review as CourseReview
}

/**
 * Update a review (client-side)
 */
export async function updateReview(
  reviewId: string,
  data: {
    rating?: number
    content?: string
  }
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from("course_reviews")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId)

  if (error) {
    throw new Error(`리뷰 수정에 실패했습니다: ${error.message}`)
  }
}

/**
 * Delete a review (client-side)
 */
export async function deleteReview(reviewId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from("course_reviews")
    .delete()
    .eq("id", reviewId)

  if (error) {
    throw new Error(`리뷰 삭제에 실패했습니다: ${error.message}`)
  }
}
