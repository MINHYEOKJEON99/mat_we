"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Course } from "@/lib/database"

interface EditCourseFormProps {
  course: Course
}

export function EditCourseForm({ course }: EditCourseFormProps) {
  const [title, setTitle] = useState(course.title)
  const [description, setDescription] = useState(course.description || "")
  const [price, setPrice] = useState(course.price.toString())
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">(course.level || "beginner")
  const [thumbnailUrl, setThumbnailUrl] = useState(course.thumbnail_url || "")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from("courses")
        .update({
          title,
          description,
          price: Number.parseFloat(price),
          level,
          thumbnail_url: thumbnailUrl || null,
        })
        .eq("id", course.id)

      if (error) throw error

      router.push("/instructor/courses")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "강의 수정 중 오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("정말로 이 강의를 삭제하시겠습니까?")) return

    const supabase = createClient()
    setIsLoading(true)

    try {
      const { error } = await supabase.from("courses").delete().eq("id", course.id)

      if (error) throw error

      router.push("/instructor/courses")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "강의 삭제 중 오류가 발생했습니다")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">강의 제목 *</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">강의 설명</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">가격 (원) *</Label>
        <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="level">난이도 *</Label>
        <Select value={level} onValueChange={(value: any) => setLevel(value)}>
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

      <div className="space-y-2">
        <Label htmlFor="thumbnail">썸네일 URL (선택)</Label>
        <Input id="thumbnail" type="url" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-4">
        <Button type="button" variant="destructive" onClick={handleDelete} disabled={isLoading}>
          삭제
        </Button>
        <div className="flex-1 flex gap-4">
          <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => router.back()}>
            취소
          </Button>
          <Button type="submit" className="flex-1" disabled={isLoading}>
            {isLoading ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>
    </form>
  )
}
