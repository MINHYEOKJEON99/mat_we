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
import { Eye, EyeOff } from "lucide-react"

const signupSchema = z
  .object({
    displayName: z.string().min(2, "닉네임은 최소 2자 이상이어야 합니다").max(20, "닉네임은 20자를 초과할 수 없습니다"),
    email: z.string().email("올바른 이메일 형식이 아닙니다"),
    password: z
      .string()
      .min(8, "비밀번호는 최소 8자 이상이어야 합니다")
      .regex(/[A-Z]/, "대문자를 포함해야 합니다")
      .regex(/[a-z]/, "소문자를 포함해야 합니다")
      .regex(/[!@#$%^&*(),.?":{}|<>]/, "특수문자를 포함해야 합니다"),
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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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
      // 이메일 중복 체크 (소셜 로그인으로 가입된 이메일인지 확인)
      const { data: existingUsers } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", data.email)
        .limit(1)

      if (existingUsers && existingUsers.length > 0) {
        throw new Error("이미 가입된 이메일입니다. 로그인 페이지에서 소셜 로그인을 이용해주세요.")
      }

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

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Mat We</CardTitle>
            <CardDescription>주짓수 커뮤니티 가입하기</CardDescription>
          </CardHeader>
          <CardContent>
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
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    8자 이상, 대문자, 소문자, 특수문자 포함
                  </p>
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password.message}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      {...register("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
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
                        <label
                          htmlFor="student"
                          className={`flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                            field.value === "student" ? "border-primary bg-primary/5" : ""
                          }`}
                        >
                          <RadioGroupItem value="student" id="student" />
                          <div className="grid gap-0.5">
                            <span className="font-medium">수강생</span>
                            <p className="text-xs text-muted-foreground">
                              강의를 수강하고 PT를 신청합니다
                            </p>
                          </div>
                        </label>
                        <label
                          htmlFor="instructor"
                          className={`flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                            field.value === "instructor" ? "border-primary bg-primary/5" : ""
                          }`}
                        >
                          <RadioGroupItem value="instructor" id="instructor" />
                          <div className="grid gap-0.5">
                            <span className="font-medium">강사</span>
                            <p className="text-xs text-muted-foreground">
                              강의를 공유하고 PT를 제공합니다
                            </p>
                          </div>
                        </label>
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
