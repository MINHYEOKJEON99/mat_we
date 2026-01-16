import { createClient } from "@/lib/client"

/**
 * Update PT session status (client-side)
 */
export async function updatePTSessionStatus(
  sessionId: string,
  status: "pending" | "confirmed" | "completed" | "cancelled",
  scheduledAt?: string
): Promise<void> {
  const supabase = createClient()

  const updateData: {
    status: string
    scheduled_at?: string
  } = { status }

  if (scheduledAt) {
    updateData.scheduled_at = scheduledAt
  }

  const { error } = await supabase
    .from("pt_sessions")
    .update(updateData)
    .eq("id", sessionId)

  if (error) {
    throw new Error(`Failed to update session: ${error.message}`)
  }
}
