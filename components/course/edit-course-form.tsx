"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Course, CourseVideo, Category } from "@/lib/database"
import {
  deleteCourseAction,
  updateCourseAction,
  createUploadUrl,
  createCourseVideoAction,
  updateCourseVideoAction,
  deleteCourseVideoAction
} from "@/app/instructor/courses/actions"
import { Loader2, AlertTriangle, ImagePlus, X, Video, Plus } from "lucide-react"
import Image from "next/image"

interface EditCourseFormProps {
  course: Course
  initialVideos: CourseVideo[]
  categories: Category[]
}

interface VideoItem {
  id: string
  dbId?: string // Database ID for existing videos
  title: string
  description?: string | null
  file?: File // New uploads
  video_url?: string // Existing videos
  preview?: string
  duration?: number
  order_index: number
  uploadProgress?: number
  uploaded?: boolean
  isExisting?: boolean // Flag to distinguish existing vs new
}

export function EditCourseForm({ course, initialVideos, categories }: EditCourseFormProps) {
  // Course info state
  const [title, setTitle] = useState(course.title)
  const [description, setDescription] = useState(course.description || "")
  const [price, setPrice] = useState(course.price.toString())
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">(course.level || "beginner")

  // Thumbnail state
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(course.thumbnail_url)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)

  // Category state
  const existingCategories = course.categories || []
  const level1Cat = existingCategories.find(c => c.level === 1)
  const level2Cat = existingCategories.find(c => c.level === 2)
  const [level1CategoryId, setLevel1CategoryId] = useState<string>(level1Cat?.id || "")
  const [level2CategoryId, setLevel2CategoryId] = useState<string>(level2Cat?.id || "")

  // Video state - convert existing videos to VideoItem format
  const [videos, setVideos] = useState<VideoItem[]>(
    initialVideos.map((v, index) => ({
      id: v.id,
      dbId: v.id,
      title: v.title,
      description: v.description,
      video_url: v.video_url || undefined,
      duration: v.duration || undefined,
      order_index: index,
      isExisting: true,
    }))
  )
  const videoInputRef = useRef<HTMLInputElement>(null)

  // UI state
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string>("")
  const [overallProgress, setOverallProgress] = useState<number>(0)

  const router = useRouter()

  // Filter categories by level
  const level1Categories = categories.filter(c => c.level === 1)
  const level2Categories = categories.filter(
    c => c.level === 2 && c.parent_id === level1CategoryId
  )

  // Reset level 2 when level 1 changes
  const handleLevel1Change = (value: string) => {
    setLevel1CategoryId(value)
    setLevel2CategoryId("")
  }

  /**
   * Presigned URL을 사용하여 Supabase Storage에 직접 업로드
   */
  const uploadFileWithPresignedUrl = async (
    file: File,
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<{ url: string; path: string } | { error: string }> => {
    try {
      // 1. Presigned URL 생성
      const urlResult = await createUploadUrl(file.name, file.type, userId)

      if ('error' in urlResult) {
        return { error: urlResult.error }
      }

      console.log(`[Upload] Got presigned URL, uploading ${file.name}...`)

      // 2. Presigned URL로 직접 업로드
      const uploadResponse = await fetch(urlResult.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
          'x-upsert': 'false',
        },
      })

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        console.error('[Upload] Upload failed:', uploadResponse.status, errorText)
        return { error: `업로드 실패: ${uploadResponse.statusText}` }
      }

      console.log(`[Upload] ✅ Upload successful: ${file.name}`)

      return {
        url: urlResult.publicUrl,
        path: urlResult.path,
      }
    } catch (error) {
      console.error('[Upload] Exception during upload:', error)
      return {
        error: error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다',
      }
    }
  }

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("이미지 크기는 5MB를 초과할 수 없습니다")
        return
      }
      // Revoke previous preview URL if it's a blob URL
      if (thumbnailPreview && thumbnailPreview.startsWith('blob:')) {
        URL.revokeObjectURL(thumbnailPreview)
      }
      setThumbnailFile(file)
      setThumbnailPreview(URL.createObjectURL(file))
    }
    e.target.value = ""
  }

  const handleRemoveThumbnail = () => {
    if (thumbnailPreview && thumbnailPreview.startsWith('blob:')) {
      URL.revokeObjectURL(thumbnailPreview)
    }
    setThumbnailFile(null)
    setThumbnailPreview(null)
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = ""
    }
  }

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      if (file.size > 500 * 1024 * 1024) {
        alert(`${file.name}: 영상 크기는 500MB를 초과할 수 없습니다`)
        return
      }

      const videoId = `new-${Date.now()}-${Math.random().toString(36).substring(7)}`
      const preview = URL.createObjectURL(file)

      // Get video duration
      const durationUrl = URL.createObjectURL(file)
      const videoEl = document.createElement("video")
      videoEl.preload = "metadata"
      videoEl.onloadedmetadata = () => {
        setVideos((prev) =>
          prev.map((v) =>
            v.id === videoId ? { ...v, duration: Math.round(videoEl.duration) } : v
          )
        )
        URL.revokeObjectURL(durationUrl)
      }
      videoEl.src = durationUrl

      setVideos((prev) => [
        ...prev,
        {
          id: videoId,
          title: file.name.replace(/\.[^/.]+$/, ""),
          file,
          preview,
          order_index: prev.length,
          isExisting: false,
        },
      ])
    })

    e.target.value = ""
  }

  const handleRemoveVideo = async (id: string) => {
    const video = videos.find((v) => v.id === id)
    if (!video) return

    // If it's an existing video, delete from DB
    if (video.isExisting && video.dbId) {
      if (!confirm(`"${video.title}" 영상을 삭제하시겠습니까?`)) return

      setIsLoading(true)
      const result = await deleteCourseVideoAction(video.dbId)
      setIsLoading(false)

      if ('error' in result) {
        setError(result.error)
        return
      }
    }

    // Remove from state
    setVideos((prev) => {
      if (video.preview) {
        URL.revokeObjectURL(video.preview)
      }
      return prev.filter((v) => v.id !== id)
    })
  }

  const handleVideoTitleChange = (id: string, newTitle: string) => {
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, title: newTitle } : v))
    )
  }

  const handleVideoDescriptionChange = (id: string, newDescription: string) => {
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, description: newDescription } : v))
    )
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Calculate total items for progress
      const newVideos = videos.filter(v => !v.isExisting)
      const totalItems = (thumbnailFile ? 1 : 0) + newVideos.length + 1 // +1 for course update
      let completedItems = 0

      const updateProgress = (status: string) => {
        completedItems++
        setUploadStatus(status)
        setOverallProgress(Math.round((completedItems / totalItems) * 100))
      }

      // Upload thumbnail if changed
      let thumbnailUrl = course.thumbnail_url
      if (thumbnailFile) {
        setUploadStatus("썸네일 업로드 중...")
        setOverallProgress(0)

        const uploadResult = await uploadFileWithPresignedUrl(
          thumbnailFile,
          course.instructor_id
        )

        if ('error' in uploadResult) {
          throw new Error(uploadResult.error)
        }

        thumbnailUrl = uploadResult.url
        updateProgress("썸네일 업로드 완료")
      }

      // Update course info
      setUploadStatus("강의 정보 수정 중...")
      const updateResult = await updateCourseAction(
        course.id,
        {
          title,
          description: description || null,
          price: Number.parseFloat(price),
          level,
          thumbnail_url: thumbnailUrl,
        },
        {
          level1CategoryId: level1CategoryId || undefined,
          level2CategoryId: level2CategoryId || undefined,
        }
      )

      if ('error' in updateResult) {
        throw new Error(updateResult.error)
      }

      updateProgress("강의 정보 수정 완료")

      // Update existing videos metadata
      const existingVideos = videos.filter(v => v.isExisting && v.dbId)
      for (const video of existingVideos) {
        await updateCourseVideoAction(video.dbId!, {
          title: video.title,
          description: video.description,
          order_index: video.order_index,
        })
      }

      // Upload new videos
      for (let i = 0; i < newVideos.length; i++) {
        const video = newVideos[i]
        if (!video.file) continue

        const videoSizeMB = (video.file.size / (1024 * 1024)).toFixed(1)
        setUploadStatus(`영상 ${i + 1}/${newVideos.length} 업로드 중... (${videoSizeMB}MB)`)

        // Show uploading state
        setVideos(prev => prev.map(v =>
          v.id === video.id ? { ...v, uploadProgress: 50 } : v
        ))

        try {
          const videoUploadResult = await uploadFileWithPresignedUrl(
            video.file,
            `courses/${course.id}`,
            (progress) => {
              setVideos(prev => prev.map(v =>
                v.id === video.id ? { ...v, uploadProgress: progress } : v
              ))
            }
          )

          if ('error' in videoUploadResult) {
            console.error(`[Video ${i + 1}] Upload failed:`, videoUploadResult.error)
            setVideos(prev => prev.map(v =>
              v.id === video.id ? { ...v, uploadProgress: undefined } : v
            ))
            continue
          }

          // Create video record
          const videoRecordResult = await createCourseVideoAction(course.id, {
            title: video.title || `영상 ${videos.length + i + 1}`,
            description: video.description || null,
            video_url: videoUploadResult.url,
            duration: video.duration || 0,
            order_index: video.order_index,
          })

          if ('error' in videoRecordResult) {
            console.error(`[Video ${i + 1}] Database insert failed:`, videoRecordResult.error)
          }

          setVideos(prev => prev.map(v =>
            v.id === video.id ? { ...v, uploaded: true, uploadProgress: 100 } : v
          ))
          updateProgress(`영상 ${i + 1} 업로드 완료`)
        } catch (error) {
          console.error(`[Video ${i + 1}] Upload error:`, error)
          setVideos(prev => prev.map(v =>
            v.id === video.id ? { ...v, uploadProgress: undefined } : v
          ))
        }
      }

      setUploadStatus("완료!")
      setOverallProgress(100)

      router.push("/instructor/courses")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "강의 수정 중 오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      const result = await deleteCourseAction(course.id)

      if ('error' in result) {
        setError(result.error)
        setIsDeleting(false)
        setDeleteDialogOpen(false)
        return
      }

      router.push("/instructor/courses")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "강의 삭제 중 오류가 발생했습니다")
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Section: Thumbnail + Course Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Thumbnail Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">썸네일</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {thumbnailPreview ? (
                <div className="relative aspect-video rounded-lg overflow-hidden border">
                  <Image
                    src={thumbnailPreview}
                    alt="썸네일 미리보기"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveThumbnail}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => thumbnailInputRef.current?.click()}
                  className="w-full aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground"
                >
                  <ImagePlus className="h-10 w-10" />
                  <span className="text-sm">클릭하여 썸네일 업로드</span>
                  <span className="text-xs">권장: 16:9 비율, 최대 5MB</span>
                </button>
              )}
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="hidden"
              />
              {thumbnailPreview && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => thumbnailInputRef.current?.click()}
                >
                  썸네일 변경
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Course Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">강의 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">강의 제목 *</Label>
              <Input
                id="title"
                placeholder="예: 기초 주짓수 완전정복"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">강의 설명</Label>
              <Textarea
                id="description"
                placeholder="강의에 대한 설명을 입력하세요"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category1">종목 (1차)</Label>
                <Select
                  value={level1CategoryId || ""}
                  onValueChange={handleLevel1Change}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="종목 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {level1Categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name_ko}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category2">포지션 (2차)</Label>
                <Select
                  value={level2CategoryId || ""}
                  onValueChange={setLevel2CategoryId}
                  disabled={!level1CategoryId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={level1CategoryId ? "포지션 선택" : "종목을 먼저 선택"} />
                  </SelectTrigger>
                  <SelectContent>
                    {level2Categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name_ko}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">가격 (원)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="50000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">난이도</Label>
                <Select
                  value={level}
                  onValueChange={(value: "beginner" | "intermediate" | "advanced") => setLevel(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">초급</SelectItem>
                    <SelectItem value="intermediate">중급</SelectItem>
                    <SelectItem value="advanced">고급</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Video Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Video className="h-5 w-5" />
            강의 영상
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Video Cards */}
            {videos.map((video, index) => (
              <Card
                key={video.id}
                className="overflow-hidden"
              >
                <div className="flex gap-4 p-4">
                  {/* Video Preview */}
                  <div className="relative w-32 h-24 flex-shrink-0 rounded-lg overflow-hidden border bg-black">
                    {video.preview ? (
                      <video
                        src={video.preview}
                        className="w-full h-full object-cover"
                      />
                    ) : video.video_url ? (
                      <div className="w-full h-full flex items-center justify-center text-white">
                        <Video className="h-8 w-8" />
                      </div>
                    ) : null}
                    {/* Order Badge */}
                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </div>
                    {/* Duration Badge */}
                    {video.duration && (
                      <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-xs">
                        {formatDuration(video.duration)}
                      </div>
                    )}
                    {/* Upload Progress Overlay */}
                    {video.uploadProgress !== undefined && video.uploadProgress < 100 && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                        <div className="text-white text-sm font-bold">
                          {video.uploadProgress}%
                        </div>
                      </div>
                    )}
                    {/* Uploaded Check */}
                    {video.uploaded && (
                      <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                          <span className="text-white text-sm">✓</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Video Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Label className="text-sm">영상 제목</Label>
                      {!isLoading && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVideo(video.id)}
                          className="p-1 hover:bg-destructive hover:text-destructive-foreground rounded transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <Input
                      value={video.title}
                      onChange={(e) => handleVideoTitleChange(video.id, e.target.value)}
                      placeholder="예: 가드 패스 기초"
                      className="text-sm"
                      disabled={isLoading}
                    />

                    <div>
                      <Label className="text-sm">영상 설명 (선택)</Label>
                      <Textarea
                        value={video.description || ""}
                        onChange={(e) => handleVideoDescriptionChange(video.id, e.target.value)}
                        placeholder="이 영상에서 배울 내용을 간단히 설명해주세요"
                        className="text-sm mt-1 resize-none"
                        rows={2}
                        disabled={isLoading}
                      />
                    </div>

                    {video.file && (
                      <p className="text-xs text-muted-foreground">
                        파일 크기: {(video.file.size / (1024 * 1024)).toFixed(1)}MB
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}

            {/* Add Video Button */}
            {!isLoading && (
              <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50 transition-colors">
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="w-full h-full min-h-[120px] flex flex-col items-center justify-center gap-2 text-muted-foreground p-8"
                >
                  <Plus className="h-8 w-8" />
                  <span className="text-sm font-medium">영상 추가</span>
                  <span className="text-xs">클릭하여 파일 선택</span>
                </button>
              </Card>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            MP4, WebM 지원 (최대 500MB) · 여러 영상을 한번에 선택할 수 있습니다
          </p>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            multiple
            onChange={handleVideoChange}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {isLoading && uploadStatus && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{uploadStatus}</span>
                <span>{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="destructive" disabled={isLoading || isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  삭제 중...
                </>
              ) : (
                "강의 삭제"
              )}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <DialogTitle>강의를 삭제하시겠습니까?</DialogTitle>
              </div>
              <DialogDescription className="pt-2">
                이 작업은 되돌릴 수 없습니다. 강의와 관련된 모든 데이터가 영구적으로 삭제됩니다:
                <ul className="mt-3 space-y-1 list-disc list-inside text-sm">
                  <li>강의 정보 및 썸네일</li>
                  <li>모든 영상 파일 및 콘텐츠</li>
                  <li>수강생 등록 기록</li>
                  <li>리뷰 및 평점</li>
                </ul>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                취소
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    삭제 중...
                  </>
                ) : (
                  "영구 삭제"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex-1 flex gap-4">
          <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => router.back()} disabled={isLoading || isDeleting}>
            취소
          </Button>
          <Button type="submit" className="flex-1" disabled={isLoading || isDeleting}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                저장 중...
              </>
            ) : (
              "저장"
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
