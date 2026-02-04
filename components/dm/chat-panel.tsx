"use client";

import { useEffect } from "react";
import { X, ArrowLeft, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useFloatingChatSafe } from "./floating-chat-provider";
import { ConversationList } from "./conversation-list";
import { ChatRoom } from "./chat-room";
import { useCurrentProfile } from "@/hooks";
import { useGetOrCreateConversation, useConversations } from "@/hooks/use-direct-messages";
import { cn } from "@/lib/utils";

// 스크롤 잠금 훅
function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (isLocked) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [isLocked]);
}

export function ChatPanel() {
  const {
    isOpen,
    closeChat,
    activeConversationId,
    setActiveConversationId,
    pendingPartnerId,
    clearPendingPartner,
    isExpanded,
    toggleExpand,
  } = useFloatingChatSafe();

  const { data: profile } = useCurrentProfile();
  const { data: conversations = [] } = useConversations(profile?.id);
  const getOrCreateConversation = useGetOrCreateConversation();

  // 채팅창 열릴 때 배경 스크롤 잠금
  useScrollLock(isOpen);

  // 새 대화 시작 처리
  useEffect(() => {
    if (pendingPartnerId && profile?.id) {
      // 이미 존재하는 대화인지 확인
      const existingConv = conversations.find((c) => c.partner.id === pendingPartnerId);

      if (existingConv) {
        setActiveConversationId(existingConv.id);
        clearPendingPartner();
      } else {
        // 새 대화 생성
        getOrCreateConversation.mutate(
          { partnerId: pendingPartnerId },
          {
            onSuccess: (conversationId) => {
              setActiveConversationId(conversationId);
              clearPendingPartner();
            },
          },
        );
      }
    }
  }, [
    pendingPartnerId,
    profile?.id,
    conversations,
    setActiveConversationId,
    clearPendingPartner,
    getOrCreateConversation,
  ]);

  // 현재 활성 대화의 파트너 정보
  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed z-50 bg-background border rounded-lg shadow-xl overflow-hidden",
        "flex flex-col",
        "transition-all duration-200 ease-out",
        // 기본 크기 (축소 상태)
        !isExpanded && "md:bottom-24 md:right-6 md:w-[380px] md:h-[550px]",
        // 확대 상태 (더 큰 크기)
        isExpanded && "md:bottom-6 md:right-6 md:w-[600px] md:h-[85vh]",
        // 모바일은 항상 전체화면
        "max-md:inset-0 max-md:rounded-none",
      )}>
      {/* Header - 통합된 단일 헤더 */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-gray-200/30">
        {/* 뒤로가기 버튼 (채팅방일 때만) */}
        {activeConversationId && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setActiveConversationId(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}

        {/* 파트너 정보 또는 기본 제목 */}
        {activeConversationId && activeConversation ? (
          <>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage
                src={activeConversation.partner.avatar_url || undefined}
                alt={activeConversation.partner.display_name}
              />
              <AvatarFallback className="text-xs">
                {activeConversation.partner.display_name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{activeConversation.partner.display_name}</span>
                {activeConversation.partner.role === "instructor" && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                    강사
                  </Badge>
                )}
              </div>
            </div>
          </>
        ) : (
          <h2 className="font-semibold flex-1">채팅</h2>
        )}

        {/* 확대/축소 버튼 (데스크톱만) */}
        <Button variant="ghost" size="icon" className="h-8 w-8 hidden md:flex" onClick={toggleExpand}>
          {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>

        {/* 닫기 버튼 */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={closeChat}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeConversationId && activeConversation ? (
          <ChatRoom conversationId={activeConversationId} partner={activeConversation.partner} />
        ) : (
          <ConversationList onSelectConversation={setActiveConversationId} />
        )}
      </div>
    </div>
  );
}
