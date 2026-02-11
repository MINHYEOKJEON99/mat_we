import { createClient } from "@/lib/server"
import type { PTSession } from "@/lib/database"

export type PTSessionWithProfiles = PTSession & {
  instructor: {
    id: string
    display_name: string
    avatar_url: string | null
  }
  student: {
    id: string
    display_name: string
    avatar_url: string | null
  }
}

/**
 * Get PT sessions by instructor ID
 */
export async function getPTSessionsByInstructor(
  instructorId: string
): Promise<PTSessionWithProfiles[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("pt_sessions")
    .select(`
      *,
      instructor:profiles!pt_sessions_instructor_id_fkey (
        id, display_name, avatar_url
      ),
      student:profiles!pt_sessions_student_id_fkey (
        id, display_name, avatar_url
      )
    `)
    .eq("instructor_id", instructorId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[PT Sessions] Error fetching instructor sessions:", error)
    return []
  }

  return data as PTSessionWithProfiles[]
}

/**
 * Get PT sessions by student ID
 */
export async function getPTSessionsByStudent(
  studentId: string
): Promise<PTSessionWithProfiles[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("pt_sessions")
    .select(`
      *,
      instructor:profiles!pt_sessions_instructor_id_fkey (
        id, display_name, avatar_url
      ),
      student:profiles!pt_sessions_student_id_fkey (
        id, display_name, avatar_url
      )
    `)
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[PT Sessions] Error fetching student sessions:", error)
    return []
  }

  return data as PTSessionWithProfiles[]
}

/**
 * Get PT session by ID
 */
export async function getPTSessionById(
  sessionId: string
): Promise<PTSessionWithProfiles | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("pt_sessions")
    .select(`
      *,
      instructor:profiles!pt_sessions_instructor_id_fkey (
        id, display_name, avatar_url
      ),
      student:profiles!pt_sessions_student_id_fkey (
        id, display_name, avatar_url
      )
    `)
    .eq("id", sessionId)
    .single()

  if (error) {
    console.error("[PT Sessions] Error fetching session:", error)
    return null
  }

  return data as PTSessionWithProfiles
}
