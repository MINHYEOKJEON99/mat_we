"use client"

import { useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useFloatingChatSafe } from "./floating-chat-provider"
import { ConversationList } from "./conversation-list"
import { ChatRoom } from "./chat-room"
import { useCurrentProfile } from "@/hooks"
import { useGetOrCreateConversation, useConversations } from "@/hooks/use-direct-messages"

export function ChatPanel() {
  const {
    isOpen,
    closeChat,
    activeConversationId,
    setActiveConversationId,
    pendingPartnerId,
    clearPendingPartner,
  } = useFloatingChatSafe()

  const { data: profile } = useCurrentProfile()
  const { data: conversations = [] } = useConversations(profile?.id)
  const getOrCreateConversation = useGetOrCreateConversation()

  // 새 대화 시작 처리
  useEffect(() => {
    if (pendingPartnerId && profile?.id) {
      // 이미 존재하는 대화인지 확인
      const existingConv = conversations.find(
        (c) => c.partner.id === pendingPartnerId
      )

      if (existingConv) {
        setActiveConversationId(existingConv.id)
        clearPendingPartner()
      } else {
        // 새 대화 생성
        getOrCreateConversation.mutate(
          { partnerId: pendingPartnerId },
          {
            onSuccess: (conversationId) => {
              setActiveConversationId(conversationId)
              clearPendingPartner()
            },
          }
        )
      }
    }
  }, [pendingPartnerId, profile?.id, conversations, setActiveConversationId, clearPendingPartner, getOrCreateConversation])

  // 현재 활성 대화의 파트너 정보
  const activeConversation = conversations.find((c) => c.id === activeConversationId)

  if (!isOpen) return null

  return (
    <div
      className={`
        fixed z-50 bg-background border rounded-lg shadow-xl overflow-hidden
        flex flex-col
        transition-all duration-200 ease-out
        md:bottom-24 md:right-6 md:w-[380px] md:h-[550px]
        max-md:inset-0 max-md:rounded-none
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <h2 className="font-semibold">
          {activeConversationId ? activeConversation?.partner.display_name || "채팅" : "채팅"}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={closeChat}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeConversationId && activeConversation ? (
          <ChatRoom
            conversationId={activeConversationId}
            partner={activeConversation.partner}
            onBack={() => setActiveConversationId(null)}
          />
        ) : (
          <ConversationList
            onSelectConversation={setActiveConversationId}
          />
        )}
      </div>
    </div>
  )
}
