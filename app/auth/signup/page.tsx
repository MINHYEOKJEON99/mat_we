"use client"

import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { SPORT_LABELS, AVAILABLE_SPORTS } from "@/lib/database"
import type { Provider } from "@supabase/supabase-js"

const signupSchema = z
  .object({
    displayName: z.string().min(2, "닉네임은 최소 2자 이상이어야 합니다").max(20, "닉네임은 20자를 초과할 수 없습니다"),
    email: z.string().email("올바른 이메일 형식이 아닙니다"),
    password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다"),
    confirmPassword: z.string(),
    role: z.enum(["instructor", "student"], {
      required_error: "역할을 선택해주세요",
    }),
    interestedSports: z.array(z.string()).min(1, "최소 하나의 종목을 선택해주세요"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirmPassword"],
  })

type SignupFormData = z.infer<typeof signupSchema>

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<Provider | null>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: undefined,
      interestedSports: ["jiujitsu"],
    },
  })

  const handleSignup = async (data: SignupFormData) => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            display_name: data.displayName,
            role: data.role,
            interested_sports: data.interestedSports,
          },
        },
      })
      if (error) throw error
      router.push("/auth/signup-success")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "회원가입 중 오류가 발생했습니다")
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
      setError(error instanceof Error ? error.message : "소셜 로그인 중 오류가 발생했습니다")
      setSocialLoading(null)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Mat We</CardTitle>
            <CardDescription>주짓수 커뮤니티 가입하기</CardDescription>
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
                {socialLoading === "google" ? "진행 중..." : "Google로 시작하기"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 bg-[#FEE500] hover:bg-[#FDD800] text-black border-[#FEE500]"
                onClick={() => handleSocialLogin("kakao")}
                disabled={socialLoading !== null}
              >
                <KakaoIcon />
                {socialLoading === "kakao" ? "진행 중..." : "카카오로 시작하기"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 bg-[#03C75A] hover:bg-[#02B350] text-white border-[#03C75A]"
                onClick={() => handleSocialLogin("naver" as Provider)}
                disabled={socialLoading !== null}
              >
                <NaverIcon />
                {socialLoading === ("naver" as Provider) ? "진행 중..." : "네이버로 시작하기"}
              </Button>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">또는 이메일로 가입</span>
              </div>
            </div>

            {/* Email Signup Form */}
            <form onSubmit={handleSubmit(handleSignup)}>
              <div className="flex flex-col gap-4">
                {/* Display Name */}
                <div className="grid gap-2">
                  <Label htmlFor="displayName">닉네임</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="홍길동"
                    {...register("displayName")}
                  />
                  {errors.displayName && (
                    <p className="text-sm text-red-500">{errors.displayName.message}</p>
                  )}
                </div>

                {/* Email */}
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

                {/* Password */}
                <div className="grid gap-2">
                  <Label htmlFor="password">비밀번호</Label>
                  <Input id="password" type="password" {...register("password")} />
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password.message}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                  <Input id="confirmPassword" type="password" {...register("confirmPassword")} />
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Role Selection */}
                <div className="grid gap-3">
                  <Label>역할 선택</Label>
                  <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="grid gap-2"
                      >
                        <div className="flex items-center space-x-3 rounded-lg border p-3">
                          <RadioGroupItem value="student" id="student" />
                          <div className="grid gap-0.5">
                            <Label htmlFor="student" className="font-medium cursor-pointer">
                              수강생
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              강의를 수강하고 PT를 신청합니다
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 rounded-lg border p-3">
                          <RadioGroupItem value="instructor" id="instructor" />
                          <div className="grid gap-0.5">
                            <Label htmlFor="instructor" className="font-medium cursor-pointer">
                              강사
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              강의를 공유하고 PT를 제공합니다
                            </p>
                          </div>
                        </div>
                      </RadioGroup>
                    )}
                  />
                  {errors.role && (
                    <p className="text-sm text-red-500">{errors.role.message}</p>
                  )}
                </div>

                {/* Interested Sports */}
                <div className="grid gap-3">
                  <Label>관심 종목</Label>
                  <Controller
                    name="interestedSports"
                    control={control}
                    render={({ field }) => (
                      <div className="grid gap-2">
                        {AVAILABLE_SPORTS.map((sport) => (
                          <div
                            key={sport}
                            className="flex items-center space-x-3 rounded-lg border p-3"
                          >
                            <Checkbox
                              id={sport}
                              checked={field.value.includes(sport)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...field.value, sport])
                                } else {
                                  field.onChange(field.value.filter((s) => s !== sport))
                                }
                              }}
                            />
                            <Label htmlFor={sport} className="font-medium cursor-pointer">
                              {SPORT_LABELS[sport]}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                  {errors.interestedSports && (
                    <p className="text-sm text-red-500">{errors.interestedSports.message}</p>
                  )}
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "가입 중..." : "회원가입"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                이미 계정이 있으신가요?{" "}
                <Link href="/auth/login" className="underline underline-offset-4">
                  로그인
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
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
