import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/client"
import type { Profile } from "@/lib/database"

export const profileKeys = {
  all: ["profiles"] as const,
  detail: (id: string) => [...profileKeys.all, id] as const,
  current: () => [...profileKeys.all, "current"] as const,
}

// 현재 로그인한 사용자의 프로필 가져오기
export function useCurrentProfile() {
  const supabase = createClient()

  return useQuery({
    queryKey: profileKeys.current(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single<Profile>()

      if (error) throw error
      return data
    },
  })
}

// 특정 사용자의 프로필 가져오기
export function useProfile(userId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: profileKeys.detail(userId || ""),
    queryFn: async () => {
      if (!userId) return null

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single<Profile>()

      if (error) throw error
      return data
    },
    enabled: !!userId,
  })
}

// 프로필 업데이트
export function useUpdateProfile() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<Profile> & { id: string }) => {
      const { id, ...updateData } = data
      const { data: result, error } = await supabase
        .from("profiles")
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single<Profile>()

      if (error) throw error
      return result
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.current() })
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(data.id) })
    },
  })
}

// 아바타 업로드
export function useUploadAvatar() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, file }: { userId: string; file: File }) => {
      const fileExt = file.name.split(".").pop()
      const fileName = `${userId}/avatar.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName)

      // 프로필에 아바타 URL 업데이트
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("id", userId)

      if (updateError) throw updateError

      return publicUrl
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.current() })
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(variables.userId) })
    },
  })
}
