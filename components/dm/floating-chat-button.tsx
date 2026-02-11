"use client"

import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useFloatingChatSafe } from "./floating-chat-provider"
import { useTotalUnreadCount, useCurrentProfile } from "@/hooks"

export function FloatingChatButton() {
  const { toggleChat, isOpen } = useFloatingChatSafe()
  const { data: profile } = useCurrentProfile()
  const { data: unreadCount = 0 } = useTotalUnreadCount(profile?.id)

  return (
    <Button
      onClick={toggleChat}
      className={`
        fixed bottom-6 right-6 z-50
        h-14 w-14 rounded-full shadow-lg
        transition-all duration-200
        hover:scale-105
        ${isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"}
      `}
      size="icon"
      aria-label="채팅 열기"
    >
      <MessageCircle className="h-6 w-6" />
      {unreadCount > 0 && (
        <span
          className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-medium text-destructive-foreground"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Button>
  )
}
