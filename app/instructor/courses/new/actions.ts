"use server"

import { createClient } from "@/lib/server"

export async function uploadCourseImage(
  formData: FormData
): Promise<{ url: string; path: string } | { error: string }> {
  try {
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string

    if (!file || !userId) {
      return { error: "파일 또는 사용자 ID가 없습니다" }
    }

    const supabase = await createClient()

    // Generate unique filename
    const fileExt = file.name.split(".").pop() || "jpg"
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    console.log("[Server] Uploading file:", fileName, file.size, file.type)

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from("community-media")
      .upload(fileName, file, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      })

    if (error) {
      console.error("[Server] Upload error:", error)
      return { error: `업로드 실패: ${error.message}` }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("community-media")
      .getPublicUrl(data.path)

    console.log("[Server] Upload successful:", urlData.publicUrl)

    return {
      url: urlData.publicUrl,
      path: data.path,
    }
  } catch (error) {
    console.error("[Server] Upload exception:", error)
    return {
      error: error instanceof Error ? error.message : "업로드 중 오류가 발생했습니다",
    }
  }
}
