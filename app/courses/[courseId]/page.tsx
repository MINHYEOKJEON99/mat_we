import { createClient } from "@/lib/server";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { EnrollButton } from "@/components/course/enroll-button";
import { Play, Lock, Clock } from "lucide-react";
import Image from "next/image";

export default async function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get course details
  const { data: course } = await supabase
    .from("courses")
    .select("*, instructor:profiles!courses_instructor_id_fkey(*)")
    .eq("id", courseId)
    .single();

  if (!course) {
    notFound();
  }

  // Check if already enrolled
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("*")
    .eq("student_id", user.id)
    .eq("course_id", courseId)
    .single();

  // Get course videos
  const { data: videos } = await supabase
    .from("course_videos")
    .select("*")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });

  if (enrollment) {
    redirect(`/student/courses/${courseId}`);
  }

  // Calculate total duration
  const totalDuration = videos?.reduce((acc, video) => acc + (video.duration || 0), 0) || 0;
  const totalHours = Math.floor(totalDuration / 3600);
  const totalMinutes = Math.floor((totalDuration % 3600) / 60);

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {course.thumbnail_url && (
              <img
                src={course.thumbnail_url || "/placeholder.svg"}
                alt={course.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            )}

            <div>
              <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
              <p className="text-muted-foreground leading-relaxed">{course.description}</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">강의 내용</h2>
              {!videos || videos.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">아직 추가된 영상이 없습니다</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {videos.map((video, index) => (
                    <Card key={video.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <div className="relative aspect-video bg-muted">
                        {/* Mux 썸네일 또는 기본 배경 */}
                        {video.mux_playback_id ? (
                          <Image
                            src={`https://image.mux.com/${video.mux_playback_id}/thumbnail.jpg?width=640&height=360&fit_mode=smartcrop`}
                            alt={video.title}
                            fill
                            className="object-cover"
                          />
                        ) : course.thumbnail_url ? (
                          <div />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="h-16 w-16 text-muted-foreground/30" />
                          </div>
                        )}

                        {/* 오버레이 */}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="text-center">
                            <Lock className="h-8 w-8 text-white mx-auto mb-2" />
                            <p className="text-white text-sm font-medium">수강 후 시청 가능</p>
                          </div>
                        </div>

                        {/* 순서 뱃지 */}
                        <div className="absolute top-2 left-2">
                          <Badge variant="secondary" className="bg-black/60 text-white border-0">
                            {index + 1}
                          </Badge>
                        </div>

                        {/* 재생시간 */}
                        {video.duration && (
                          <div className="absolute bottom-2 right-2">
                            <Badge
                              variant="secondary"
                              className="bg-black/60 text-white border-0 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, "0")}
                            </Badge>
                          </div>
                        )}
                      </div>

                      <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium line-clamp-2">
                          {index + 1}. {video.title}
                        </CardTitle>
                        {video.description && (
                          <CardDescription className="text-xs line-clamp-1">{video.description}</CardDescription>
                        )}
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{course.price.toLocaleString()}원</CardTitle>
                <CardDescription>
                  <Badge>
                    {course.level === "beginner" ? "초급" : course.level === "intermediate" ? "중급" : "고급"}
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <EnrollButton courseId={courseId} studentId={user.id} />
                <div className="text-sm text-muted-foreground space-y-2">
                  <p className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    {videos?.length || 0}개의 강의 영상
                  </p>
                  {totalDuration > 0 && (
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />총 {totalHours > 0 ? `${totalHours}시간 ` : ""}
                      {totalMinutes}분
                    </p>
                  )}
                  <p>• 평생 수강 가능</p>
                  <p>• 모바일/태블릿 지원</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>강사 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-semibold">{course.instructor?.display_name}</p>
                  {course.instructor?.bio && <p className="text-sm text-muted-foreground">{course.instructor.bio}</p>}
                  <Button asChild variant="outline" className="w-full mt-4 bg-transparent">
                    <Link href={`/instructors/${course.instructor_id}`}>PT 신청하기</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
