"use client"

import { useConversations, useCurrentProfile } from "@/hooks"
import { ConversationListItem } from "./conversation-list-item"
import { MessageCircle } from "lucide-react"

interface ConversationListProps {
  onSelectConversation: (conversationId: string) => void
}

export function ConversationList({ onSelectConversation }: ConversationListProps) {
  const { data: profile } = useCurrentProfile()
  const { data: conversations = [], isLoading } = useConversations(profile?.id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
        <MessageCircle className="h-12 w-12 mb-3 opacity-50" />
        <p className="font-medium">대화가 없습니다</p>
        <p className="text-sm mt-1">강사 프로필에서 메시지를 보내 대화를 시작하세요</p>
      </div>
    )
  }

  return (
    <div className="overflow-y-auto h-full">
      {conversations.map((conversation) => (
        <ConversationListItem
          key={conversation.id}
          conversation={conversation}
          onClick={() => onSelectConversation(conversation.id)}
        />
      ))}
    </div>
  )
}
