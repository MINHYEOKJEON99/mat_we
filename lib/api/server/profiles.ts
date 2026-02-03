import { createClient } from "@/lib/server"
import type { Profile } from "@/lib/database"
import { getCurrentUser, requireAuth } from "./auth"

/**
 * Get profile by user ID
 */
export async function getProfileById(userId: string): Promise<Profile | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single<Profile>()

  if (error) {
    console.error("[Profiles] Error fetching profile:", error)
    return null
  }

  return data
}

/**
 * Get current user's profile
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser()

  if (!user) return null

  return getProfileById(user.id)
}

/**
 * Require current user's profile - redirects if not found
 */
export async function requireCurrentProfile(): Promise<Profile> {
  const user = await requireAuth()
  const profile = await getProfileById(user.id)

  if (!profile) {
    throw new Error("Profile not found")
  }

  return profile
}

/**
 * Check if profile is complete
 */
export async function isProfileComplete(userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("is_profile_complete")
    .eq("id", userId)
    .single()

  if (error || !data) return false

  return data.is_profile_complete
}

/**
 * Get instructor profile with basic info (for instructor pages)
 */
export async function getInstructorProfile(instructorId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, bio, pt_price_per_hour, pt_description")
    .eq("id", instructorId)
    .eq("role", "instructor")
    .single()

  if (error) {
    console.error("[Profiles] Error fetching instructor:", error)
    return null
  }

  return data
}

/**
 * Get all instructors
 */
export async function getAllInstructors() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, bio, pt_price_per_hour, pt_description")
    .eq("role", "instructor")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[Profiles] Error fetching instructors:", error)
    return []
  }

  return data
}
