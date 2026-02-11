"use client";

import { useEffect, useCallback } from "react";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { useMessages, useMarkMessagesAsRead, useMessageSubscription, useCurrentProfile, useDeleteDirectMessage } from "@/hooks";
import type { Profile } from "@/lib/database";

interface ChatRoomProps {
  conversationId: string;
  partner: Pick<Profile, "id" | "display_name" | "avatar_url" | "role">;
}

export function ChatRoom({ conversationId, partner }: ChatRoomProps) {
  const { data: profile } = useCurrentProfile();
  const { data: messages = [], isLoading } = useMessages(conversationId);
  const markAsRead = useMarkMessagesAsRead();
  const deleteMessage = useDeleteDirectMessage();

  // 실시간 메시지 구독
  useMessageSubscription(conversationId);

  // 대화방 진입 시 읽음 처리
  useEffect(() => {
    if (conversationId && profile?.id) {
      markAsRead.mutate({ conversationId });
    }
  }, [conversationId, profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // 메시지 삭제 핸들러
  const handleDeleteMessage = useCallback((messageId: string) => {
    deleteMessage.mutate({ messageId, conversationId });
  }, [conversationId, deleteMessage]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          currentUserId={profile?.id || ""}
          isLoading={isLoading}
          onDeleteMessage={handleDeleteMessage}
        />
      </div>

      {/* Input */}
      <MessageInput conversationId={conversationId} partnerId={partner.id} />
    </div>
  );
}
