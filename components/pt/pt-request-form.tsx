"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface PTRequestFormProps {
  instructorId: string
  studentId: string
}

export function PTRequestForm({ instructorId, studentId }: PTRequestFormProps) {
  const [duration, setDuration] = useState("60")
  const [price, setPrice] = useState("100000")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from("pt_sessions")
        .insert({
          instructor_id: instructorId,
          student_id: studentId,
          duration: Number.parseInt(duration),
          price: Number.parseFloat(price),
          notes: notes || null,
          status: "pending",
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/chat/${data.id}`)
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "PT 신청 중 오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="duration">시간 (분)</Label>
        <Input
          id="duration"
          type="number"
          placeholder="60"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">희망 가격 (원)</Label>
        <Input
          id="price"
          type="number"
          placeholder="100000"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">요청사항</Label>
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
        {isLoading ? "신청 중..." : "PT 신청하기"}
      </Button>
    </form>
  )
}
