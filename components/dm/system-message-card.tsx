"use client";

import { Calendar, MapPin, Clock, CreditCard, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MessageType, PTRequestMetadata, PTScheduleMetadata, MessageMetadata } from "@/lib/database";

export type SystemMessageType = "pt_request" | "pt_schedule";

interface SystemMessageCardProps {
  type: SystemMessageType;
  metadata: MessageMetadata;
  onAction?: () => void;
  isOwn?: boolean;
}

// 가격 포맷팅
function formatPrice(price: number): string {
  return price.toLocaleString("ko-KR") + "원";
}

// 메시지 타입 확인
export function isSystemMessage(type: MessageType | undefined): type is SystemMessageType {
  return type === "pt_request" || type === "pt_schedule";
}

export function SystemMessageCard({ type, metadata, onAction, isOwn }: SystemMessageCardProps) {
  if (type === "pt_request") {
    const ptMetadata = metadata as PTRequestMetadata | null;
    if (!ptMetadata) {
      console.warn("PT 신청 메타데이터 없음");
      return null;
    }

    return (
      <div className={cn("flex mb-3", isOwn ? "justify-end" : "justify-start")}>
        <div className="max-w-[320px] w-[85%]  from-slate-50 to-slate-100 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Header */}
          <div className="bg-slate-700 px-4 py-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-white" />
              <span className="text-white font-semibold text-sm">PT 신청</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">횟수</span>
                <span className="font-medium text-slate-800">{ptMetadata.sessions}회</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">1회 가격</span>
                <span className="font-medium text-slate-800">{formatPrice(ptMetadata.pricePerSession)}</span>
              </div>
              <div className="h-px bg-slate-200 my-2" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 font-medium">총 금액</span>
                <span className="font-bold text-slate-900 text-base">{formatPrice(ptMetadata.totalPrice)}</span>
              </div>
            </div>

            {ptMetadata.notes && (
              <div className="bg-white rounded-lg p-3 border border-slate-100">
                <p className="text-xs text-slate-500 mb-1">요청사항</p>
                <p className="text-sm text-slate-700">{ptMetadata.notes}</p>
              </div>
            )}

            {onAction && (
              <Button onClick={onAction} className="w-full bg-slate-700 hover:bg-slate-800 text-white" size="sm">
                PT 요청 확인하기
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (type === "pt_schedule") {
    const scheduleMetadata = metadata as PTScheduleMetadata | null;
    if (!scheduleMetadata) {
      console.warn("PT 일정 메타데이터 없음");
      return null;
    }

    const location = scheduleMetadata.locationDetail
      ? `${scheduleMetadata.location} (${scheduleMetadata.locationDetail})`
      : scheduleMetadata.location;

    return (
      <div className={cn("flex mb-3", isOwn ? "justify-end" : "justify-start")}>
        <div className="max-w-[320px] w-[85%] from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Header */}
          <div className="bg-emerald-600 px-4 py-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-white" />
              <span className="text-white font-semibold text-sm">PT 일정 확정</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            <div className="space-y-2">
              {scheduleMetadata.date && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  <span className="text-slate-700">{scheduleMetadata.date}</span>
                </div>
              )}
              {scheduleMetadata.startTime && (
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  <span className="text-slate-700">
                    {scheduleMetadata.startTime} ~ {scheduleMetadata.endTime}
                  </span>
                </div>
              )}
              {location && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  <span className="text-slate-700">{location}</span>
                </div>
              )}
            </div>

            {onAction && (
              <Button
                onClick={onAction}
                variant="outline"
                className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                size="sm">
                일정 확인하기
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
