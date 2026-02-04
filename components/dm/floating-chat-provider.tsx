"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { useCurrentProfile } from "@/hooks";
import { useDMNotificationSubscription } from "@/hooks/use-direct-messages";
import { FloatingChatButton } from "./floating-chat-button";
import { ChatPanel } from "./chat-panel";

interface FloatingChatContextValue {
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  startConversationWith: (partnerId: string) => void;
  pendingPartnerId: string | null;
  clearPendingPartner: () => void;
  isExpanded: boolean;
  toggleExpand: () => void;
}

const FloatingChatContext = createContext<FloatingChatContextValue | null>(null);

export function useFloatingChat() {
  const context = useContext(FloatingChatContext);
  return context;
}

export function useFloatingChatSafe() {
  const context = useContext(FloatingChatContext);
  if (!context) {
    throw new Error("useFloatingChat must be used within FloatingChatProvider");
  }
  return context;
}

export function FloatingChatProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [pendingPartnerId, setPendingPartnerId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: profile } = useCurrentProfile();

  // 실시간 알림 구독
  useDMNotificationSubscription(profile?.id);

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => {
    setIsOpen(false);
    setActiveConversationId(null);
    setPendingPartnerId(null);
  }, []);
  const toggleChat = useCallback(() => setIsOpen((prev) => !prev), []);
  const toggleExpand = useCallback(() => setIsExpanded((prev) => !prev), []);

  const startConversationWith = useCallback((partnerId: string) => {
    setPendingPartnerId(partnerId);
    setActiveConversationId(null);
    setIsOpen(true);
  }, []);

  const clearPendingPartner = useCallback(() => {
    setPendingPartnerId(null);
  }, []);

  // 로그인하지 않은 경우 채팅 UI 표시하지 않음
  if (!profile) {
    return <>{children}</>;
  }

  return (
    <FloatingChatContext.Provider
      value={{
        isOpen,
        openChat,
        closeChat,
        toggleChat,
        activeConversationId,
        setActiveConversationId,
        startConversationWith,
        pendingPartnerId,
        clearPendingPartner,
        isExpanded,
        toggleExpand,
      }}
    >
      {children}
      <FloatingChatButton />
      <ChatPanel />
    </FloatingChatContext.Provider>
  );
}
