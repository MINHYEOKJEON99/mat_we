import { createClient } from "@/lib/server"
import type { ChatMessage } from "@/lib/database"

export type ChatMessageWithSender = ChatMessage & {
  sender: {
    id: string
    display_name: string
    avatar_url: string | null
  }
}

/**
 * Get chat messages by PT session ID
 */
export async function getChatMessagesBySession(
  sessionId: string
): Promise<ChatMessageWithSender[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("chat_messages")
    .select(`
      *,
      sender:profiles!chat_messages_sender_id_fkey (
        id, display_name, avatar_url
      )
    `)
    .eq("pt_session_id", sessionId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[Chat] Error fetching messages:", error)
    return []
  }

  return data as ChatMessageWithSender[]
}
