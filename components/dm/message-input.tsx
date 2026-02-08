"use client";

import { useState, useCallback, useRef, useEffect, useMemo, type KeyboardEvent } from "react";
import { Send, Plus, Calendar, X, CalendarCheck, ClipboardList, Clock, MapPin, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSendDirectMessage, useMessages } from "@/hooks/use-direct-messages";
import { useInstructorPTSessions, useStudentPTSessions } from "@/hooks/use-pt-sessions";
import { useFloatingChat } from "./floating-chat-provider";
import { useCurrentProfile } from "@/hooks";
import { PTScheduler, PTCalendar } from "@/components/pt";
import { cn } from "@/lib/utils";
import type { PTRequestMetadata, PTScheduleMetadata } from "@/lib/database";

interface MessageInputProps {
  conversationId: string;
  partnerId: string;
}

type ActivePanel = "scheduler" | "calendar" | "requests" | null;

export function MessageInput({ conversationId, partnerId }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const sendMessage = useSendDirectMessage();
  const floatingChat = useFloatingChat();
  const isExpanded = floatingChat?.isExpanded ?? false;
  const { data: profile } = useCurrentProfile();

  const isInstructor = profile?.role === "instructor";

  // PT 데이터 조회
  const { data: messages = [] } = useMessages(conversationId);
  const { data: instructorSessions } = useInstructorPTSessions(isInstructor ? profile?.id : undefined);
  const { data: studentSessions } = useStudentPTSessions(!isInstructor ? profile?.id : undefined);

  // 이 대화 상대와의 PT 세션 (캘린더용)
  const partnerPTSessions = useMemo(() => {
    const sessions = instructorSessions || studentSessions || [];
    return sessions.filter((s) => (isInstructor ? s.student_id === partnerId : s.instructor_id === partnerId));
  }, [instructorSessions, studentSessions, isInstructor, partnerId]);

  // DM에서 PT 일정 확정 메시지
  const scheduleMessages = useMemo(() => {
    return messages.filter((m) => m.type === "pt_schedule" && m.metadata);
  }, [messages]);

  // 메뉴 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSend = useCallback(() => {
    const trimmedContent = content.trim();
    if (!trimmedContent || sendMessage.isPending) return;

    sendMessage.mutate(
      { conversationId, content: trimmedContent },
      {
        onSuccess: () => {
          setContent("");
        },
      },
    );
  }, [content, conversationId, sendMessage]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleScheduleConfirm = async (data: {
    scheduledAt: string;
    endAt: string;
    location: string;
    locationDetail: string;
  }) => {
    const startDate = new Date(data.scheduledAt);
    const endDate = new Date(data.endAt);

    const dateStr = startDate.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });

    const startTimeStr = startDate.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const endTimeStr = endDate.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    await sendMessage.mutateAsync({
      conversationId,
      content: "PT 일정이 확정되었습니다",
      type: "pt_schedule",
      metadata: {
        date: dateStr,
        startTime: startTimeStr,
        endTime: endTimeStr,
        location: data.location,
        locationDetail: data.locationDetail || undefined,
      },
    });

    setActivePanel(null);
    setShowMenu(false);
  };

  const closePanel = () => {
    setActivePanel(null);
    setSelectedDate(null);
  };

  const panelPosition = cn(
    "fixed z-[60] bg-background border rounded-xl shadow-2xl overflow-hidden flex flex-col",
    "max-md:right-auto max-md:left-4 max-md:bottom-4 max-md:w-[calc(100%-2rem)] max-md:max-h-[60vh]",
    isExpanded ? "md:right-[650px] md:bottom-6" : "md:right-[420px] md:bottom-24",
  );

  return (
    <div className="relative">
      {/* PT 스케줄러 패널 */}
      {activePanel === "scheduler" && (
        <div className={cn(panelPosition, "w-[320px] max-h-[480px]")}>
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <h3 className="font-semibold text-sm">PT 일정 잡기</h3>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={closePanel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-3 overflow-y-auto flex-1">
            <PTScheduler sessionId={conversationId} onConfirm={handleScheduleConfirm} onCancel={closePanel} compact />
          </div>
        </div>
      )}

      {/* PT 일정 확인 캘린더 패널 */}
      {activePanel === "calendar" && (
        <div className={cn(panelPosition, "w-[320px] max-h-[420px]")}>
          <div className="flex items-center justify-between px-4 py-3 border-b bg-emerald-50">
            <h3 className="font-semibold text-sm text-emerald-800">PT 일정 확인</h3>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={closePanel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-3 overflow-y-auto flex-1">
            {/* DM으로 확정된 PT 일정 목록 */}
            {scheduleMessages.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-xs font-medium text-slate-500">확정된 일정</h4>
                {scheduleMessages.map((msg) => {
                  const meta = msg.metadata as PTScheduleMetadata;
                  return (
                    <div key={msg.id} className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                      <div className="flex items-center gap-2 text-sm font-medium text-emerald-800">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{meta.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-emerald-700 mt-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {meta.startTime} ~ {meta.endTime}
                        </span>
                      </div>
                      {meta.location && (
                        <div className="flex items-center gap-2 text-xs text-emerald-700 mt-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{meta.location}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 데이터 없음 상태 */}
            {!selectedDate && scheduleMessages.length === 0 && partnerPTSessions.length === 0 && (
              <div className="mt-3 text-center py-4">
                <CalendarCheck className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400">아직 확정된 PT 일정이 없습니다</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 추가 메뉴 */}
      {showMenu && (
        <div
          ref={menuRef}
          className="absolute bottom-full left-3 mb-2 bg-background border rounded-xl shadow-lg overflow-hidden min-w-[200px]">
          {/* PT 일정 잡기 */}
          <button
            type="button"
            onClick={() => {
              setActivePanel("scheduler");
              setShowMenu(false);
            }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors w-full text-left">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Calendar className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-medium">PT 일정 잡기</p>
              <p className="text-xs text-muted-foreground">날짜, 시간, 장소 설정</p>
            </div>
          </button>

          {/* PT 일정 확인하기 */}
          <button
            type="button"
            onClick={() => {
              setActivePanel("calendar");
              setShowMenu(false);
            }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors w-full text-left border-t">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CalendarCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium">PT 일정 확인</p>
              <p className="text-xs text-muted-foreground">예정된 PT 일정 보기</p>
            </div>
          </button>
        </div>
      )}

      {/* 입력 영역 */}
      <div className="flex items-end gap-2 p-3 border-t bg-background">
        <Button
          ref={buttonRef}
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-10 w-10 shrink-0 rounded-full transition-transform", showMenu && "rotate-45")}
          onClick={() => setShowMenu(!showMenu)}>
          <Plus className="h-5 w-5" />
        </Button>

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
          className="h-10 w-10 shrink-0 rounded-full">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
