import { useEffect, useState } from "react"
import { createClient } from "@/lib/client"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/lib/database"

export function useUser(initialUser: User | null = null, initialProfile: Profile | null = null) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [profile, setProfile] = useState<Profile | null>(initialProfile)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let isMounted = true
    const abortController = new AbortController()

    // 초기값이 없는 경우에만 세션을 가져옴
    const getInitialUser = async () => {
      if (initialUser !== null) {
        // SSR에서 이미 데이터를 받았으면 스킵
        console.log("[useUser] Using SSR initial data:", initialUser?.email)
        return
      }

      try {
        console.log("[useUser] No SSR data, loading session from client...")
        if (isMounted) setIsLoading(true)

        // 로컬 세션만 확인 (서버 요청 없음)
        const { data: { session }, error } = await supabase.auth.getSession()

        if (!isMounted) return

        if (error) {
          console.error("[useUser] Session error:", error)
          setUser(null)
          setProfile(null)
          setIsLoading(false)
          return
        }

        if (!session?.user) {
          console.log("[useUser] No session - user is logged out")
          setUser(null)
          setProfile(null)
          setIsLoading(false)
          return
        }

        // 세션이 있으면 user 정보 사용
        console.log("[useUser] Session found for user:", session.user.email)
        setUser(session.user)

        // 프로필 가져오기
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single<Profile>()

        if (!isMounted) return

        if (profileError) {
          console.warn("[useUser] Profile load error:", profileError)
        } else if (profileData) {
          console.log("[useUser] Profile loaded:", profileData.display_name)
          setProfile(profileData)
        }

        setIsLoading(false)
      } catch (error) {
        if (!isMounted) return
        // AbortError는 정상적인 cleanup이므로 무시
        if (error instanceof Error && error.name === "AbortError") {
          console.log("[useUser] Request aborted (component unmounted)")
          return
        }
        console.error("[useUser] Error loading initial user:", error)
        setUser(null)
        setProfile(null)
        setIsLoading(false)
      }
    }

    getInitialUser()

    // 인증 상태 변화 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      console.log("[useUser] Auth state changed:", event, session ? `(${session.user.email})` : "(no session)")

      if (event === "SIGNED_IN" && session?.user) {
        console.log("[useUser] User signed in:", session.user.email)
        setUser(session.user)

        // 프로필 가져오기
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single<Profile>()

        if (!isMounted) return

        if (profileData) {
          console.log("[useUser] Profile loaded on sign in:", profileData.display_name)
          setProfile(profileData)
        }
        setIsLoading(false)
      } else if (event === "SIGNED_OUT") {
        console.log("[useUser] User signed out, clearing state")
        setUser(null)
        setProfile(null)
        setIsLoading(false)
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        console.log("[useUser] Token refreshed for:", session.user.email)
        setUser(session.user)
      }
    })

    return () => {
      isMounted = false
      abortController.abort()
      subscription.unsubscribe()
    }
  }, [initialUser, initialProfile])

  return { user, profile, isLoading }
}
