"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { PostComment } from "@/lib/database"

interface CommentSectionProps {
  postId: string
  userId: string
  initialComments: PostComment[]
}

export function CommentSection({ postId, userId, initialComments }: CommentSectionProps) {
  const [comments, setComments] = useState<PostComment[]>(initialComments)
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from("post_comments")
        .insert({
          post_id: postId,
          author_id: userId,
          content: newComment.trim(),
        })
        .select("*, author:profiles!post_comments_author_id_fkey(*)")
        .single()

      if (error) throw error

      setComments([...comments, data])
      setNewComment("")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "댓글 작성 중 오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm("정말로 이 댓글을 삭제하시겠습니까?")) return

    const supabase = createClient()

    try {
      const { error } = await supabase.from("post_comments").delete().eq("id", commentId)

      if (error) throw error

      setComments(comments.filter((c) => c.id !== commentId))
      router.refresh()
    } catch (error) {
      console.error("Failed to delete comment:", error)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>댓글 {comments.length}개</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="댓글을 입력하세요..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" disabled={isLoading || !newComment.trim()}>
              {isLoading ? "작성 중..." : "댓글 작성"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {comments.map((comment) => (
          <Card key={comment.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm">{comment.author?.display_name}</CardTitle>
                  <CardDescription>
                    {new Date(comment.created_at).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </CardDescription>
                </div>
                {comment.author_id === userId && (
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(comment.id)}>
                    삭제
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{comment.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
