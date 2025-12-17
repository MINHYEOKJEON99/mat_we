import { createClient } from "@/lib/server"
import { redirect, notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { VideoPlayer } from "@/components/video-player"
import { VideoList } from "@/components/video-list"

export default async function StudentCourseViewPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if enrolled
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("*")
    .eq("student_id", user.id)
    .eq("course_id", courseId)
    .single()

  if (!enrollment) {
    redirect(`/courses/${courseId}`)
  }

  // Get course details
  const { data: course } = await supabase
    .from("courses")
    .select("*, instructor:profiles!courses_instructor_id_fkey(*)")
    .eq("id", courseId)
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

  const currentVideo = videos && videos.length > 0 ? videos[0] : null

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-2xl font-bold">
            Mat We
          </Link>
          <Button asChild variant="ghost">
            <Link href="/student/courses">← 내 강의</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <h1 className="text-2xl font-bold mb-1">{course.title}</h1>
          <p className="text-sm text-muted-foreground">강사: {course.instructor?.display_name}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {currentVideo && currentVideo.mux_playback_id ? (
              <VideoPlayer playbackId={currentVideo.mux_playback_id} title={currentVideo.title} />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-2">아직 영상이 준비되지 않았습니다</p>
                    <p className="text-sm text-muted-foreground">강사가 곧 영상을 업로드할 예정입니다</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentVideo && (
              <Card>
                <CardHeader>
                  <CardTitle>{currentVideo.title}</CardTitle>
                  {currentVideo.description && <CardDescription>{currentVideo.description}</CardDescription>}
                </CardHeader>
                {currentVideo.duration && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      재생시간: {Math.floor(currentVideo.duration / 60)}분 {currentVideo.duration % 60}초
                    </p>
                  </CardContent>
                )}
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>강의 설명</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{course.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>강사와 연결하기</CardTitle>
                <CardDescription>1:1 PT를 신청하고 개인 맞춤 트레이닝을 받으세요</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href={`/instructors/${course.instructor_id}`}>PT 신청하기</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div>
            <VideoList videos={videos || []} courseId={courseId} />
          </div>
        </div>
      </main>
    </div>
  )
}
