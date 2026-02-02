"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { useState, useRef, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Camera, ArrowLeft, Loader2, UserCheck, Clock } from "lucide-react"
import { createClient } from "@/lib/client"
import { useMutation } from "@tanstack/react-query"
import Link from "next/link"
import { updateProfile } from "@/app/mypage/edit/actions"
import { AvatarCropper } from "@/components/profile/avatar-cropper"
import type { Profile } from "@/lib/database"

const editProfileSchema = z.object({
  displayName: z.string().min(2, "닉네임은 최소 2자 이상이어야 합니다").max(20, "닉네임은 20자를 초과할 수 없습니다"),
  bio: z.string().max(500, "소개글은 500자를 초과할 수 없습니다").optional(),
})

type EditProfileFormData = z.infer<typeof editProfileSchema>

interface EditProfileFormProps {
  initialProfile: Profile
}

export function EditProfileForm({ initialProfile }: EditProfileFormProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialProfile.avatar_url)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [cropperOpen, setCropperOpen] = useState(false)
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null)
  const [requestingInstructor, setRequestingInstructor] = useState(false)
  const [instructorRequestStatus, setInstructorRequestStatus] = useState<string | null>(null)
  const [requestedInstructor, setRequestedInstructor] = useState(initialProfile.requested_instructor)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await updateProfile(formData)
      if (result.error) {
        throw new Error(result.error)
      }
      return result
    },
    onSuccess: () => {
      setTimeout(() => {
        router.push("/mypage")
        router.refresh()
      }, 1000)
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      displayName: initialProfile.display_name || "",
      bio: initialProfile.bio || "",
    },
  })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setAvatarError("이미지 크기는 5MB를 초과할 수 없습니다")
        return
      }
      setAvatarError(null)
      // 크로퍼 열기
      const imageUrl = URL.createObjectURL(file)
      setOriginalImageSrc(imageUrl)
      setCropperOpen(true)
    }
    // input 초기화 (같은 파일 다시 선택 가능)
    e.target.value = ""
  }

  const handleCropComplete = (croppedFile: File) => {
    setAvatarFile(croppedFile)
    setAvatarUrl(URL.createObjectURL(croppedFile))
    // 원본 이미지 URL 정리
    if (originalImageSrc) {
      URL.revokeObjectURL(originalImageSrc)
      setOriginalImageSrc(null)
    }
  }

  const handleUpdateProfile = (data: EditProfileFormData) => {
    const formData = new FormData()
    formData.append("displayName", data.displayName)
    formData.append("bio", data.bio || "")
    formData.append("currentAvatarUrl", avatarUrl || "")

    if (avatarFile) {
      formData.append("avatar", avatarFile)
    }

    mutation.mutate(formData)
  }

  const userInitial = initialProfile.display_name?.charAt(0) || initialProfile.email?.charAt(0)?.toUpperCase() || "U"

  const handleRequestInstructor = async () => {
    setRequestingInstructor(true)
    setInstructorRequestStatus(null)

    try {
      // 이미 신청이 있는지 확인 (.maybeSingle()은 결과가 없어도 에러 안남)
      const { data: existingApp } = await supabase
        .from("instructor_applications")
        .select("id, status")
        .eq("user_id", initialProfile.id)
        .eq("status", "pending")
        .maybeSingle()

      if (existingApp) {
        setInstructorRequestStatus("이미 강사 신청이 진행 중입니다.")
        return
      }

      // 강사 신청 생성
      const { error: insertError } = await supabase
        .from("instructor_applications")
        .insert({
          user_id: initialProfile.id,
          status: "pending",
        })

      if (insertError) throw insertError

      // profiles에 requested_instructor 플래그 설정
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ requested_instructor: true })
        .eq("id", initialProfile.id)

      if (updateError) throw updateError

      setRequestedInstructor(true)
      setInstructorRequestStatus("강사 신청이 완료되었습니다. 관리자 승인을 기다려주세요.")
    } catch (error) {
      console.error("Instructor request error:", error)
      setInstructorRequestStatus("강사 신청 중 오류가 발생했습니다.")
    } finally {
      setRequestingInstructor(false)
    }
  }

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
                {avatarError && (
                  <p className="text-sm text-red-500">{avatarError}</p>
                )}
              </div>

              {/* Email (읽기 전용) */}
              <div className="grid gap-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  value={initialProfile.email || ""}
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

              {/* Role */}
              <div className="grid gap-2">
                <Label>역할</Label>
                <div className="flex items-center justify-between p-3 rounded-md bg-muted">
                  <span className="font-medium">
                    {initialProfile.role === "instructor" ? "강사" : "수강생"}
                  </span>
                  {initialProfile.role === "student" && (
                    <>
                      {requestedInstructor ? (
                        <div className="flex items-center gap-2 text-sm text-amber-600">
                          <Clock className="h-4 w-4" />
                          <span>강사 승인 대기 중</span>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleRequestInstructor}
                          disabled={requestingInstructor}
                        >
                          {requestingInstructor ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              신청 중...
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" />
                              강사 신청하기
                            </>
                          )}
                        </Button>
                      )}
                    </>
                  )}
                  {initialProfile.role === "instructor" && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <UserCheck className="h-4 w-4" />
                      <span>인증된 강사</span>
                    </div>
                  )}
                </div>
                {instructorRequestStatus && (
                  <p className={`text-sm ${instructorRequestStatus.includes("오류") ? "text-red-500" : "text-green-600"}`}>
                    {instructorRequestStatus}
                  </p>
                )}
                {initialProfile.role === "student" && !requestedInstructor && (
                  <p className="text-xs text-muted-foreground">
                    강사로 활동하시려면 신청 후 관리자 승인이 필요합니다
                  </p>
                )}
              </div>

              {mutation.error && (
                <p className="text-sm text-red-500">{mutation.error.message}</p>
              )}

              {mutation.isSuccess && (
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
                <Button type="submit" className="flex-1" disabled={mutation.isPending}>
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    "저장하기"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Avatar Cropper Dialog */}
      {originalImageSrc && (
        <AvatarCropper
          imageSrc={originalImageSrc}
          open={cropperOpen}
          onClose={() => {
            setCropperOpen(false)
            if (originalImageSrc) {
              URL.revokeObjectURL(originalImageSrc)
              setOriginalImageSrc(null)
            }
          }}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  )
}
