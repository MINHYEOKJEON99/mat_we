"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PTSession } from "@/lib/database";

interface PTCalendarProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  sessions?: PTSession[];
  onSelectSession?: (session: PTSession) => void;
  compact?: boolean; // 작은 사이즈 모드
}

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTHS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function PTCalendar({
  selectedDate,
  onSelectDate,
  sessions = [],
  onSelectSession,
  compact = false,
}: PTCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: (Date | null)[] = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Add all days in the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [currentMonth]);

  const sessionsOnDate = useMemo(() => {
    const map = new Map<string, PTSession[]>();
    sessions.forEach((session) => {
      if (session.scheduled_at) {
        const dateKey = new Date(session.scheduled_at).toDateString();
        const existing = map.get(dateKey) || [];
        map.set(dateKey, [...existing, session]);
      }
    });
    return map;
  }, [sessions]);

  const selectedDateSessions = useMemo(() => {
    if (!selectedDate) return [];
    return sessionsOnDate.get(selectedDate.toDateString()) || [];
  }, [selectedDate, sessionsOnDate]);

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const today = new Date();

  return (
    <div className="w-full">
      {/* Calendar Header */}
      <div className={cn("flex items-center justify-between", compact ? "mb-2" : "mb-4")}>
        <button
          type="button"
          onClick={goToPreviousMonth}
          className={cn("hover:bg-slate-100 rounded-full transition-colors", compact ? "p-1" : "p-2")}>
          <ChevronLeft className={cn(compact ? "h-4 w-4" : "h-5 w-5", "text-slate-600")} />
        </button>
        <h2 className={cn(compact ? "text-sm" : "text-lg", "font-semibold text-slate-800")}>
          {currentMonth.getFullYear()}년 {MONTHS[currentMonth.getMonth()]}
        </h2>
        <button
          type="button"
          onClick={goToNextMonth}
          className={cn("hover:bg-slate-100 rounded-full transition-colors", compact ? "p-1" : "p-2")}>
          <ChevronRight className={cn(compact ? "h-4 w-4" : "h-5 w-5", "text-slate-600")} />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((day, index) => (
          <div
            key={day}
            className={cn(
              "text-center font-medium",
              compact ? "text-xs py-1" : "text-sm py-2",
              index === 0 && "text-red-500",
              index === 6 && "text-blue-500",
              index !== 0 && index !== 6 && "text-slate-600",
            )}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className={cn("grid grid-cols-7", compact ? "gap-0.5" : "gap-1")}>
        {daysInMonth.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className={cn(compact ? "h-8" : "aspect-square")} />;
          }

          const isToday = isSameDay(date, today);
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const isPast = date < today && !isToday;
          const dayOfWeek = date.getDay();
          const hasSessions = sessionsOnDate.has(date.toDateString());

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => !isPast && onSelectDate(date)}
              disabled={isPast}
              className={cn(
                "flex flex-col items-center justify-center font-medium transition-all relative",
                compact ? "h-10 rounded-lg text-xs" : " rounded-xl text-sm",
                "hover:bg-slate-100",
                isPast && "text-slate-300 cursor-not-allowed hover:bg-transparent",
                isToday && !isSelected && "bg-slate-100 text-slate-900",
                isSelected && "bg-slate-700 text-white hover:bg-slate-800 shadow-md",
                dayOfWeek === 0 && !isPast && !isSelected && "text-red-500",
                dayOfWeek === 6 && !isPast && !isSelected && "text-blue-500",
              )}>
              <span>{date.getDate()}</span>
              {hasSessions && (
                <span
                  className={cn(
                    "absolute rounded-full",
                    compact ? "bottom-0.5 w-1 h-1" : "bottom-1 w-1.5 h-1.5",
                    isSelected ? "bg-white" : "bg-emerald-500",
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Date Sessions */}
      {selectedDate && selectedDateSessions.length > 0 && !compact && (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">
            {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 일정
          </h3>
          <div className="space-y-2">
            {selectedDateSessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => onSelectSession?.(session)}
                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-100 transition-all text-left">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Clock className="h-4 w-4 text-slate-500" />
                  <span>
                    {session.scheduled_at &&
                      new Date(session.scheduled_at).toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                  </span>
                  <span className="text-slate-400">|</span>
                  <span>{session.duration}분</span>
                </div>
                {session.location && (
                  <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{session.location}</span>
                  </div>
                )}
                <div className="mt-2 text-xs text-slate-500">
                  {session.instructor?.display_name || session.student?.display_name}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
