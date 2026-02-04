"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, CheckCheck } from "lucide-react";
import type { DirectMessage, Profile } from "@/lib/database";

type MessageWithSender = DirectMessage & {
  sender: Pick<Profile, "id" | "display_name" | "avatar_url">;
};

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwn: boolean;
  showAvatar: boolean;
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageBubble({ message, isOwn, showAvatar }: MessageBubbleProps) {
  return (
    <div className={`flex gap-2 mb-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {/* 아바타 (상대방 메시지일 때만) */}
      {!isOwn && (
        <div className="w-8 shrink-0">
          {showAvatar && (
            <Avatar className="h-8 w-8">
              <AvatarImage src={message.sender.avatar_url || undefined} alt={message.sender.display_name} />
              <AvatarFallback className="text-xs">{message.sender.display_name?.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
          )}
        </div>
      )}

      {/* 메시지 버블 */}
      <div className={`flex flex-col max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
        <div
          className={`px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
            isOwn ? "bg-slate-700 text-slate-100 rounded-tr-sm" : "bg-gray-300 text-gray-800 rounded-tl-sm"
          }`}>
          {message.content}
        </div>

        {/* 시간 & 읽음 표시 */}
        <div
          className={`flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground ${
            isOwn ? "flex-row-reverse" : "flex-row"
          }`}>
          <span>{formatTime(message.created_at)}</span>
          {isOwn && (message.is_read ? <CheckCheck className="h-3 w-3 text-primary" /> : <Check className="h-3 w-3" />)}
        </div>
      </div>
    </div>
  );
}
