"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Loader2, Reply, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { usePostComments, useCreateComment, useDeleteComment } from "@/hooks";

interface CommentSectionProps {
  postId: string;
  userId: string;
}

interface CommentWithAuthor {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  parent_id?: string | null;
  author: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
}

export function CommentSection({ postId, userId }: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; authorName: string } | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const { data: comments = [], isLoading: isLoadingComments } = usePostComments(postId);
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();

  // 댓글을 부모/자식으로 구조화
  const rootComments = (comments as CommentWithAuthor[]).filter((c) => !c.parent_id);
  const getReplies = (parentId: string) =>
    (comments as CommentWithAuthor[]).filter((c) => c.parent_id === parentId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await createComment.mutateAsync({
        post_id: postId,
        author_id: userId,
        content: newComment.trim(),
        parent_id: null,
      });
      setNewComment("");
    } catch (error) {
      console.error("Failed to create comment:", error);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !replyTo) return;

    try {
      await createComment.mutateAsync({
        post_id: postId,
        author_id: userId,
        content: replyContent.trim(),
        parent_id: replyTo.id,
      });
      setReplyContent("");
      setReplyTo(null);
    } catch (error) {
      console.error("Failed to create reply:", error);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;

    try {
      await deleteComment.mutateAsync({ commentId, postId });
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  const handleReply = (commentId: string, authorName: string) => {
    setReplyTo({ id: commentId, authorName });
    setReplyContent("");
  };

  const renderComment = (comment: CommentWithAuthor, isReply = false) => (
    <div
      key={comment.id}
      className={`${isReply ? "ml-8 pl-4 border-l-2 border-muted relative before:content-[''] before:absolute before:left-0 before:top-5 before:w-4 before:h-[2px] before:bg-muted" : ""}`}
    >
      <div className="flex items-start justify-between gap-2 py-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            {comment.author?.avatar_url ? (
              <img
                src={comment.author.avatar_url}
                alt={comment.author.display_name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold text-primary">
                {comment.author?.display_name?.[0] || "?"}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">{comment.author?.display_name || "익명"}</p>
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
                onClick={() => handleReply(comment.id, comment.author?.display_name || "익명")}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2"
              >
                <Reply className="h-3 w-3" />
                답글
              </button>
            )}
          </div>
        </div>
        {comment.author_id === userId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(comment.id)}
            disabled={deleteComment.isPending}
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
              disabled={createComment.isPending}
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
                disabled={createComment.isPending || !replyContent.trim()}
              >
                {createComment.isPending ? (
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

  const showLoading = isLoadingComments && comments.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>댓글 ({comments.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="댓글을 입력하세요..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            disabled={createComment.isPending}
          />
          {createComment.error && (
            <p className="text-sm text-destructive">
              {createComment.error.message || "댓글 작성 중 오류가 발생했습니다"}
            </p>
          )}
          <div className="flex justify-end">
            <Button type="submit" disabled={createComment.isPending || !newComment.trim()}>
              {createComment.isPending && !replyTo ? (
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
        {showLoading ? (
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
