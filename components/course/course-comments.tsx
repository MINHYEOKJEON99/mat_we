"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Loader2, Reply, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  parent_id: string | null;
  student: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
}

interface CourseCommentsProps {
  courseId: string;
  currentUserId: string;
}

export function CourseComments({ courseId, currentUserId }: CourseCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; authorName: string } | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  // 댓글을 부모/자식으로 구조화
  const rootComments = comments.filter((c) => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter((c) => c.parent_id === parentId);

  useEffect(() => {
    loadComments();
  }, [courseId]);

  async function loadComments() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("course_comments")
      .select(
        `
        id,
        content,
        created_at,
        updated_at,
        parent_id,
        student:profiles!course_comments_student_id_fkey(
          id,
          display_name,
          avatar_url
        )
      `
      )
      .eq("course_id", courseId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to load comments:", error);
    } else {
      setComments((data as any) || []);
    }
    setIsLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);

    const { error } = await supabase.from("course_comments").insert({
      course_id: courseId,
      student_id: currentUserId,
      content: newComment.trim(),
      parent_id: null,
    });

    if (error) {
      console.error("Failed to create comment:", error);
      alert("댓글 작성에 실패했습니다");
    } else {
      setNewComment("");
      await loadComments();
    }

    setIsSubmitting(false);
  }

  async function handleReplySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!replyContent.trim() || !replyTo) return;

    setIsSubmitting(true);

    const { error } = await supabase.from("course_comments").insert({
      course_id: courseId,
      student_id: currentUserId,
      content: replyContent.trim(),
      parent_id: replyTo.id,
    });

    if (error) {
      console.error("Failed to create reply:", error);
      alert("답글 작성에 실패했습니다");
    } else {
      setReplyContent("");
      setReplyTo(null);
      await loadComments();
    }

    setIsSubmitting(false);
  }

  async function handleDelete(commentId: string) {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;

    const { error } = await supabase.from("course_comments").delete().eq("id", commentId);

    if (error) {
      console.error("Failed to delete comment:", error);
      alert("댓글 삭제에 실패했습니다");
    } else {
      await loadComments();
    }
  }

  const handleReply = (commentId: string, authorName: string) => {
    setReplyTo({ id: commentId, authorName });
    setReplyContent("");
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div
      key={comment.id}
      className={`${isReply ? "ml-8 pl-4 border-l-2 border-muted relative before:content-[''] before:absolute before:left-0 before:top-5 before:w-4 before:h-[2px] before:bg-muted" : ""}`}
    >
      <div className="flex items-start justify-between gap-2 py-3">
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
                {comment.student.display_name?.[0] || "?"}
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
            {!isReply && (
              <button
                type="button"
                onClick={() => handleReply(comment.id, comment.student.display_name)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2"
              >
                <Reply className="h-3 w-3" />
                답글
              </button>
            )}
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

      {/* 답글 입력 폼 - 해당 댓글 바로 아래에 표시 */}
      {replyTo?.id === comment.id && (
        <div className="ml-11 mb-3">
          <form onSubmit={handleReplySubmit} className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <span className="font-medium text-foreground">{replyTo.authorName}</span>님에게 답글
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="ml-auto text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <Textarea
              placeholder="답글을 입력하세요..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={2}
              disabled={isSubmitting}
              autoFocus
              className="text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setReplyTo(null)}
              >
                취소
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !replyContent.trim()}
              >
                {isSubmitting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "답글 작성"
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* 대댓글 렌더링 */}
      {getReplies(comment.id).map((reply) => renderComment(reply, true))}
    </div>
  );

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
              {isSubmitting && !replyTo ? (
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
        ) : rootComments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">아직 댓글이 없습니다</p>
            <p className="text-xs text-muted-foreground mt-1">첫 번째 댓글을 작성해보세요!</p>
          </div>
        ) : (
          <div className="divide-y mt-4">{rootComments.map((comment) => renderComment(comment))}</div>
        )}
      </CardContent>
    </Card>
  );
}
