import { createClient } from "@/lib/server"
import { redirect, notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { EditPostForm } from "@/components/edit-post-form"

export default async function EditPostPage({ params }: { params: Promise<{ postId: string }> }) {
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
    .select("*")
    .eq("id", postId)
    .eq("author_id", user.id)
    .single()

  if (!post) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-2xl font-bold">
            Mat We
          </Link>
          <Button asChild variant="ghost">
            <Link href={`/community/${postId}`}>← 게시글로 돌아가기</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>게시글 수정</CardTitle>
            <CardDescription>게시글 내용을 수정하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <EditPostForm post={post} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
