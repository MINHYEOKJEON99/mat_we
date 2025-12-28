import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/client"
import type { User } from "@supabase/supabase-js"

export const authKeys = {
  user: ["auth", "user"] as const,
}

// 현재 로그인한 사용자
export function useCurrentUser() {
  const supabase = createClient()

  return useQuery({
    queryKey: authKeys.user,
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return user
    },
    staleTime: 5 * 60 * 1000, // 5분
  })
}

// 로그아웃 후 캐시 초기화
export function useLogout() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return async () => {
    await supabase.auth.signOut()
    queryClient.clear() // 모든 캐시 초기화
  }
}
