"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichEditor } from "@/components/editor/rich-editor";
import { LoadingOverlay } from "@/components/common/loading-overlay";
import { Trash2 } from "lucide-react";

interface Post {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
}

interface EditPostFormProps {
  post: Post;
  authorId: string;
}

export function EditPostForm({ post, authorId }: EditPostFormProps) {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const router = useRouter();

  // Extract plain text from HTML for validation
  const extractTextContent = (html: string): string => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || "";
  };

  // Extract first image URL from content
  const extractFirstImageUrl = (html: string): string | null => {
    const match = html.match(/<img[^>]+src="([^">]+)"/);
    return match ? match[1] : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setLoadingMessage("글 수정중입니다...");
    setError(null);

    if (!title.trim()) {
      setError("제목을 입력해주세요.");
      setIsLoading(false);
      return;
    }

    const textContent = extractTextContent(content);
    if (!textContent.trim()) {
      setError("내용을 입력해주세요.");
      setIsLoading(false);
      return;
    }

    try {
      const imageUrl = extractFirstImageUrl(content);

      const { error } = await supabase
        .from("community_posts")
        .update({
          title: title.trim(),
          content: content,
          image_url: imageUrl,
        })
        .eq("id", post.id);

      if (error) throw error;

      router.push(`/community/${post.id}`);
      router.refresh();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "게시글 수정 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말로 이 게시글을 삭제하시겠습니까?")) return;

    const supabase = createClient();
    setIsLoading(true);
    setLoadingMessage("글 삭제중입니다...");

    try {
      const { error } = await supabase.from("community_posts").delete().eq("id", post.id);

      if (error) throw error;

      router.push("/community");
      router.refresh();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "게시글 삭제 중 오류가 발생했습니다");
      setIsLoading(false);
    }
  };

  return (
    <>
      <LoadingOverlay isLoading={isLoading} message={loadingMessage} />
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title Input */}
        <div className="border rounded-sm">
        <Input
          placeholder="제목을 입력해 주세요."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border-0 rounded-none h-12 text-base focus-visible:ring-0"
          maxLength={100}
        />
      </div>

      {/* Guidelines */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>※ 음란물, 차별, 비하, 혐오 및 초상권, 저작권 침해 게시물은 민, 형사상의 책임을 질 수 있습니다.</p>
      </div>

      {/* Rich Editor */}
      <RichEditor
        content={content}
        onChange={setContent}
        userId={authorId}
        placeholder="내용을 입력하세요..."
      />

      {/* Error Message */}
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 rounded border border-red-200">
          {error}
        </div>
      )}

      {/* Submit Buttons */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="destructive"
          onClick={handleDelete}
          disabled={isLoading}
        >
          <Trash2 className="mr-1 h-4 w-4" />
          삭제
        </Button>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/community/${post.id}`)}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "저장 중..." : "저장"}
          </Button>
        </div>
        </div>
      </form>
    </>
  );
}
