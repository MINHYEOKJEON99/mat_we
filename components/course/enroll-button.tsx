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
    console.log("[EnrollButton] Starting enrollment:", { studentId, courseId })

    try {
      const result = await createEnrollment.mutateAsync({
        studentId,
        courseId,
      })

      console.log("[EnrollButton] Enrollment successful:", result)
      router.push(`/student/courses/${courseId}`)
      router.refresh()
    } catch (error) {
      console.error("[EnrollButton] Enrollment error:", error)
      if (error instanceof Error) {
        console.error("[EnrollButton] Error message:", error.message)
        console.error("[EnrollButton] Error stack:", error.stack)
      }
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleEnroll} disabled={createEnrollment.isPending} className="w-full">
        {createEnrollment.isPending ? "처리 중..." : "지금 수강하기"}
      </Button>
      {createEnrollment.error && (
        <div className="text-sm text-red-500 p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
          <p className="font-semibold mb-1">오류 발생</p>
          <p className="text-xs">{createEnrollment.error.message || "수강 신청 중 오류가 발생했습니다"}</p>
          {createEnrollment.error instanceof Error && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs">자세히 보기</summary>
              <pre className="text-xs mt-1 overflow-auto">
                {JSON.stringify(createEnrollment.error, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
      <p className="text-xs text-muted-foreground text-center">결제 기능은 추후 추가될 예정입니다</p>
    </div>
  )
}
