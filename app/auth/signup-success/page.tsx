import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function SignupSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">가입 완료!</CardTitle>
              <CardDescription>이메일을 확인해주세요</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                회원가입이 완료되었습니다. 이메일로 전송된 인증 링크를 클릭하여 계정을 활성화해주세요.
              </p>
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
