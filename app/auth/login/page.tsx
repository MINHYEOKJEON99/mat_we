"use client"

import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import type { Provider } from "@supabase/supabase-js"

const loginSchema = z.object({
  email: z.string().email("올바른 이메일 형식이 아닙니다"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
})

type LoginFormData = z.infer<typeof loginSchema>

// Supabase 에러 메시지 한글 변환
function getErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return "로그인 중 오류가 발생했습니다"

  const message = error.message.toLowerCase()

  if (message.includes("invalid login credentials")) {
    return "이메일 또는 비밀번호가 올바르지 않습니다"
  }
  if (message.includes("email not confirmed")) {
    return "이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요"
  }
  if (message.includes("user not found")) {
    return "등록되지 않은 이메일입니다"
  }
  if (message.includes("too many requests")) {
    return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요"
  }
  if (message.includes("network")) {
    return "네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요"
  }
  if (message.includes("invalid email")) {
    return "올바른 이메일 형식이 아닙니다"
  }
  if (message.includes("password")) {
    return "비밀번호가 올바르지 않습니다"
  }

  return "로그인 중 오류가 발생했습니다"
}

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<Provider | null>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const handleLogin = async (data: LoginFormData) => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      if (error) throw error
      router.push("/")
      router.refresh()
    } catch (error: unknown) {
      setError(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: Provider) => {
    const supabase = createClient()
    setSocialLoading(provider)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error: unknown) {
      setError(getErrorMessage(error))
      setSocialLoading(null)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Mat We</CardTitle>
              <CardDescription>주짓수 커뮤니티에 로그인하세요</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Social Login Buttons */}
              <div className="flex flex-col gap-3 mb-6">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => handleSocialLogin("google")}
                  disabled={socialLoading !== null}
                >
                  <GoogleIcon />
                  {socialLoading === "google" ? "로그인 중..." : "Google로 계속하기"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 bg-[#FEE500] hover:bg-[#FDD800] text-black border-[#FEE500]"
                  onClick={() => handleSocialLogin("kakao")}
                  disabled={socialLoading !== null}
                >
                  <KakaoIcon />
                  {socialLoading === "kakao" ? "로그인 중..." : "카카오로 계속하기"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 bg-[#03C75A] hover:bg-[#02B350] text-white border-[#03C75A]"
                  onClick={() => handleSocialLogin("naver" as Provider)}
                  disabled={socialLoading !== null}
                >
                  <NaverIcon />
                  {socialLoading === ("naver" as Provider) ? "로그인 중..." : "네이버로 계속하기"}
                </Button>
              </div>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">또는</span>
                </div>
              </div>

              {/* Email Login Form */}
              <form onSubmit={handleSubmit(handleLogin)}>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">이메일</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">비밀번호</Label>
                    <Input id="password" type="password" {...register("password")} />
                    {errors.password && (
                      <p className="text-sm text-red-500">{errors.password.message}</p>
                    )}
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "로그인 중..." : "이메일로 로그인"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  계정이 없으신가요?{" "}
                  <Link href="/auth/signup" className="underline underline-offset-4">
                    회원가입
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

function KakaoIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 01-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z" />
    </svg>
  )
}

function NaverIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z" />
    </svg>
  )
}
