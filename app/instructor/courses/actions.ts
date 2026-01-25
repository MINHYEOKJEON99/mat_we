"use server"

import { createClient } from "@/lib/server"
import { revalidatePath } from "next/cache"

/**
 * 강의 삭제 (Server Action)
 * - 강의와 관련된 모든 데이터 삭제
 * - Storage에서 파일 삭제
 */
export async function deleteCourseAction(courseId: string): Promise<{ success: boolean } | { error: string }> {
  try {
    console.log("[Server] Deleting course:", courseId)

    const supabase = await createClient()

    // 1. 권한 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: "인증되지 않은 사용자입니다" }
    }

    const { data: course } = await supabase
      .from("courses")
      .select("instructor_id, thumbnail_url")
      .eq("id", courseId)
      .single()

    if (!course) {
      return { error: "강의를 찾을 수 없습니다" }
    }

    if (course.instructor_id !== user.id) {
      return { error: "이 강의를 삭제할 권한이 없습니다" }
    }

    // 2. 영상 파일 목록 가져오기
    const { data: videos } = await supabase
      .from("course_videos")
      .select("video_url")
      .eq("course_id", courseId)

    // 3. Storage에서 파일 삭제
    const filesToDelete: string[] = []

    // 썸네일 파일 경로 추출
    if (course.thumbnail_url) {
      const thumbnailPath = extractStoragePath(course.thumbnail_url)
      if (thumbnailPath) {
        filesToDelete.push(thumbnailPath)
      }
    }

    // 영상 파일 경로 추출
    if (videos) {
      for (const video of videos) {
        if (video.video_url) {
          const videoPath = extractStoragePath(video.video_url)
          if (videoPath) {
            filesToDelete.push(videoPath)
          }
        }
      }
    }

    // Storage에서 파일 삭제
    if (filesToDelete.length > 0) {
      console.log("[Server] Deleting files from storage:", filesToDelete.length)
      const { error: storageError } = await supabase.storage
        .from("community-media")
        .remove(filesToDelete)

      if (storageError) {
        console.error("[Server] Storage deletion error:", storageError)
        // Storage 삭제 실패는 경고만 하고 계속 진행
      } else {
        console.log("[Server] Files deleted successfully")
      }
    }

    // 4. DB에서 강의 삭제 (CASCADE로 관련 데이터 자동 삭제 예상)
    console.log("[Server] Deleting course from database...")
    const { error: deleteError } = await supabase
      .from("courses")
      .delete()
      .eq("id", courseId)

    if (deleteError) {
      console.error("[Server] Course deletion error:", deleteError)
      return { error: `강의 삭제 실패: ${deleteError.message}` }
    }

    console.log("[Server] ✅ Course deleted successfully")

    // 5. 캐시 무효화
    revalidatePath("/instructor/courses")
    revalidatePath("/courses")

    return { success: true }
  } catch (error) {
    console.error("[Server] Exception during course deletion:", error)
    return {
      error: error instanceof Error ? error.message : "강의 삭제 중 오류가 발생했습니다",
    }
  }
}

/**
 * Supabase Storage URL에서 파일 경로 추출
 */
function extractStoragePath(url: string): string | null {
  try {
    // URL 형식: https://fmgrhtlvoyszgpiswhdw.supabase.co/storage/v1/object/public/community-media/path/to/file.jpg
    const match = url.match(/\/storage\/v1\/object\/public\/community-media\/(.+)$/)
    if (match && match[1]) {
      return match[1]
    }
    return null
  } catch {
    return null
  }
}

/**
 * Presigned URL 생성 - 강의 수정 시 파일 업로드
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

/**
 * 강의 정보 업데이트
 */
export async function updateCourseAction(
  courseId: string,
  updates: {
    title?: string
    description?: string | null
    price?: number
    level?: string
    thumbnail_url?: string | null
  },
  categories?: {
    level1CategoryId?: string
    level2CategoryId?: string
  }
): Promise<{ success: boolean } | { error: string }> {
  try {
    console.log("[Server] Updating course:", courseId)

    const supabase = await createClient()

    // 권한 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: "인증되지 않은 사용자입니다" }
    }

    const { data: course } = await supabase
      .from("courses")
      .select("instructor_id")
      .eq("id", courseId)
      .single()

    if (!course) {
      return { error: "강의를 찾을 수 없습니다" }
    }

    if (course.instructor_id !== user.id) {
      return { error: "이 강의를 수정할 권한이 없습니다" }
    }

    // 강의 정보 업데이트
    const { error: updateError } = await supabase
      .from("courses")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", courseId)

    if (updateError) {
      console.error("[Server] Course update error:", updateError)
      return { error: `강의 수정 실패: ${updateError.message}` }
    }

    // 카테고리 업데이트 (있을 경우)
    if (categories) {
      // 기존 카테고리 삭제
      await supabase
        .from("course_categories")
        .delete()
        .eq("course_id", courseId)

      // 새 카테고리 추가
      const categoriesToAdd: string[] = []
      if (categories.level1CategoryId) categoriesToAdd.push(categories.level1CategoryId)
      if (categories.level2CategoryId) categoriesToAdd.push(categories.level2CategoryId)

      for (const categoryId of categoriesToAdd) {
        const { error: catError } = await supabase
          .from("course_categories")
          .insert({
            course_id: courseId,
            category_id: categoryId,
          })

        if (catError) {
          console.error("[Server] Category assignment error:", catError)
        }
      }
    }

    console.log("[Server] ✅ Course updated successfully")
    revalidatePath(`/instructor/courses/${courseId}`)
    revalidatePath("/instructor/courses")

    return { success: true }
  } catch (error) {
    console.error("[Server] Exception during course update:", error)
    return {
      error: error instanceof Error ? error.message : "강의 수정 중 오류가 발생했습니다",
    }
  }
}

