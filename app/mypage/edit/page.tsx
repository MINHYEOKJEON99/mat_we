"use client"

import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Camera, ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { Profile } from "@/lib/database"

const editProfileSchema = z.object({
  displayName: z.string().min(2, "닉네임은 최소 2자 이상이어야 합니다").max(20, "닉네임은 20자를 초과할 수 없습니다"),
  bio: z.string().max(500, "소개글은 500자를 초과할 수 없습니다").optional(),
})

type EditProfileFormData = z.infer<typeof editProfileSchema>

export default function EditProfilePage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
  })

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single<Profile>()

      if (profileData) {
        setProfile(profileData)
        setAvatarUrl(profileData.avatar_url)
        reset({
          displayName: profileData.display_name || "",
          bio: profileData.bio || "",
        })
      }

      setIsCheckingAuth(false)
    }

    loadProfile()
  }, [router, reset])

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

  const handleUpdateProfile = async (data: EditProfileFormData) => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("인증 정보를 찾을 수 없습니다")

      // Upload avatar if changed
      const finalAvatarUrl = await uploadAvatar(user.id)

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          display_name: data.displayName,
          bio: data.bio || null,
          avatar_url: finalAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (profileError) throw profileError

      setSuccess(true)
      setTimeout(() => {
        router.push("/mypage")
        router.refresh()
      }, 1000)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "프로필 수정 중 오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  const userInitial = profile?.display_name?.charAt(0) || profile?.email?.charAt(0)?.toUpperCase() || "U"

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/mypage">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">프로필 수정</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>
            다른 사용자에게 보여지는 프로필 정보를 수정합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleUpdateProfile)}>
            <div className="flex flex-col gap-6">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarUrl || undefined} alt="프로필 사진" />
                    <AvatarFallback className="text-2xl">{userInitial}</AvatarFallback>
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
                <p className="text-sm text-muted-foreground">클릭하여 프로필 사진 변경</p>
              </div>

              {/* Email (읽기 전용) */}
              <div className="grid gap-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  이메일은 변경할 수 없습니다
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

              {/* Bio */}
              <div className="grid gap-2">
                <Label htmlFor="bio">소개글</Label>
                <Textarea
                  id="bio"
                  placeholder="자기소개를 입력하세요 (스킬, 경력, 관심사 등)"
                  rows={4}
                  {...register("bio")}
                />
                {errors.bio && (
                  <p className="text-sm text-red-500">{errors.bio.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  최대 500자
                </p>
              </div>

              {/* Role (읽기 전용) */}
              <div className="grid gap-2">
                <Label>역할</Label>
                <div className="flex items-center gap-2 p-3 rounded-md bg-muted">
                  <span className="font-medium">
                    {profile?.role === "instructor" ? "강사" : "수강생"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  역할 변경이 필요하시면 고객센터로 문의해주세요
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              {success && (
                <p className="text-sm text-green-600">프로필이 성공적으로 수정되었습니다!</p>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push("/mypage")}
                >
                  취소
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? "저장 중..." : "저장하기"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
