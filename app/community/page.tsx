import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";
import { CommunityPostList } from "@/components/community-post-list";

export default async function CommunityPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get all community posts with author info
  const { data: posts, count } = await supabase
    .from("community_posts")
    .select("*, author:profiles!community_posts_author_id_fkey(*)", { count: "exact" })
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Community Header */}
        <div className="border rounded-sm mb-4">
          <div className="p-4 flex gap-4">
            <div className="w-24 h-24 bg-muted rounded-sm flex items-center justify-center overflow-hidden text-3xl">
              🥋
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold mb-2">주짓수 커뮤니티</h1>
              <p className="text-sm text-muted-foreground">
                주짓수에 대한 경험과 지식을 자유롭게 공유하는 공간입니다.
              </p>
            </div>
          </div>
        </div>

        <CommunityPostList
          posts={posts || []}
          totalCount={count || 0}
        />
      </main>
    </div>
  );
}
