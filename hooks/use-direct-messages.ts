import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { createClient } from "@/lib/client"
import { supabaseRpc, supabaseInsert, supabaseUpdate } from "@/lib/api/client/supabase-rest"
import type { Conversation, DirectMessage, ConversationListItem, Profile } from "@/lib/database"

// Query Keys
export const dmKeys = {
  all: ["direct-messages"] as const,
  conversations: () => [...dmKeys.all, "conversations"] as const,
  conversation: (id: string) => [...dmKeys.all, "conversation", id] as const,
  messages: (conversationId: string) => [...dmKeys.all, "messages", conversationId] as const,
  unreadCount: () => [...dmKeys.all, "unread-count"] as const,
}

type PartnerProfile = Pick<Profile, "id" | "display_name" | "avatar_url" | "role">

interface ConversationWithMessages {
  id: string
  participant_1_id: string
  participant_2_id: string
  last_message_at: string
  created_at: string
  participant_1: PartnerProfile
  participant_2: PartnerProfile
  direct_messages: DirectMessage[]
}

/**
 * 현재 사용자의 모든 대화 목록 조회
 */
export function useConversations(userId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: dmKeys.conversations(),
    queryFn: async (): Promise<ConversationListItem[]> => {
      if (!userId) return []

      const { data, error } = await supabase
        .from("conversations")
        .select(`
          id,
          participant_1_id,
          participant_2_id,
          last_message_at,
          participant_1:profiles!conversations_participant_1_id_fkey (
            id, display_name, avatar_url, role
          ),
          participant_2:profiles!conversations_participant_2_id_fkey (
            id, display_name, avatar_url, role
          ),
          direct_messages (
            id, content, is_read, sender_id, created_at
          )
        `)
        .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
        .order("last_message_at", { ascending: false })

      if (error) throw error

      return ((data as unknown as ConversationWithMessages[]) || []).map((conv) => {
        const isParticipant1 = conv.participant_1_id === userId
        const partner = isParticipant1 ? conv.participant_2 : conv.participant_1

        const messages = conv.direct_messages || []
        const sortedMessages = [...messages].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        const lastMsg = sortedMessages[0]

        const unreadCount = messages.filter(
          (m) => !m.is_read && m.sender_id !== userId
        ).length

        return {
          id: conv.id,
          partner,
          lastMessage: lastMsg?.content || null,
          lastMessageAt: conv.last_message_at,
          unreadCount,
        }
      })
    },
    enabled: !!userId,
    refetchInterval: 30000,
  })
}

/**
 * 대화방 생성 또는 조회
 */
export function useGetOrCreateConversation() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ partnerId }: { partnerId: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("로그인이 필요합니다")

      const conversationId = await supabaseRpc<string>("get_or_create_conversation", {
        user_1: user.id,
        user_2: partnerId,
      })

      return conversationId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dmKeys.conversations() })
    },
  })
}

/**
 * 특정 대화의 메시지 목록 조회
 */
export function useMessages(conversationId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: dmKeys.messages(conversationId || ""),
    queryFn: async () => {
      if (!conversationId) return []

      const { data, error } = await supabase
        .from("direct_messages")
        .select(`
          *,
          sender:profiles!direct_messages_sender_id_fkey (
            id, display_name, avatar_url
          )
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

      if (error) throw error
      return data as (DirectMessage & { sender: PartnerProfile })[]
    },
    enabled: !!conversationId,
  })
}

/**
 * 메시지 전송
 */
export function useSendDirectMessage() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
    }: {
      conversationId: string
      content: string
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("로그인이 필요합니다")

      const result = await supabaseInsert<DirectMessage>("direct_messages", {
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
      })

      if (!result || result.length === 0) {
        throw new Error("메시지 전송에 실패했습니다")
      }

      return result[0]
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: dmKeys.messages(data.conversation_id) })
      queryClient.invalidateQueries({ queryKey: dmKeys.conversations() })
    },
  })
}

/**
 * 메시지 읽음 처리
 */
export function useMarkMessagesAsRead() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ conversationId }: { conversationId: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("로그인이 필요합니다")

      await supabaseUpdate(
        "direct_messages",
        `conversation_id=eq.${conversationId}&sender_id=neq.${user.id}&is_read=eq.false`,
        { is_read: true }
      )
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dmKeys.messages(variables.conversationId) })
      queryClient.invalidateQueries({ queryKey: dmKeys.conversations() })
      queryClient.invalidateQueries({ queryKey: dmKeys.unreadCount() })
    },
  })
}

/**
 * 전체 읽지 않은 메시지 수
 */
export function useTotalUnreadCount(userId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: dmKeys.unreadCount(),
    queryFn: async (): Promise<number> => {
      if (!userId) return 0

      const { data: conversations, error: convError } = await supabase
        .from("conversations")
        .select("id")
        .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)

      if (convError) throw convError
      if (!conversations?.length) return 0

      const conversationIds = conversations.map((c) => c.id)

      const { count, error } = await supabase
        .from("direct_messages")
        .select("*", { count: "exact", head: true })
        .in("conversation_id", conversationIds)
        .neq("sender_id", userId)
        .eq("is_read", false)

      if (error) throw error
      return count || 0
    },
    enabled: !!userId,
    refetchInterval: 30000,
  })
}

/**
 * 실시간 메시지 구독 훅
 */
export function useMessageSubscription(
  conversationId: string | undefined,
  onNewMessage?: () => void
) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`dm-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: dmKeys.messages(conversationId) })
          queryClient.invalidateQueries({ queryKey: dmKeys.conversations() })
          queryClient.invalidateQueries({ queryKey: dmKeys.unreadCount() })
          onNewMessage?.()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, supabase, queryClient, onNewMessage])
}

/**
 * 전체 DM 알림 구독 훅
 */
export function useDMNotificationSubscription(userId: string | undefined) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel("dm-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: dmKeys.conversations() })
          queryClient.invalidateQueries({ queryKey: dmKeys.unreadCount() })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase, queryClient])
}
