"use client";

import { useState, useRef, useEffect } from "react";
import { Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  minTime?: string;
  maxTime?: string;
  interval?: number; // minutes
}

type TimeType = "start" | "end";

export function TimePicker({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  minTime = "06:00",
  maxTime = "23:00",
  interval = 30,
}: TimePickerProps) {
  const [activeType, setActiveType] = useState<TimeType | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate time slots
  const generateTimeSlots = (minTimeStr: string, maxTimeStr: string): string[] => {
    const slots: string[] = [];
    const [minHour, minMinute] = minTimeStr.split(":").map(Number);
    const [maxHour, maxMinute] = maxTimeStr.split(":").map(Number);

    let currentMinutes = minHour * 60 + minMinute;
    const endMinutes = maxHour * 60 + maxMinute;

    while (currentMinutes <= endMinutes) {
      const hours = Math.floor(currentMinutes / 60);
      const minutes = currentMinutes % 60;
      slots.push(`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`);
      currentMinutes += interval;
    }
    return slots;
  };

  const allTimeSlots = generateTimeSlots(minTime, maxTime);

  // End time slots should be after start time
  const endTimeSlots = startTime ? generateTimeSlots(startTime, maxTime).filter((t) => t > startTime) : allTimeSlots;

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveType(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDisplayTime = (time: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const period = hour < 12 ? "오전" : "오후";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${period} ${displayHour}:${minutes}`;
  };

  const handleTimeSelect = (time: string, type: TimeType) => {
    if (type === "start") {
      onStartTimeChange(time);
      // If end time is before or equal to new start time, clear it
      if (endTime && endTime <= time) {
        onEndTimeChange("");
      }
      // Automatically open end time picker
      setActiveType("end");
    } else {
      onEndTimeChange(time);
      setActiveType(null);
    }
  };

  const calculateDuration = () => {
    if (!startTime || !endTime) return null;
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    const durationMinutes = endHour * 60 + endMin - (startHour * 60 + startMin);
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    if (hours > 0 && minutes > 0) return `${hours}시간 ${minutes}분`;
    if (hours > 0) return `${hours}시간`;
    return `${minutes}분`;
  };

  return (
    <div ref={containerRef} className="relative space-y-3">
      {/* Time Selection Buttons */}
      <div className="flex items-center gap-2">
        {/* Start Time Button */}
        <button
          type="button"
          onClick={() => setActiveType(activeType === "start" ? null : "start")}
          className={cn(
            "flex-1 flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left",
            startTime
              ? "border-slate-300 bg-slate-50 hover:bg-slate-100"
              : "border-dashed border-slate-300 bg-white hover:border-slate-400",
            activeType === "start" && "border-slate-500 ring-2 ring-slate-200",
          )}>
          <Clock className={cn("h-4 w-4", startTime ? "text-slate-700" : "text-slate-400")} />
          <div className="flex-1 min-w-0">
            {startTime ? (
              <p className="text-sm font-medium text-slate-800">{formatDisplayTime(startTime)}</p>
            ) : (
              <p className="text-sm text-slate-500">시작 시간</p>
            )}
          </div>
        </button>

        <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />

        {/* End Time Button */}
        <button
          type="button"
          onClick={() => setActiveType(activeType === "end" ? null : "end")}
          disabled={!startTime}
          className={cn(
            "flex-1 flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left",
            endTime
              ? "border-slate-300 bg-slate-50 hover:bg-slate-100"
              : "border-dashed border-slate-300 bg-white hover:border-slate-400",
            activeType === "end" && "border-slate-500 ring-2 ring-slate-200",
            !startTime && "opacity-50 cursor-not-allowed",
          )}>
          <Clock className={cn("h-4 w-4", endTime ? "text-slate-700" : "text-slate-400")} />
          <div className="flex-1 min-w-0">
            {endTime ? (
              <p className="text-sm font-medium text-slate-800">{formatDisplayTime(endTime)}</p>
            ) : (
              <p className="text-sm text-slate-500">종료 시간</p>
            )}
          </div>
        </button>
      </div>

      {/* Duration Display */}
      {startTime && endTime && (
        <div className="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-50 rounded-lg">
          <span className="text-sm text-emerald-700 font-medium">총 {calculateDuration()}</span>
        </div>
      )}

      {/* Time Dropdown */}
      {activeType && (
        <div className="bg-white border border-slate-200 shadow-lg z-50 max-h-48 overflow-y-auto">
          <div className="sticky top-0 bg-slate-50 px-3 py-2 border-b">
            <p className="text-xs font-medium text-slate-600">
              {activeType === "start" ? "시작 시간 선택" : "종료 시간 선택"}
            </p>
          </div>
          <div className="p-2 grid grid-cols-3 gap-1">
            {(activeType === "start" ? allTimeSlots : endTimeSlots).map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => handleTimeSelect(time, activeType)}
                className={cn(
                  "py-4 px-2 rounded-lg text-xs font-medium transition-all",
                  (activeType === "start" ? startTime : endTime) === time
                    ? "bg-slate-700 text-white"
                    : "hover:bg-slate-100 text-slate-700",
                )}>
                {formatDisplayTime(time)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
