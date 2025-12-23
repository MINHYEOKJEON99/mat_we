"use client"

import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { SPORT_LABELS, AVAILABLE_SPORTS, type SportType, type UserRole } from "@/lib/database"
import { Camera } from "lucide-react"

const completeProfileSchema = z.object({
  displayName: z.string().min(2, "닉네임은 최소 2자 이상이어야 합니다").max(20, "닉네임은 20자를 초과할 수 없습니다"),
  role: z.enum(["instructor", "student"], {
    required_error: "역할을 선택해주세요",
  }),
  interestedSports: z.array(z.string()).min(1, "최소 하나의 종목을 선택해주세요"),
})

type CompleteProfileFormData = z.infer<typeof completeProfileSchema>

export default function CompleteProfilePage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [userEmail, setUserEmail] = useState<string>("")
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CompleteProfileFormData>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      displayName: "",
      role: undefined,
      interestedSports: ["jiujitsu"],
    },
  })

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Check if profile is already complete
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_profile_complete, avatar_url, display_name")
        .eq("id", user.id)
        .single()

      if (profile?.is_profile_complete) {
        router.push("/")
        return
      }

      // Set user info from OAuth
      setUserEmail(user.email || "")
      if (user.user_metadata?.avatar_url) {
        setAvatarUrl(user.user_metadata.avatar_url)
      }
      if (profile?.avatar_url) {
        setAvatarUrl(profile.avatar_url)
      }

      setIsCheckingAuth(false)
    }

    checkAuth()
  }, [router])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("이미지 크기는 5MB를 초과할 수 없습니다")
        return
      }
      setAvatarFile(file)
      setAvatarUrl(URL.createObjectURL(file))
    }
  }

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!avatarFile) return avatarUrl

    const supabase = createClient()
    const fileExt = avatarFile.name.split(".").pop()
    const fileName = `${userId}/avatar.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, avatarFile, { upsert: true })

    if (uploadError) {
      console.error("Avatar upload error:", uploadError)
      return avatarUrl
    }

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName)

    return publicUrl
  }

  const handleCompleteProfile = async (data: CompleteProfileFormData) => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("인증 정보를 찾을 수 없습니다")

      // Upload avatar if changed
      const finalAvatarUrl = await uploadAvatar(user.id)

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          email: user.email,
          display_name: data.displayName,
          role: data.role as UserRole,
          avatar_url: finalAvatarUrl,
          interested_sports: data.interestedSports as SportType[],
          is_profile_complete: true,
          updated_at: new Date().toISOString(),
        })

      if (profileError) throw profileError

      router.push("/")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "프로필 완성 중 오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">프로필 완성</CardTitle>
            <CardDescription>
              Mat We에 오신 것을 환영합니다!
              <br />
              서비스 이용을 위해 추가 정보를 입력해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(handleCompleteProfile)}>
              <div className="flex flex-col gap-6">
                {/* Avatar Upload */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={avatarUrl || undefined} alt="프로필 사진" />
                      <AvatarFallback className="text-2xl">
                        {userEmail?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-primary-foreground shadow-lg hover:bg-primary/90"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">프로필 사진 (선택)</p>
                </div>

                {/* Email (소셜 로그인 이메일 - 수정 불가) */}
                <div className="grid gap-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userEmail}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    소셜 로그인 계정의 이메일입니다
                  </p>
                </div>

                {/* Display Name */}
                <div className="grid gap-2">
                  <Label htmlFor="displayName">닉네임</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="활동할 닉네임을 입력하세요"
                    {...register("displayName")}
                  />
                  {errors.displayName && (
                    <p className="text-sm text-red-500">{errors.displayName.message}</p>
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
                          className={`flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                            field.value === "student" ? "border-primary bg-primary/5" : ""
                          }`}
                        >
                          <RadioGroupItem value="student" id="student" className="mt-1" />
                          <div className="grid gap-1">
                            <span className="font-medium">수강생</span>
                            <p className="text-sm text-muted-foreground">
                              강의를 수강하고 PT를 신청합니다
                            </p>
                          </div>
                        </label>
                        <label
                          htmlFor="instructor"
                          className={`flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                            field.value === "instructor" ? "border-primary bg-primary/5" : ""
                          }`}
                        >
                          <RadioGroupItem value="instructor" id="instructor" className="mt-1" />
                          <div className="grid gap-1">
                            <span className="font-medium">강사</span>
                            <p className="text-sm text-muted-foreground">
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
                            className="flex items-center space-x-3 rounded-lg border p-4"
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
                        <p className="text-sm text-muted-foreground">
                          * 추후 레슬링, 유도 등 다양한 종목이 추가될 예정입니다
                        </p>
                      </div>
                    )}
                  />
                  {errors.interestedSports && (
                    <p className="text-sm text-red-500">{errors.interestedSports.message}</p>
                  )}
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "저장 중..." : "프로필 완성하기"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
