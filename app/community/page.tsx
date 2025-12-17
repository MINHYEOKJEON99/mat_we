import { createClient } from "@/lib/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { PlusCircle, MessageCircle, Heart } from "lucide-react"
import { redirect } from "next/navigation"

export default async function CommunityPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get all community posts with author info
  const { data: posts } = await supabase
    .from("community_posts")
    .select("*, author:profiles!community_posts_author_id_fkey(*)")
    .order("created_at", { ascending: false })

  // Get user's liked posts
  const { data: userLikes } = await supabase.from("post_likes").select("post_id").eq("user_id", user.id)

  const likedPostIds = new Set(userLikes?.map((like) => like.post_id) || [])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-2xl font-bold">
            Mat We
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost">대시보드</Button>
            </Link>
            <Link href="/courses">
              <Button variant="ghost">강의</Button>
            </Link>
            <Button asChild>
              <Link href="/community/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                글쓰기
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">커뮤니티</h1>
          <p className="text-muted-foreground">주짓수에 대한 경험과 지식을 공유하세요</p>
        </div>

        {!posts || posts.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>아직 게시글이 없습니다</CardTitle>
              <CardDescription>첫 번째 게시글을 작성해보세요!</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/community/new">글쓰기</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Link key={post.id} href={`/community/${post.id}`}>
                <Card className="hover:bg-accent cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="mb-2">{post.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{post.content}</CardDescription>
                      </div>
                      {post.image_url && (
                        <img
                          src={post.image_url || "/placeholder.svg"}
                          alt={post.title}
                          className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{post.author?.display_name}</span>
                      <span>•</span>
                      <span>
                        {new Date(post.created_at).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Heart className={`h-4 w-4 ${likedPostIds.has(post.id) ? "fill-current" : ""}`} />
                        {post.likes_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {post.comments_count}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
