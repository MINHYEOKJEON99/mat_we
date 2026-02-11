"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MessageBubble } from "./message-bubble";
import { SystemMessageCard, isSystemMessage } from "./system-message-card";
import { MessageContextMenu } from "./message-context-menu";
import type { DirectMessage, Profile } from "@/lib/database";

type MessageWithSender = DirectMessage & {
  sender: Pick<Profile, "id" | "display_name" | "avatar_url">;
};

interface MessageListProps {
  messages: MessageWithSender[];
  currentUserId: string;
  isLoading: boolean;
  onDeleteMessage?: (messageId: string) => void;
}

interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  messageId: string | null;
  isOwn: boolean;
}

export function MessageList({ messages, currentUserId, isLoading, onDeleteMessage }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    messageId: null,
    isOwn: false,
  });

  // 새 메시지 시 스크롤 하단으로
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 컨텍스트 메뉴 닫기
  useEffect(() => {
    const handleClick = () => setContextMenu((prev) => ({ ...prev, isOpen: false }));
    if (contextMenu.isOpen) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [contextMenu.isOpen]);

  const handleContextMenu = useCallback((e: React.MouseEvent, messageId: string, isOwn: boolean) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      messageId,
      isOwn,
    });
  }, []);

  const handleDelete = useCallback(() => {
    if (contextMenu.messageId && onDeleteMessage) {
      onDeleteMessage(contextMenu.messageId);
    }
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, [contextMenu.messageId, onDeleteMessage]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        메시지가 없습니다. 대화를 시작해보세요!
      </div>
    );
  }

  // 날짜별로 메시지 그룹화
  const groupedMessages = groupMessagesByDate(messages);

  return (
    <>
      <div ref={scrollRef} className="overflow-y-auto h-full px-4 py-3 bg-white dark:bg-gray-600">
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
              const isOwn = message.sender_id === currentUserId;
              const showAvatar = !isOwn && (index === 0 || dayMessages[index - 1]?.sender_id !== message.sender_id);

              // 시스템 메시지 (PT 신청, PT 일정 등)
              if (isSystemMessage(message.type)) {
                // 메타데이터가 없으면 일반 메시지로 표시
                if (!message.metadata) {
                  console.warn("시스템 메시지에 metadata 없음:", message);
                  return (
                    <div key={message.id} onContextMenu={(e) => handleContextMenu(e, message.id, isOwn)}>
                      <MessageBubble message={message} isOwn={isOwn} showAvatar={showAvatar} />
                    </div>
                  );
                }

                return (
                  <div key={message.id} onContextMenu={(e) => handleContextMenu(e, message.id, isOwn)}>
                    <SystemMessageCard type={message.type} metadata={message.metadata} isOwn={isOwn} />
                  </div>
                );
              }

              return (
                <div key={message.id} onContextMenu={(e) => handleContextMenu(e, message.id, isOwn)}>
                  <MessageBubble message={message} isOwn={isOwn} showAvatar={showAvatar} />
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 컨텍스트 메뉴 */}
      <MessageContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        isOwn={contextMenu.isOwn}
        onDelete={handleDelete}
        onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
      />
    </>
  );
}

function groupMessagesByDate(messages: MessageWithSender[]): Record<string, MessageWithSender[]> {
  return messages.reduce(
    (groups, message) => {
      const date = new Date(message.created_at);
      const dateKey = date.toISOString().split("T")[0];

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);

      return groups;
    },
    {} as Record<string, MessageWithSender[]>,
  );
}

function formatDateHeader(dateKey: string): string {
  const date = new Date(dateKey);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateKey === today.toISOString().split("T")[0]) {
    return "오늘";
  }
  if (dateKey === yesterday.toISOString().split("T")[0]) {
    return "어제";
  }

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
