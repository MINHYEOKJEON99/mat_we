"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PTCalendar } from "@/components/pt";
import type { PTSession } from "@/lib/database";
import { Calendar as CalendarIcon } from "lucide-react";

interface PTSessionCalendarViewProps {
  sessions: PTSession[];
}

export function PTSessionCalendarView({ sessions }: PTSessionCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarIcon className="h-5 w-5" />
          PT 일정 캘린더
        </CardTitle>
      </CardHeader>
      <CardContent>
        <PTCalendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          sessions={sessions}
        />
      </CardContent>
    </Card>
  );
}
