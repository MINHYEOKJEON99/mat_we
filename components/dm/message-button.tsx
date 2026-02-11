"use client"

import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useFloatingChat } from "./floating-chat-provider"

interface MessageButtonProps {
  partnerId: string
  partnerName: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
}

export function MessageButton({
  partnerId,
  partnerName,
  variant = "outline",
  size = "default",
  className,
}: MessageButtonProps) {
  const floatingChat = useFloatingChat()

  const handleClick = () => {
    floatingChat?.startConversationWith(partnerId)
  }

  // Provider가 없으면 버튼을 렌더링하지 않음
  if (!floatingChat) {
    return null
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
    >
      <MessageCircle className="mr-2 h-4 w-4" />
      {partnerName}님에게 메시지
    </Button>
  )
}
