"use client"

import { useState, useCallback, type KeyboardEvent } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useSendDirectMessage } from "@/hooks/use-direct-messages"

interface MessageInputProps {
  conversationId: string
}

export function MessageInput({ conversationId }: MessageInputProps) {
  const [content, setContent] = useState("")
  const sendMessage = useSendDirectMessage()

  const handleSend = useCallback(() => {
    const trimmedContent = content.trim()
    if (!trimmedContent || sendMessage.isPending) return

    sendMessage.mutate(
      { conversationId, content: trimmedContent },
      {
        onSuccess: () => {
          setContent("")
        },
      }
    )
  }, [content, conversationId, sendMessage])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex items-end gap-2 p-3 border-t bg-background">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="메시지를 입력하세요..."
        className="min-h-[40px] max-h-[120px] resize-none rounded-xl"
        rows={1}
        disabled={sendMessage.isPending}
      />
      <Button
        onClick={handleSend}
        disabled={!content.trim() || sendMessage.isPending}
        size="icon"
        className="h-10 w-10 shrink-0 rounded-full"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  )
}
