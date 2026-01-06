"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { usePostComments, useCreateComment, useDeleteComment } from "@/hooks"

interface CommentSectionProps {
  postId: string
  userId: string
}

export function CommentSection({ postId, userId }: CommentSectionProps) {
  const [newComment, setNewComment] = useState("")

  const { data: comments = [], isLoading: isLoadingComments } = usePostComments(postId)
  const createComment = useCreateComment()
  const deleteComment = useDeleteComment()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      await createComment.mutateAsync({
        post_id: postId,
        author_id: userId,
        content: newComment.trim(),
      })
      setNewComment("")
    } catch (error) {
      console.error("Failed to create comment:", error)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm("정말로 이 댓글을 삭제하시겠습니까?")) return

    try {
      await deleteComment.mutateAsync({ commentId, postId })
    } catch (error) {
      console.error("Failed to delete comment:", error)
    }
  }

  if (isLoadingComments) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">댓글 로딩 중...</p>
      </div>
    )
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
            {createComment.error && (
              <p className="text-sm text-red-500">
                {createComment.error.message || "댓글 작성 중 오류가 발생했습니다"}
              </p>
            )}
            <Button type="submit" disabled={createComment.isPending || !newComment.trim()}>
              {createComment.isPending ? "작성 중..." : "댓글 작성"}
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(comment.id)}
                    disabled={deleteComment.isPending}
                  >
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
