import { createClient } from "@/lib/server"
import { redirect, notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { PostActions } from "@/components/post-actions"
import { CommentSection } from "@/components/comment-section"

export default async function PostDetailPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get post details
  const { data: post } = await supabase
    .from("community_posts")
    .select("*, author:profiles!community_posts_author_id_fkey(*)")
    .eq("id", postId)
    .single()

  if (!post) {
    notFound()
  }

  // Check if user liked the post
  const { data: userLike } = await supabase
    .from("post_likes")
    .select("*")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .single()

  // Get comments
  const { data: comments } = await supabase
    .from("post_comments")
    .select("*, author:profiles!post_comments_author_id_fkey(*)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-2xl font-bold">
            Mat We
          </Link>
          <Button asChild variant="ghost">
            <Link href="/community">← 커뮤니티</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{post.title}</CardTitle>
            <CardDescription>
              {post.author?.display_name} •{" "}
              {new Date(post.created_at).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {post.image_url && (
              <img
                src={post.image_url || "/placeholder.svg"}
                alt={post.title}
                className="w-full max-h-96 object-cover rounded-lg"
              />
            )}

            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">{post.content}</p>
            </div>

            <PostActions postId={postId} userId={user.id} isLiked={!!userLike} likesCount={post.likes_count} />

            {post.author_id === user.id && (
              <div className="flex gap-2 pt-4 border-t">
                <Button asChild variant="outline" className="bg-transparent">
                  <Link href={`/community/${postId}/edit`}>수정</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8">
          <CommentSection postId={postId} userId={user.id} initialComments={comments || []} />
        </div>
      </main>
    </div>
  )
}
