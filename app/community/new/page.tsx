import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreatePostForm } from "@/components/create-post-form";

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
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>새 게시글 작성</CardTitle>
            <CardDescription>주짓수에 대한 경험과 지식을 공유하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <CreatePostForm authorId={user.id} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
