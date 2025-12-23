import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const params = await searchParams

  const getErrorMessage = () => {
    if (params?.message) return params.message
    if (params?.error) {
      const errorMessages: Record<string, string> = {
        access_denied: "접근이 거부되었습니다",
        server_error: "서버 오류가 발생했습니다",
        temporarily_unavailable: "서비스가 일시적으로 사용 불가능합니다",
        invalid_request: "잘못된 요청입니다",
        unauthorized_client: "인증되지 않은 클라이언트입니다",
        unsupported_response_type: "지원하지 않는 응답 유형입니다",
      }
      return errorMessages[params.error] || `오류 코드: ${params.error}`
    }
    return "알 수 없는 오류가 발생했습니다"
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">오류가 발생했습니다</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">{getErrorMessage()}</p>
              <Button asChild className="w-full">
                <Link href="/auth/login">로그인 페이지로 이동</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
