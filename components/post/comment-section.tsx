"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { usePostComments, useCreateComment, useDeleteComment } from "@/hooks";

interface CommentSectionProps {
  postId: string;
  userId: string;
}

export function CommentSection({ postId, userId }: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");

  const { data: comments = [], isLoading: isLoadingComments } = usePostComments(postId);
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await createComment.mutateAsync({
        post_id: postId,
        author_id: userId,
        content: newComment.trim(),
      });
      setNewComment("");
    } catch (error) {
      console.error("Failed to create comment:", error);
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
              {createComment.isPending ? (
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
        {isLoadingComments ? (
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
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
