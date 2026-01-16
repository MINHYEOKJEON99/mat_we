import { createClient } from "@/lib/client"

/**
 * Update a course (client-side)
 */
export async function updateCourse(
  courseId: string,
  data: Partial<{
    title: string
    description: string
    thumbnail_url: string
    price: number
    level: string
  }>
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from("courses")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", courseId)

  if (error) {
    throw new Error(`Failed to update course: ${error.message}`)
  }
}

/**
 * Delete a course (client-side)
 */
export async function deleteCourse(courseId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from("courses")
    .delete()
    .eq("id", courseId)

  if (error) {
    throw new Error(`Failed to delete course: ${error.message}`)
  }
}

/**
 * Add a video to a course (client-side)
 */
export async function addCourseVideo(data: {
  course_id: string
  title: string
  description: string | null
  mux_playback_id: string | null
  mux_asset_id: string | null
  duration: number | null
  order_index: number
}): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from("course_videos")
    .insert(data)

  if (error) {
    throw new Error(`Failed to add video: ${error.message}`)
  }
}

/**
 * Get next order index for course videos
 */
export async function getNextVideoOrderIndex(courseId: string): Promise<number> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("course_videos")
    .select("order_index")
    .eq("course_id", courseId)
    .order("order_index", { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return 0
  }

  return (data.order_index || 0) + 1
}
