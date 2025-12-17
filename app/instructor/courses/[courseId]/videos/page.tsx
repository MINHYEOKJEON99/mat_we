import { createClient } from "@/lib/server"
import { redirect, notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { AddVideoForm } from "@/components/add-video-form"

export default async function CourseVideosPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .eq("instructor_id", user.id)
    .single()

  if (!course) {
    notFound()
  }

  // Get course videos
  const { data: videos } = await supabase
    .from("course_videos")
    .select("*")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true })

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-2xl font-bold">
            Mat We
          </Link>
          <Button asChild variant="ghost">
            <Link href="/instructor/courses">← 내 강의</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
          <p className="text-muted-foreground">강의 영상 관리</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>새 영상 추가</CardTitle>
              <CardDescription>Mux에서 생성한 영상 정보를 입력하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <AddVideoForm courseId={courseId} />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">영상 목록</h2>
            {!videos || videos.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">아직 추가된 영상이 없습니다</p>
                </CardContent>
              </Card>
            ) : (
              videos.map((video, index) => (
                <Card key={video.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {index + 1}. {video.title}
                        </CardTitle>
                        {video.description && <CardDescription className="mt-1">{video.description}</CardDescription>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {video.mux_playback_id && <p>Playback ID: {video.mux_playback_id}</p>}
                      {video.duration && (
                        <p>
                          재생시간: {Math.floor(video.duration / 60)}분 {video.duration % 60}초
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
