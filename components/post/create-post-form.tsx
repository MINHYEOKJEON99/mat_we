"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichEditor } from "@/components/editor/rich-editor";
import { LoadingOverlay } from "@/components/common/loading-overlay";

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
    console.log("=== onSubmit START ===");
    console.log("Form values:", values);
    console.log("Author ID:", authorId);

    try {
      // Check environment variables
      console.log("ENV vars:", {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      });

      console.log("Creating Supabase client...");
      const supabase = createClient();
      console.log("Supabase client created:", supabase);

      const imageUrl = extractFirstImageUrl(values.content);
      console.log("Image URL:", imageUrl);

      const postData = {
        author_id: authorId,
        title: values.title.trim(),
        content: values.content,
        image_url: imageUrl,
      };
      console.log("Post data:", postData);

      // Get user session token directly from client
      console.log("Getting access token from client...");
      const accessToken = (supabase as any).changedAccessToken;
      console.log("Access token:", accessToken ? "EXISTS" : "MISSING");

      if (!accessToken) {
        throw new Error("인증 토큰이 없습니다. 다시 로그인해주세요.");
      }

      // Test with direct fetch using user token
      console.log("Testing direct fetch with user token...");
      const directFetchResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/community_posts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            "Authorization": `Bearer ${accessToken}`,
            "Prefer": "return=representation",
          },
          body: JSON.stringify(postData),
        }
      );
      console.log("Direct fetch response status:", directFetchResponse.status);
      const directData = await directFetchResponse.json();
      console.log("Direct fetch data:", directData);

      if (directFetchResponse.ok && directData && directData[0]) {
        console.log("Success via direct fetch!");
        router.push(`/community/${directData[0].id}`);
      } else {
        throw new Error(directData.message || "게시글 작성 실패");
      }
    } catch (error: unknown) {
      console.error("Catch block error:", error);
      setError("root", {
        message: error instanceof Error ? error.message : "게시글 작성 중 오류가 발생했습니다",
      });
    }
    console.log("=== onSubmit END ===");
  };

  return (
    <>
      <LoadingOverlay isLoading={isSubmitting} message="글 작성중입니다..." />
      <form
        onSubmit={(e) => {
          console.log("Form onSubmit event triggered");
          handleSubmit(onSubmit)(e);
        }}
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
