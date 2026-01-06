"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useCreateEnrollment } from "@/hooks"

interface EnrollButtonProps {
  courseId: string
  studentId: string
}

export function EnrollButton({ courseId, studentId }: EnrollButtonProps) {
  const router = useRouter()
  const createEnrollment = useCreateEnrollment()

  const handleEnroll = async () => {
    try {
      await createEnrollment.mutateAsync({
        studentId,
        courseId,
      })

      router.push(`/student/courses/${courseId}`)
      router.refresh()
    } catch (error) {
      console.error("Enrollment error:", error)
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleEnroll} disabled={createEnrollment.isPending} className="w-full">
        {createEnrollment.isPending ? "처리 중..." : "지금 수강하기"}
      </Button>
      {createEnrollment.error && (
        <p className="text-sm text-red-500">
          {createEnrollment.error.message || "수강 신청 중 오류가 발생했습니다"}
        </p>
      )}
      <p className="text-xs text-muted-foreground text-center">결제 기능은 추후 추가될 예정입니다</p>
    </div>
  )
}
