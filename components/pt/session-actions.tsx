"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SessionActionsProps {
  sessionId: string
  currentStatus: string
}

export function SessionActions({ sessionId, currentStatus }: SessionActionsProps) {
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleConfirm = async () => {
    if (!scheduledDate || !scheduledTime) {
      setError("날짜와 시간을 선택해주세요")
      return
    }

    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`)

      const { error } = await supabase
        .from("pt_sessions")
        .update({
          status: "confirmed",
          scheduled_at: scheduledAt.toISOString(),
        })
        .eq("id", sessionId)

      if (error) throw error

      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "확정 중 오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    if (!confirm("정말로 이 PT 요청을 거절하시겠습니까?")) return

    const supabase = createClient()
    setIsLoading(true)

    try {
      const { error } = await supabase.from("pt_sessions").update({ status: "cancelled" }).eq("id", sessionId)

      if (error) throw error

      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "거절 중 오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  if (currentStatus !== "pending") return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>PT 일정 확정</CardTitle>
        <CardDescription>PT 일정을 확정하거나 거절하세요</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="date">날짜</Label>
          <Input id="date" type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="time">시간</Label>
          <Input id="time" type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-2">
          <Button onClick={handleReject} variant="outline" disabled={isLoading} className="flex-1 bg-transparent">
            거절
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading} className="flex-1">
            {isLoading ? "처리 중..." : "확정"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
