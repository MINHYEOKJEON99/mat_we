"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { CommunityPost } from "@/lib/database"

interface EditPostFormProps {
  post: CommunityPost
}

export function EditPostForm({ post }: EditPostFormProps) {
  const [title, setTitle] = useState(post.title)
  const [content, setContent] = useState(post.content)
  const [imageUrl, setImageUrl] = useState(post.image_url || "")
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
        .from("community_posts")
        .update({
          title,
          content,
          image_url: imageUrl || null,
        })
        .eq("id", post.id)

      if (error) throw error

      router.push(`/community/${post.id}`)
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "게시글 수정 중 오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("정말로 이 게시글을 삭제하시겠습니까?")) return

    const supabase = createClient()
    setIsLoading(true)

    try {
      const { error } = await supabase.from("community_posts").delete().eq("id", post.id)

      if (error) throw error

      router.push("/community")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "게시글 삭제 중 오류가 발생했습니다")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">제목 *</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">내용 *</Label>
        <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} rows={8} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">이미지 URL (선택)</Label>
        <Input id="image" type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-4">
        <Button type="button" variant="destructive" onClick={handleDelete} disabled={isLoading}>
          삭제
        </Button>
        <div className="flex-1 flex gap-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1 bg-transparent"
            onClick={() => router.push(`/community/${post.id}`)}
          >
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
