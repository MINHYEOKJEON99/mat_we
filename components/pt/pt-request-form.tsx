"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useFloatingChat } from "@/components/dm"
import { useGetOrCreateConversation, useSendDirectMessage } from "@/hooks/use-direct-messages"
import { formatPrice } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface PTRequestFormProps {
  instructorId: string
  studentId: string
  instructorName?: string
  ptPricePerSession?: number | null
}

export function PTRequestForm({
  instructorId,
  studentId,
  instructorName,
  ptPricePerSession,
}: PTRequestFormProps) {
  const [sessions, setSessions] = useState("1")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const floatingChat = useFloatingChat()
  const getOrCreateConversation = useGetOrCreateConversation()
  const sendMessage = useSendDirectMessage()

  const pricePerSession = ptPricePerSession || 0

  const handleSessionsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "")
    setSessions(value)
  }

  const totalPrice = () => {
    const sessionsNum = parseInt(sessions) || 0
    return sessionsNum * pricePerSession
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // 1. 대화방 생성 또는 가져오기
      const conversationId = await getOrCreateConversation.mutateAsync({
        partnerId: instructorId,
      })

      // 2. PT 신청 카드 메시지 생성
      const sessionsNum = parseInt(sessions) || 1
      const total = sessionsNum * pricePerSession

      const ptRequestMessage = `[PT 신청]
━━━━━━━━━━━━━━━━
📋 신청 내역
• 횟수: ${sessionsNum}회
• 1회 가격: ${formatPrice(pricePerSession)}원
• 총 금액: ${formatPrice(total)}원
━━━━━━━━━━━━━━━━
${notes ? `💬 요청사항\n${notes}\n━━━━━━━━━━━━━━━━` : ""}
PT 신청을 원합니다. 확인 부탁드립니다!`

      // 3. 메시지 전송
      await sendMessage.mutateAsync({
        conversationId,
        content: ptRequestMessage,
      })

      // 4. 채팅 열기
      floatingChat?.setActiveConversationId(conversationId)
      floatingChat?.openChat()

      setIsSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "PT 신청 중 오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="text-center py-4 space-y-2">
        <p className="text-green-600 font-medium">PT 신청이 전송되었습니다!</p>
        <p className="text-sm text-muted-foreground">채팅에서 강사님의 답변을 기다려주세요</p>
        <Button
          variant="outline"
          className="mt-2"
          onClick={() => {
            setIsSuccess(false)
            setSessions("1")
            setNotes("")
          }}
        >
          다시 신청하기
        </Button>
      </div>
    )
  }

  // PT 가격이 설정되지 않은 경우
  if (!ptPricePerSession) {
    return (
      <div className="text-center py-4 space-y-2">
        <p className="text-muted-foreground">강사가 아직 PT 가격을 설정하지 않았습니다</p>
        <p className="text-sm text-muted-foreground">메시지로 직접 문의해주세요</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 1회 가격 (고정) */}
      <div className="space-y-2">
        <Label>1회 가격</Label>
        <div className="p-3 bg-muted rounded-lg">
          <span className="font-semibold text-lg">{formatPrice(pricePerSession)}원</span>
          <span className="text-sm text-muted-foreground ml-2">/ 회 (60분)</span>
        </div>
      </div>

      {/* PT 횟수 */}
      <div className="space-y-2">
        <Label htmlFor="sessions">PT 횟수</Label>
        <div className="relative">
          <Input
            id="sessions"
            type="text"
            inputMode="numeric"
            placeholder="1"
            value={sessions}
            onChange={handleSessionsChange}
            className="pr-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            required
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            회
          </span>
        </div>
      </div>

      {/* 총 금액 표시 */}
      {parseInt(sessions) > 0 && (
        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">총 금액</span>
            <span className="font-bold text-xl text-primary">{formatPrice(totalPrice())}원</span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">요청사항 (선택)</Label>
        <Textarea
          id="notes"
          placeholder="강사님께 전달할 메시지를 입력하세요"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            신청 중...
          </>
        ) : (
          "PT 신청하기"
        )}
      </Button>
    </form>
  )
}
