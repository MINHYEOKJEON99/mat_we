"use server"

import { createClient } from "@/lib/server"

interface CourseData {
  instructor_id: string
  title: string
  description?: string | null
  price: number
  level: string
  thumbnail_url?: string | null
}

interface CategoryData {
  level1CategoryId?: string
  level2CategoryId?: string
}

/**
 * Presigned URL 생성 - 클라이언트가 Supabase Storage에 직접 업로드
 */
export async function createUploadUrl(
  fileName: string,
  fileType: string,
  userId: string
): Promise<{ uploadUrl: string; path: string; publicUrl: string } | { error: string }> {
  try {
    const supabase = await createClient()

    // 파일 경로 생성
    const fileExt = fileName.split(".").pop() || "jpg"
    const uniqueFileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    console.log(`[Server] Creating upload URL for: ${uniqueFileName}`)

    // Presigned URL 생성 (5분간 유효)
    const { data, error } = await supabase.storage
      .from("community-media")
      .createSignedUploadUrl(uniqueFileName)

    if (error) {
      console.error("[Server] Failed to create upload URL:", error)
      return { error: `업로드 URL 생성 실패: ${error.message}` }
    }

    // Public URL 생성
    const { data: publicUrlData } = supabase.storage
      .from("community-media")
      .getPublicUrl(uniqueFileName)

    console.log(`[Server] ✅ Upload URL created: ${data.signedUrl.substring(0, 50)}...`)

    return {
      uploadUrl: data.signedUrl,
      path: uniqueFileName,
      publicUrl: publicUrlData.publicUrl,
    }
  } catch (error) {
    console.error("[Server] Exception creating upload URL:", error)
    return {
      error: error instanceof Error ? error.message : "업로드 URL 생성 중 오류가 발생했습니다",
    }
  }
}

export async function createCourse(
  courseData: CourseData,
  categories: CategoryData
): Promise<{ id: string } | { error: string }> {
  try {
    console.log("[Server] Creating course:", courseData.title)

    const supabase = await createClient()

    // Create course
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .insert(courseData)
      .select()
      .single()

    if (courseError) {
      console.error("[Server] Course creation error:", courseError)
      return { error: `강의 생성 실패: ${courseError.message}` }
    }

    console.log("[Server] Course created:", course.id)

    // Add categories if selected
    const categoriesToAdd: string[] = []
    if (categories.level1CategoryId) categoriesToAdd.push(categories.level1CategoryId)
    if (categories.level2CategoryId) categoriesToAdd.push(categories.level2CategoryId)

    for (const categoryId of categoriesToAdd) {
      const { error: catError } = await supabase
        .from("course_categories")
        .insert({
          course_id: course.id,
          category_id: categoryId,
        })

      if (catError) {
        console.error("[Server] Category assignment error:", catError)
      }
    }

    console.log("[Server] ✅ Course creation complete")

    return { id: course.id }
  } catch (error) {
    console.error("[Server] Course creation exception:", error)
    return {
      error: error instanceof Error ? error.message : "강의 생성 중 오류가 발생했습니다",
    }
  }
}

export async function createCourseVideo(
  courseId: string,
  videoData: {
    title: string
    description: string | null
    video_url: string
    duration: number
    order_index: number
  }
): Promise<{ success: boolean } | { error: string }> {
  try {
    console.log("[Server] Creating video record:", videoData.title)

    const supabase = await createClient()

    const { error } = await supabase
      .from("course_videos")
      .insert({
        course_id: courseId,
        ...videoData,
      })

    if (error) {
      console.error("[Server] Video record creation error:", error)
      return { error: `영상 레코드 생성 실패: ${error.message}` }
    }

    console.log("[Server] ✅ Video record created")
    return { success: true }
  } catch (error) {
    console.error("[Server] Video record creation exception:", error)
    return {
      error: error instanceof Error ? error.message : "영상 레코드 생성 중 오류가 발생했습니다",
    }
  }
}

