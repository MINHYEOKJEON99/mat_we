import { createClient } from "@/lib/server"
import { redirect } from "next/navigation"
import type { User } from "@supabase/supabase-js"

/**
 * Get the current authenticated user (returns null if not authenticated)
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    console.error("[Auth] Error getting user:", error)
    return null
  }

  return user
}

/**
 * Require authentication - redirects to login if not authenticated
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  return user
}

/**
 * Get current user with optional redirect URL
 */
export async function getCurrentUserOrRedirect(redirectTo?: string): Promise<User> {
  const user = await getCurrentUser()

  if (!user) {
    const url = redirectTo
      ? `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`
      : "/auth/login"
    redirect(url)
  }

  return user
}
