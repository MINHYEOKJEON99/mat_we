import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ThumbsUp, MessageSquare, Plus } from "lucide-react"
import type { CommunityPost } from "@/lib/database"

export default async function MyPostsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // 작성한 게시글 전체 가져오기
  const { data: posts } = await supabase
    .from("community_posts")
    .select("*")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">작성한 게시글</h1>
        <Button asChild>
          <Link href="/community/new">
            <Plus className="h-4 w-4 mr-2" />
            새 게시글
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {posts && posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post: CommunityPost) => (
                <Link
                  key={post.id}
                  href={`/community/${post.id}`}
                  className="block p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1 min-w-0">
                      <h3 className="font-medium truncate">{post.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {post.content}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(post.created_at).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      {post.likes_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {post.comments_count}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">작성한 게시글이 없습니다</p>
              <Button asChild variant="outline">
                <Link href="/community/new">첫 게시글 작성하기</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
