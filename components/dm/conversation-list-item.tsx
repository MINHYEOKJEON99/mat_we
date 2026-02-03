"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { ConversationListItem as ConversationListItemType } from "@/lib/database"

interface ConversationListItemProps {
  conversation: ConversationListItemType
  onClick: () => void
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return "방금"
  if (diffMins < 60) return `${diffMins}분 전`
  if (diffHours < 24) {
    return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
  }
  if (diffDays < 7) return `${diffDays}일 전`

  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })
}

export function ConversationListItem({ conversation, onClick }: ConversationListItemProps) {
  const { partner, lastMessage, lastMessageAt, unreadCount } = conversation

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b last:border-b-0"
    >
      {/* Avatar */}
      <Avatar className="h-12 w-12 shrink-0">
        <AvatarImage src={partner.avatar_url || undefined} alt={partner.display_name} />
        <AvatarFallback className="text-sm">
          {partner.display_name?.charAt(0) || "?"}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium truncate">{partner.display_name}</span>
            {partner.role === "instructor" && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                강사
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatRelativeTime(lastMessageAt)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-sm text-muted-foreground truncate">
            {lastMessage || "대화를 시작하세요"}
          </p>
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground shrink-0">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
