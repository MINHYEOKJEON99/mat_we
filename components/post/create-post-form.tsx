"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichEditor } from "@/components/editor/rich-editor";
import { LoadingOverlay } from "@/components/common/loading-overlay";
import { supabaseInsert } from "@/lib/api/client/supabase-rest";

interface CreatePostFormProps {
  authorId: string;
}

// Extract plain text from HTML for validation
const extractTextContent = (html: string): string => {
  if (typeof document === "undefined") return html;
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || "";
};

// Form validation schema
const formSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요.").max(100, "제목은 100자 이하로 입력해주세요."),
  content: z.string().refine(
    (val) => extractTextContent(val).trim().length > 0,
    { message: "내용을 입력해주세요." }
  ),
});

type FormValues = z.infer<typeof formSchema>;

export function CreatePostForm({ authorId }: CreatePostFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  const content = watch("content");

  // Extract first image URL from content
  const extractFirstImageUrl = (html: string): string | null => {
    const match = html.match(/<img[^>]+src="([^">]+)"/);
    return match ? match[1] : null;
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const imageUrl = extractFirstImageUrl(values.content);

      const result = await supabaseInsert<{ id: string }>("community_posts", {
        author_id: authorId,
        title: values.title.trim(),
        content: values.content,
        image_url: imageUrl,
      });

      if (result && result[0]) {
        router.push(`/community/${result[0].id}`);
      } else {
        throw new Error("게시글 작성 실패");
      }
    } catch (error: unknown) {
      setError("root", {
        message: error instanceof Error ? error.message : "게시글 작성 중 오류가 발생했습니다",
      });
    }
  };

  return (
    <>
      <LoadingOverlay isLoading={isSubmitting} message="글 작성중입니다..." />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        {/* Title Input */}
        <div className="border rounded-sm">
          <Input
            placeholder="제목을 입력해 주세요."
            {...register("title")}
            className="border-0 rounded-none h-12 text-base focus-visible:ring-0"
            maxLength={100}
            disabled={isSubmitting}
          />
        </div>

        {/* Title Error */}
        {errors.title && (
          <p className="text-sm text-red-500 -mt-2">{errors.title.message}</p>
        )}

        {/* Guidelines */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>※ 음란물, 차별, 비하, 혐오 및 초상권, 저작권 침해 게시물은 민, 형사상의 책임을 질 수 있습니다.</p>
        </div>

        {/* Rich Editor */}
        <RichEditor
          content={content}
          onChange={(value) => setValue("content", value, { shouldValidate: true })}
          userId={authorId}
          placeholder="내용을 입력하세요..."
        />

        {/* Content Error */}
        {errors.content && (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded border border-red-200">
            {errors.content.message}
          </div>
        )}

        {/* Root Error (submission errors) */}
        {errors.root && (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded border border-red-200">
            {errors.root.message}
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "등록 중..." : "등록"}
          </Button>
        </div>
      </form>
    </>
  );
}
