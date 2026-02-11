"use client";

import { useState } from "react";
import { Calendar, Clock, MapPin, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PTCalendar } from "./pt-calendar";
import { TimePicker } from "./time-picker";
import { AddressSearch } from "./address-search";
import { cn } from "@/lib/utils";
import type { PTSession } from "@/lib/database";

interface PTSchedulerProps {
  sessionId: string;
  sessions?: PTSession[];
  onConfirm: (data: { scheduledAt: string; endAt: string; location: string; locationDetail: string }) => Promise<void>;
  onCancel?: () => void;
  compact?: boolean; // 채팅창 내에서 사용 시
}

type Step = "date" | "time" | "location" | "confirm";

export function PTScheduler({ sessionId, sessions = [], onConfirm, onCancel, compact = false }: PTSchedulerProps) {
  const [step, setStep] = useState<Step>("date");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [locationDetail, setLocationDetail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps: { key: Step; label: string; icon: typeof Calendar }[] = [
    { key: "date", label: "날짜", icon: Calendar },
    { key: "time", label: "시간", icon: Clock },
    { key: "location", label: "장소", icon: MapPin },
    { key: "confirm", label: "확인", icon: Check },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  const canProceed = () => {
    switch (step) {
      case "date":
        return selectedDate !== null;
      case "time":
        return startTime !== "" && endTime !== "";
      case "location":
        return location !== "";
      case "confirm":
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex].key);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex].key);
    }
  };

  const handleConfirm = async () => {
    if (!selectedDate || !startTime || !endTime) return;

    setIsLoading(true);
    setError(null);

    try {
      const [startHours, startMinutes] = startTime.split(":").map(Number);
      const [endHours, endMinutes] = endTime.split(":").map(Number);

      const scheduledAt = new Date(selectedDate);
      scheduledAt.setHours(startHours, startMinutes, 0, 0);

      const endAt = new Date(selectedDate);
      endAt.setHours(endHours, endMinutes, 0, 0);

      await onConfirm({
        scheduledAt: scheduledAt.toISOString(),
        endAt: endAt.toISOString(),
        location,
        locationDetail,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "일정 확정 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (time: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const period = hour < 12 ? "오전" : "오후";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${period} ${displayHour}:${minutes}`;
  };

  const formatSelectedDateTime = () => {
    if (!selectedDate) return "";
    const dateStr = selectedDate.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
      weekday: "short",
    });
    if (!startTime || !endTime) return dateStr;
    return `${dateStr} ${formatTime(startTime)} ~ ${formatTime(endTime)}`;
  };

  // Compact 모드 (채팅창 내)
  if (compact) {
    return (
      <div className="space-y-3">
        {/* Step Indicator - Compact */}
        <div className="flex items-center justify-between bg-transparent rounded-lg p-2">
          {steps.map((s, index) => {
            const Icon = s.icon;
            const isCompleted = index < currentStepIndex;
            const isCurrent = s.key === step;

            return (
              <button
                key={s.key}
                type="button"
                onClick={() => index < currentStepIndex && setStep(s.key)}
                disabled={index > currentStepIndex}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full transition-all",
                  isCompleted && "bg-emerald-500 text-white",
                  isCurrent && "bg-slate-700 text-white",
                  !isCompleted && !isCurrent && "bg-slate-200 text-slate-400",
                )}>
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="max-h-[280px] overflow-y-auto">
          {/* Date Selection */}
          {step === "date" && (
            <PTCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} sessions={sessions} compact />
          )}

          {/* Time Selection */}
          {step === "time" && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">
                {selectedDate?.toLocaleDateString("ko-KR", {
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <TimePicker
                startTime={startTime}
                endTime={endTime}
                onStartTimeChange={setStartTime}
                onEndTimeChange={setEndTime}
              />
            </div>
          )}

          {/* Location Selection */}
          {step === "location" && (
            <AddressSearch
              value={location}
              detailValue={locationDetail}
              onChange={setLocation}
              onDetailChange={setLocationDetail}
              placeholder="장소 검색"
            />
          )}

          {/* Confirmation */}
          {step === "confirm" && (
            <div className="space-y-2">
              <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-700">{formatSelectedDateTime()}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-slate-500 mt-0.5" />
                  <div>
                    <p className="text-slate-700">{location}</p>
                    {locationDetail && <p className="text-slate-500 text-xs">{locationDetail}</p>}
                  </div>
                </div>
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          )}
        </div>

        {/* Navigation Buttons - Compact */}
        <div className="flex gap-2">
          {currentStepIndex > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="flex-1"
              disabled={isLoading}>
              이전
            </Button>
          ) : onCancel ? (
            <Button type="button" variant="outline" size="sm" onClick={onCancel} className="flex-1">
              취소
            </Button>
          ) : null}

          {step === "confirm" ? (
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              className="flex-1 bg-slate-700 hover:bg-slate-800"
              disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "확정"}
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={handleNext}
              className="flex-1 bg-slate-700 hover:bg-slate-800"
              disabled={!canProceed()}>
              다음
            </Button>
          )}
        </div>
      </div>
    );
  }

  // 기본 모드 (페이지 내)
  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">PT 일정 확정</CardTitle>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mt-4">
          {steps.map((s, index) => {
            const Icon = s.icon;
            const isCompleted = index < currentStepIndex;
            const isCurrent = s.key === step;

            return (
              <div key={s.key} className="flex items-center">
                <button
                  type="button"
                  onClick={() => index < currentStepIndex && setStep(s.key)}
                  disabled={index > currentStepIndex}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                    isCompleted && "bg-emerald-100 text-emerald-700 cursor-pointer hover:bg-emerald-200",
                    isCurrent && "bg-slate-700 text-white",
                    !isCompleted && !isCurrent && "bg-slate-100 text-slate-400 cursor-not-allowed",
                  )}>
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
                </button>
                {index < steps.length - 1 && (
                  <div className={cn("w-8 h-0.5 mx-1", index < currentStepIndex ? "bg-emerald-300" : "bg-slate-200")} />
                )}
              </div>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Date Selection */}
        {step === "date" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">PT 날짜를 선택하세요</p>
            <PTCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} sessions={sessions} />
          </div>
        )}

        {/* Time Selection */}
        {step === "time" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              {selectedDate?.toLocaleDateString("ko-KR", {
                month: "long",
                day: "numeric",
                weekday: "short",
              })}
              의 PT 시간을 선택하세요
            </p>
            <TimePicker
              startTime={startTime}
              endTime={endTime}
              onStartTimeChange={setStartTime}
              onEndTimeChange={setEndTime}
            />
          </div>
        )}

        {/* Location Selection */}
        {step === "location" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">PT 장소를 입력하세요</p>
            <AddressSearch
              value={location}
              detailValue={locationDetail}
              onChange={setLocation}
              onDetailChange={setLocationDetail}
              placeholder="PT 진행 장소 검색"
            />
          </div>
        )}

        {/* Confirmation */}
        {step === "confirm" && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">입력한 정보를 확인하세요</p>

            <div className="bg-slate-50 rounded-xl p-4 space-y-4">
              {/* Date & Time */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-200 rounded-lg">
                  <Calendar className="h-5 w-5 text-slate-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">날짜 및 시간</p>
                  <p className="text-sm text-slate-600">{formatSelectedDateTime()}</p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-200 rounded-lg">
                  <MapPin className="h-5 w-5 text-slate-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">장소</p>
                  <p className="text-sm text-slate-600">{location}</p>
                  {locationDetail && <p className="text-sm text-slate-500">{locationDetail}</p>}
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-2">
          {currentStepIndex > 0 && (
            <Button type="button" variant="outline" onClick={handleBack} className="flex-1" disabled={isLoading}>
              이전
            </Button>
          )}

          {onCancel && currentStepIndex === 0 && (
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              취소
            </Button>
          )}

          {step === "confirm" ? (
            <Button
              type="button"
              onClick={handleConfirm}
              className="flex-1 bg-slate-700 hover:bg-slate-800"
              disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  확정 중...
                </>
              ) : (
                "일정 확정하기"
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleNext}
              className="flex-1 bg-slate-700 hover:bg-slate-800"
              disabled={!canProceed()}>
              다음
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
