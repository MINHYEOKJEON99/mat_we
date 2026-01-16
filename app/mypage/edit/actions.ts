"use server"

import { createClient } from "@/lib/server"
import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/api/server"

export async function updateProfile(formData: FormData) {
  // Use centralized auth API
  const user = await requireAuth()

  const supabase = await createClient()

  const displayName = formData.get("displayName") as string
  const bio = formData.get("bio") as string
  const avatarFile = formData.get("avatar") as File | null

  let avatarUrl: string | null = formData.get("currentAvatarUrl") as string | null

  // 아바타 업로드
  if (avatarFile && avatarFile.size > 0) {
    const fileExt = avatarFile.name.split(".").pop()
    const fileName = `${user.id}/avatar.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, avatarFile, { upsert: true })

    if (uploadError) {
      console.error("Avatar upload error:", uploadError)
      return { error: "아바타 업로드에 실패했습니다" }
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName)

    avatarUrl = urlData.publicUrl
  }

  // 프로필 업데이트
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      bio: bio || null,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (updateError) {
    console.error("Profile update error:", updateError)
    return { error: "프로필 업데이트에 실패했습니다" }
  }

  revalidatePath("/mypage")
  revalidatePath("/mypage/edit")

  return { success: true }
}
