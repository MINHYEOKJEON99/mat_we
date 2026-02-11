import { createClient } from "@/lib/server"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PostActions } from "@/components/post/post-actions"
import { CommentSection } from "@/components/post/comment-section"
import { RichViewer } from "@/components/editor/rich-viewer"
import { Eye, MessageCircle, ThumbsUp, List } from "lucide-react"
import { requireAuth, getPostById } from "@/lib/api/server"

export default async function PostDetailPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params
  const supabase = await createClient()

  const user = await requireAuth()

  // Increment view count
  try {
    await supabase.rpc("increment_views", { post_id: postId })
  } catch {
    // Fallback: direct update if RPC doesn't exist
    await supabase
      .from("community_posts")
      .update({ views_count: 1 })
      .eq("id", postId)
  }

  // Get post details
  const post = await getPostById(postId)

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Post Header */}
        <div className="border rounded-sm">
          {/* Title Section */}
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold mb-2">{post.title}</h1>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="font-medium text-foreground">{post.author?.display_name || "익명"}</span>
                <span>{formatDate(post.created_at)}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {post.views_count || 0}
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  {post.likes_count || 0}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {post.comments_count || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-4 min-h-[300px]">
            <RichViewer
              content={post.content}
              className="[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_video]:max-w-full [&_video]:h-auto [&_video]:rounded"
            />
          </div>

          {/* Action Section */}
          <div className="p-4 border-t">
            <PostActions postId={postId} userId={user.id} isLiked={!!userLike} likesCount={post.likes_count} />
          </div>

          {/* Author Actions */}
          {post.author_id === user.id && (
            <div className="px-4 pb-4 flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/community/${postId}/edit`}>수정</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between py-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/community">
              <List className="mr-1 h-4 w-4" />
              목록
            </Link>
          </Button>
        </div>

        {/* Comments Section */}
        <CommentSection postId={postId} userId={user.id} />
      </main>
    </div>
  )
}
