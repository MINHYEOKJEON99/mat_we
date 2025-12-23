import { createClient } from "@/lib/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function CoursesPage() {
  const supabase = await createClient();

  // Get all courses with instructor info
  const { data: courses } = await supabase
    .from("courses")
    .select("*, instructor:profiles!courses_instructor_id_fkey(*)")
    .order("created_at", { ascending: false });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is logged in, get their enrollments
  let enrolledCourseIds: string[] = [];
  if (user) {
    const { data: enrollments } = await supabase.from("enrollments").select("course_id").eq("student_id", user.id);
    enrolledCourseIds = enrollments?.map((e) => e.course_id) || [];
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">주짓수 강의</h1>
          <p className="text-muted-foreground">전문 강사의 고품질 주짓수 강의를 만나보세요</p>
        </div>

        {!courses || courses.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>아직 등록된 강의가 없습니다</CardTitle>
              <CardDescription>곧 새로운 강의가 추가될 예정입니다</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const isEnrolled = enrolledCourseIds.includes(course.id);
              return (
                <Card key={course.id} className="flex flex-col">
                  <CardHeader>
                    {course.thumbnail_url && (
                      <img
                        src={course.thumbnail_url || "/placeholder.svg"}
                        alt={course.title}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="line-clamp-1">{course.title}</CardTitle>
                      {isEnrolled && <Badge>수강중</Badge>}
                    </div>
                    <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col gap-2">
                    <div className="text-sm space-y-1">
                      <p className="text-muted-foreground">강사: {course.instructor?.display_name}</p>
                      <p className="text-muted-foreground">
                        레벨: {course.level === "beginner" ? "초급" : course.level === "intermediate" ? "중급" : "고급"}
                      </p>
                      <p className="font-semibold text-lg">{course.price.toLocaleString()}원</p>
                    </div>
                    <div className="mt-auto pt-4">
                      {isEnrolled ? (
                        <Button asChild className="w-full">
                          <Link href={`/student/courses/${course.id}`}>학습하기</Link>
                        </Button>
                      ) : (
                        <Button asChild className="w-full" variant={user ? "default" : "outline"}>
                          <Link href={user ? `/courses/${course.id}` : "/auth/login"}>
                            {user ? "자세히 보기" : "로그인하고 구매하기"}
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
