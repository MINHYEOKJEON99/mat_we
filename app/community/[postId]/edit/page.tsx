import { notFound } from "next/navigation";
import { EditPostForm } from "@/components/post/edit-post-form";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireAuth, getPostById } from "@/lib/api/server";

export default async function EditPostPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;

  const user = await requireAuth();

  // Get post details
  const post = await getPostById(postId);

  if (!post || post.author_id !== user.id) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Link
            href={`/community/${postId}`}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            게시글로 돌아가기
          </Link>
        </div>

        {/* Page Title */}
        <div className="border rounded-sm mb-4">
          <div className="p-4 border-b bg-muted/30">
            <h1 className="text-lg font-bold">글 수정</h1>
          </div>
          <div className="p-4">
            <EditPostForm post={post} authorId={user.id} />
          </div>
        </div>
      </main>
    </div>
  );
}
