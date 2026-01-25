"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"

interface Comment {
  id: string
  content: string
  created_at: string
  updated_at: string
  student: {
    id: string
    display_name: string
    avatar_url: string | null
  }
}

interface CourseCommentsProps {
  courseId: string
  currentUserId: string
}

export function CourseComments({ courseId, currentUserId }: CourseCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadComments()
  }, [courseId])

  async function loadComments() {
    setIsLoading(true)
    const { data, error } = await supabase
      .from("course_comments")
      .select(`
        id,
        content,
        created_at,
        updated_at,
        student:profiles!course_comments_student_id_fkey(
          id,
          display_name,
          avatar_url
        )
      `)
      .eq("course_id", courseId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to load comments:", error)
    } else {
      setComments(data as any || [])
    }
    setIsLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim()) return

    setIsSubmitting(true)

    const { error } = await supabase
      .from("course_comments")
      .insert({
        course_id: courseId,
        student_id: currentUserId,
        content: newComment.trim(),
      })

    if (error) {
      console.error("Failed to create comment:", error)
      alert("댓글 작성에 실패했습니다")
    } else {
      setNewComment("")
      await loadComments()
    }

    setIsSubmitting(false)
  }

  async function handleDelete(commentId: string) {
    if (!confirm("댓글을 삭제하시겠습니까?")) return

    const { error } = await supabase
      .from("course_comments")
      .delete()
      .eq("id", commentId)

    if (error) {
      console.error("Failed to delete comment:", error)
      alert("댓글 삭제에 실패했습니다")
    } else {
      await loadComments()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>댓글 ({comments.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="강의에 대한 의견을 남겨주세요"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            disabled={isSubmitting}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  작성 중...
                </>
              ) : (
                "댓글 작성"
              )}
            </Button>
          </div>
        </form>

        {/* Comments List */}
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">아직 댓글이 없습니다</p>
            <p className="text-xs text-muted-foreground mt-1">첫 번째 댓글을 작성해보세요!</p>
          </div>
        ) : (
          <div className="space-y-4 mt-6">
            {comments.map((comment) => (
              <div key={comment.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {comment.student.avatar_url ? (
                        <img
                          src={comment.student.avatar_url}
                          alt={comment.student.display_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-primary">
                          {comment.student.display_name[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{comment.student.display_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), {
                            addSuffix: true,
                            locale: ko,
                          })}
                        </p>
                      </div>
                      <p className="text-sm mt-1 whitespace-pre-wrap break-words">{comment.content}</p>
                    </div>
                  </div>
                  {comment.student.id === currentUserId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(comment.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