/**
 * 영상 추가
 */
export async function createCourseVideoAction(
  courseId: string,
  videoData: {
    title: string
    description: string | null
    video_url: string
    duration: number
    order_index: number
  }
): Promise<{ success: boolean; id: string } | { error: string }> {
  try {
    console.log("[Server] Creating video record:", videoData.title)

    const supabase = await createClient()

    // 권한 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: "인증되지 않은 사용자입니다" }
    }

    const { data: course } = await supabase
      .from("courses")
      .select("instructor_id")
      .eq("id", courseId)
      .single()

    if (!course) {
      return { error: "강의를 찾을 수 없습니다" }
    }

    if (course.instructor_id !== user.id) {
      return { error: "이 강의에 영상을 추가할 권한이 없습니다" }
    }

    const { data, error } = await supabase
      .from("course_videos")
      .insert({
        course_id: courseId,
        ...videoData,
      })
      .select()
      .single()

    if (error) {
      console.error("[Server] Video record creation error:", error)
      return { error: `영상 레코드 생성 실패: ${error.message}` }
    }

    console.log("[Server] ✅ Video record created")
    revalidatePath(`/instructor/courses/${courseId}`)

    return { success: true, id: data.id }
  } catch (error) {
    console.error("[Server] Video record creation exception:", error)
    return {
      error: error instanceof Error ? error.message : "영상 레코드 생성 중 오류가 발생했습니다",
    }
  }
}

/**
 * 영상 정보 업데이트
 */
export async function updateCourseVideoAction(
  videoId: string,
  updates: {
    title?: string
    description?: string | null
    order_index?: number
  }
): Promise<{ success: boolean } | { error: string }> {
  try {
    console.log("[Server] Updating video:", videoId)

    const supabase = await createClient()

    // 권한 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: "인증되지 않은 사용자입니다" }
    }

    const { data: video } = await supabase
      .from("course_videos")
      .select("course_id, courses(instructor_id)")
      .eq("id", videoId)
      .single()

    if (!video) {
      return { error: "영상을 찾을 수 없습니다" }
    }

    const course = video.courses as any
    if (course.instructor_id !== user.id) {
      return { error: "이 영상을 수정할 권한이 없습니다" }
    }

    const { error } = await supabase
      .from("course_videos")
      .update(updates)
      .eq("id", videoId)

    if (error) {
      console.error("[Server] Video update error:", error)
      return { error: `영상 수정 실패: ${error.message}` }
    }

    console.log("[Server] ✅ Video updated successfully")
    revalidatePath(`/instructor/courses/${video.course_id}`)

    return { success: true }
  } catch (error) {
    console.error("[Server] Exception during video update:", error)
    return {
      error: error instanceof Error ? error.message : "영상 수정 중 오류가 발생했습니다",
    }
  }
}

/**
 * 영상 삭제
 */
export async function deleteCourseVideoAction(videoId: string): Promise<{ success: boolean } | { error: string }> {
  try {
    console.log("[Server] Deleting video:", videoId)

    const supabase = await createClient()

    // 권한 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: "인증되지 않은 사용자입니다" }
    }

    const { data: video } = await supabase
      .from("course_videos")
      .select("course_id, video_url, courses(instructor_id)")
      .eq("id", videoId)
      .single()

    if (!video) {
      return { error: "영상을 찾을 수 없습니다" }
    }

    const course = video.courses as any
    if (course.instructor_id !== user.id) {
      return { error: "이 영상을 삭제할 권한이 없습니다" }
    }

    // Storage에서 파일 삭제
    if (video.video_url) {
      const videoPath = extractStoragePath(video.video_url)
      if (videoPath) {
        const { error: storageError } = await supabase.storage
          .from("community-media")
          .remove([videoPath])

        if (storageError) {
          console.error("[Server] Storage deletion error:", storageError)
          // Storage 삭제 실패는 경고만 하고 계속 진행
        }
      }
    }

    // DB에서 영상 삭제
    const { error: deleteError } = await supabase
      .from("course_videos")
      .delete()
      .eq("id", videoId)

    if (deleteError) {
      console.error("[Server] Video deletion error:", deleteError)
      return { error: `영상 삭제 실패: ${deleteError.message}` }
    }

    console.log("[Server] ✅ Video deleted successfully")
    revalidatePath(`/instructor/courses/${video.course_id}`)

    return { success: true }
  } catch (error) {
    console.error("[Server] Exception during video deletion:", error)
    return {
      error: error instanceof Error ? error.message : "영상 삭제 중 오류가 발생했습니다",
    }
  }
}
