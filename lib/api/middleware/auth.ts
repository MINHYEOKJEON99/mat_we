import { createServerClient } from "@supabase/ssr"
import type { NextRequest } from "next/server"

/**
 * Get user from middleware context
 */
export async function getMiddlewareUser(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  return { user, supabase, error }
}

/**
 * Check if user profile is complete
 */
export async function isMiddlewareProfileComplete(
  supabase: any,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("is_profile_complete")
    .eq("id", userId)
    .single()

  if (error || !data) return false

  return data.is_profile_complete
}
