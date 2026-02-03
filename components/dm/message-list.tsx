"use client"

import { useEffect, useRef } from "react"
import { MessageBubble } from "./message-bubble"
import type { DirectMessage, Profile } from "@/lib/database"

type MessageWithSender = DirectMessage & {
  sender: Pick<Profile, "id" | "display_name" | "avatar_url">
}

interface MessageListProps {
  messages: MessageWithSender[]
  currentUserId: string
  isLoading: boolean
}

export function MessageList({ messages, currentUserId, isLoading }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // 새 메시지 시 스크롤 하단으로
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        메시지가 없습니다. 대화를 시작해보세요!
      </div>
    )
  }

  // 날짜별로 메시지 그룹화
  const groupedMessages = groupMessagesByDate(messages)

  return (
    <div ref={scrollRef} className="overflow-y-auto h-full px-4 py-3">
      {Object.entries(groupedMessages).map(([dateKey, dayMessages]) => (
        <div key={dateKey}>
          {/* 날짜 구분선 */}
          <div className="flex items-center justify-center my-4">
            <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
              {formatDateHeader(dateKey)}
            </span>
          </div>

          {/* 해당 날짜의 메시지들 */}
          {dayMessages.map((message, index) => {
            const isOwn = message.sender_id === currentUserId
            const showAvatar = !isOwn && (
              index === 0 ||
              dayMessages[index - 1]?.sender_id !== message.sender_id
            )

            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={isOwn}
                showAvatar={showAvatar}
              />
            )
          })}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}

function groupMessagesByDate(messages: MessageWithSender[]): Record<string, MessageWithSender[]> {
  return messages.reduce((groups, message) => {
    const date = new Date(message.created_at)
    const dateKey = date.toISOString().split("T")[0]

    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(message)

    return groups
  }, {} as Record<string, MessageWithSender[]>)
}

function formatDateHeader(dateKey: string): string {
  const date = new Date(dateKey)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (dateKey === today.toISOString().split("T")[0]) {
    return "오늘"
  }
  if (dateKey === yesterday.toISOString().split("T")[0]) {
    return "어제"
  }

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
