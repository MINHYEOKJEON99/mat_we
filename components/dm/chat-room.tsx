"use client"

import { useEffect } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageList } from "./message-list"
import { MessageInput } from "./message-input"
import {
  useMessages,
  useMarkMessagesAsRead,
  useMessageSubscription,
  useCurrentProfile,
} from "@/hooks"
import type { Profile } from "@/lib/database"

interface ChatRoomProps {
  conversationId: string
  partner: Pick<Profile, "id" | "display_name" | "avatar_url" | "role">
  onBack: () => void
}

export function ChatRoom({ conversationId, partner, onBack }: ChatRoomProps) {
  const { data: profile } = useCurrentProfile()
  const { data: messages = [], isLoading } = useMessages(conversationId)
  const markAsRead = useMarkMessagesAsRead()

  // 실시간 메시지 구독
  useMessageSubscription(conversationId)

  // 대화방 진입 시 읽음 처리
  useEffect(() => {
    if (conversationId && profile?.id) {
      markAsRead.mutate({ conversationId })
    }
  }, [conversationId, profile?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2 border-b">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={partner.avatar_url || undefined} alt={partner.display_name} />
          <AvatarFallback className="text-sm">
            {partner.display_name?.charAt(0) || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{partner.display_name}</span>
            {partner.role === "instructor" && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                강사
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          currentUserId={profile?.id || ""}
          isLoading={isLoading}
        />
      </div>

      {/* Input */}
      <MessageInput conversationId={conversationId} />
    </div>
  )
}
