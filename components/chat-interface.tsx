"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send } from "lucide-react"
import { useChatMessages, useSendMessage } from "@/hooks"
import { useQueryClient } from "@tanstack/react-query"
import { ptSessionKeys } from "@/hooks/use-pt-sessions"

interface ChatInterfaceProps {
  sessionId: string
  userId: string
}

export function ChatInterface({ sessionId, userId }: ChatInterfaceProps) {
  const [newMessage, setNewMessage] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const supabase = createClient()

  const { data: messages = [] } = useChatMessages(sessionId)
  const sendMessage = useSendMessage()

  // Realtime 구독으로 즉시 업데이트
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `pt_session_id=eq.${sessionId}`,
        },
        () => {
          // 새 메시지가 오면 쿼리 무효화
          queryClient.invalidateQueries({ queryKey: ptSessionKeys.messages(sessionId) })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, supabase, queryClient])

  // 메시지 변경 시 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sendMessage.isPending) return

    try {
      await sendMessage.mutateAsync({
        pt_session_id: sessionId,
        sender_id: userId,
        message: newMessage.trim(),
      })
      setNewMessage("")
    } catch (error) {
      console.error("Failed to send message:", error)
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
        <div className="space-y-4 pb-4">
          {messages.map((message) => {
            const isOwn = message.sender_id === userId
            return (
              <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] ${isOwn ? "order-2" : "order-1"}`}>
                  <div className={`rounded-lg px-4 py-2 ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {!isOwn && <p className="text-xs font-semibold mb-1 opacity-70">{message.sender?.display_name}</p>}
                    <p className="text-sm">{message.message}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 px-1">
                    {new Date(message.created_at).toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="flex gap-2 pt-4 border-t">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="메시지를 입력하세요..."
          disabled={sendMessage.isPending}
        />
        <Button type="submit" size="icon" disabled={sendMessage.isPending || !newMessage.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
