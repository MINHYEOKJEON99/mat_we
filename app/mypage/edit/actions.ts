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

  // PT 관련 필드 (강사 전용)
  const ptPricePerHour = formData.get("ptPricePerHour") as string | null
  const ptDescription = formData.get("ptDescription") as string | null

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

  // 프로필 업데이트 데이터 준비
  const updateData: Record<string, unknown> = {
    display_name: displayName,
    bio: bio || null,
    avatar_url: avatarUrl,
    updated_at: new Date().toISOString(),
  }

  // PT 필드는 강사만 업데이트 가능 (클라이언트에서 값이 오면 포함)
  if (ptPricePerHour !== null) {
    updateData.pt_price_per_hour = ptPricePerHour ? parseInt(ptPricePerHour, 10) : null
  }
  if (ptDescription !== null) {
    updateData.pt_description = ptDescription || null
  }

  // 프로필 업데이트
  const { error: updateError } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", user.id)

  if (updateError) {
    console.error("Profile update error:", updateError)
    return { error: "프로필 업데이트에 실패했습니다" }
  }

  revalidatePath("/mypage")
  revalidatePath("/mypage/edit")

  return { success: true }
}
