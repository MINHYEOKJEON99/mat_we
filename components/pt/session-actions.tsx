"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PTScheduler } from "./pt-scheduler";
import { updatePTSessionStatus } from "@/lib/api/client";
import type { PTSession } from "@/lib/database";

interface SessionActionsProps {
  sessionId: string;
  currentStatus: string;
  sessions?: PTSession[];
}

export function SessionActions({
  sessionId,
  currentStatus,
  sessions = [],
}: SessionActionsProps) {
  const [showScheduler, setShowScheduler] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleConfirm = async (data: {
    scheduledAt: string;
    location: string;
    locationDetail: string;
  }) => {
    await updatePTSessionStatus(
      sessionId,
      "confirmed",
      data.scheduledAt,
      data.location,
      data.locationDetail
    );
    router.refresh();
  };

  const handleReject = async () => {
    if (!confirm("정말로 이 PT 요청을 거절하시겠습니까?")) return;

    setIsLoading(true);
    setError(null);

    try {
      await updatePTSessionStatus(sessionId, "cancelled");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "거절 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  if (currentStatus !== "pending") return null;

  if (showScheduler) {
    return (
      <PTScheduler
        sessionId={sessionId}
        sessions={sessions}
        onConfirm={handleConfirm}
        onCancel={() => setShowScheduler(false)}
      />
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2">
        <Button
          onClick={handleReject}
          variant="outline"
          disabled={isLoading}
          className="flex-1 bg-transparent"
        >
          거절
        </Button>
        <Button
          onClick={() => setShowScheduler(true)}
          disabled={isLoading}
          className="flex-1 bg-slate-700 hover:bg-slate-800"
        >
          일정 확정하기
        </Button>
      </div>
    </div>
  );
}
