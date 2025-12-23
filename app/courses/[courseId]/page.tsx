import { createClient } from "@/lib/server";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { EnrollButton } from "@/components/enroll-button";

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
                <div className="space-y-2">
                  {videos.map((video, index) => (
                    <Card key={video.id}>
                      <CardHeader className="py-4">
                        <CardTitle className="text-base">
                          {index + 1}. {video.title}
                        </CardTitle>
                        {video.description && <CardDescription>{video.description}</CardDescription>}
                        {video.duration && (
                          <p className="text-sm text-muted-foreground">
                            {Math.floor(video.duration / 60)}분 {video.duration % 60}초
                          </p>
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
                  <p>• 평생 수강 가능</p>
                  <p>• {videos?.length || 0}개의 강의 영상</p>
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
