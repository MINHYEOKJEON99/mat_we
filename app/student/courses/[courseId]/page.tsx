"use client"

import { useState, useEffect, useMemo, use } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { VideoPlayer } from "@/components/course/video-player"
import { VideoList } from "@/components/course/video-list"
import { CourseComments } from "@/components/course/course-comments"
import type { CourseVideo } from "@/lib/database"

interface PageProps {
  params: Promise<{ courseId: string }>
}

export default function StudentCourseViewPage({ params }: PageProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { courseId } = use(params)

  const [userId, setUserId] = useState<string>("")
  const [course, setCourse] = useState<any>(null)
  const [videos, setVideos] = useState<CourseVideo[]>([])
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    async function loadData() {
      // Check auth
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      setUserId(user.id)

      // Check enrollment
      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("*")
        .eq("student_id", user.id)
        .eq("course_id", courseId)
        .single()

      if (!enrollment) {
        router.push(`/courses/${courseId}`)
        return
      }

      // Get course
      const { data: courseData } = await supabase
        .from("courses")
        .select("*, instructor:profiles!courses_instructor_id_fkey(*)")
        .eq("id", courseId)
        .single()

      if (!courseData) {
        router.push("/404")
        return
      }

      // Get videos
      const { data: videosData } = await supabase
        .from("course_videos")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index", { ascending: true })

      setCourse(courseData)
      setVideos(videosData || [])
      setLoading(false)
    }

    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    )
  }

  if (!course) {
    return null
  }

  const currentVideo = videos[currentVideoIndex]

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <h1 className="text-2xl font-bold mb-1">{course.title}</h1>
          <p className="text-sm text-muted-foreground">강사: {course.instructor?.display_name}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {currentVideo && currentVideo.mux_playback_id ? (
              <VideoPlayer playbackId={currentVideo.mux_playback_id} title={currentVideo.title} />
            ) : currentVideo && currentVideo.video_url ? (
              <div className="w-full rounded-lg overflow-hidden bg-black">
                <video
                  key={currentVideo.id}
                  controls
                  className="w-full aspect-video"
                  src={currentVideo.video_url}
                  title={currentVideo.title}
                >
                  <track kind="captions" />
                  브라우저가 비디오 태그를 지원하지 않습니다.
                </video>
              </div>
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

            <Card>
              <CardHeader>
                <CardTitle>강의 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentVideo && (
                  <div className="pb-4 border-b">
                    <h3 className="font-semibold mb-1">{currentVideo.title}</h3>
                    {currentVideo.description && (
                      <p className="text-sm text-muted-foreground mb-2">{currentVideo.description}</p>
                    )}
                    {currentVideo.duration && (
                      <p className="text-sm text-muted-foreground">
                        재생시간: {Math.floor(currentVideo.duration / 60)}분 {currentVideo.duration % 60}초
                      </p>
                    )}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold mb-2">강의 설명</h3>
                  <p className="text-muted-foreground leading-relaxed">{course.description}</p>
                </div>
              </CardContent>
            </Card>

            {userId && <CourseComments courseId={courseId} currentUserId={userId} />}
          </div>

          <div className="space-y-6">
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

            <VideoList
              videos={videos}
              courseId={courseId}
              currentVideoIndex={currentVideoIndex}
              onVideoSelect={setCurrentVideoIndex}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
