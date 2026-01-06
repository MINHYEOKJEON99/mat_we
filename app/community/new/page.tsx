import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";
import { CreatePostForm } from "@/components/create-post-form";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function NewPostPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Link
            href="/community"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            목록으로
          </Link>
        </div>

        {/* Page Title */}
        <div className="border rounded-sm mb-4">
          <div className="p-4 border-b bg-muted/30">
            <h1 className="text-lg font-bold">글쓰기</h1>
          </div>
          <div className="p-4">
            <CreatePostForm authorId={user.id} />
          </div>
        </div>
      </main>
    </div>
  );
}
