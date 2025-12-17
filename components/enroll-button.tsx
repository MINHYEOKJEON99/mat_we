"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"

interface EnrollButtonProps {
  courseId: string
  studentId: string
}

export function EnrollButton({ courseId, studentId }: EnrollButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleEnroll = async () => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.from("enrollments").insert({
        student_id: studentId,
        course_id: courseId,
      })

      if (error) throw error

      router.push(`/student/courses/${courseId}`)
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "수강 신청 중 오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleEnroll} disabled={isLoading} className="w-full">
        {isLoading ? "처리 중..." : "지금 수강하기"}
      </Button>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <p className="text-xs text-muted-foreground text-center">결제 기능은 추후 추가될 예정입니다</p>
    </div>
  )
}
