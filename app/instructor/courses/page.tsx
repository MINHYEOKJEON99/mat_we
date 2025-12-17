import { createClient } from "@/lib/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { PlusCircle } from "lucide-react"

export default async function InstructorCoursesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "instructor") {
    redirect("/dashboard")
  }

  // Get instructor's courses
  const { data: courses } = await supabase
    .from("courses")
    .select("*, course_videos(count)")
    .eq("instructor_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-2xl font-bold">
            Mat We
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost">대시보드</Button>
            </Link>
            <Link href="/community">
              <Button variant="ghost">커뮤니티</Button>
            </Link>
            <form
              action={async () => {
                "use server"
                const supabase = await createClient()
                await supabase.auth.signOut()
                redirect("/auth/login")
              }}
            >
              <Button type="submit" variant="outline">
                로그아웃
              </Button>
            </form>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">내 강의</h1>
            <p className="text-muted-foreground">강의를 관리하고 새로운 강의를 생성하세요</p>
          </div>
          <Button asChild>
            <Link href="/instructor/courses/new">
              <PlusCircle className="mr-2 h-4 w-4" />새 강의 만들기
            </Link>
          </Button>
        </div>

        {!courses || courses.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>아직 강의가 없습니다</CardTitle>
              <CardDescription>첫 번째 강의를 만들어보세요!</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/instructor/courses/new">강의 만들기</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.id} className="flex flex-col">
                <CardHeader>
                  {course.thumbnail_url && (
                    <img
                      src={course.thumbnail_url || "/placeholder.svg"}
                      alt={course.title}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  <CardTitle className="line-clamp-1">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-2">
                  <div className="text-sm text-muted-foreground">
                    <p>
                      레벨: {course.level === "beginner" ? "초급" : course.level === "intermediate" ? "중급" : "고급"}
                    </p>
                    <p>가격: {course.price.toLocaleString()}원</p>
                    <p>영상 수: {course.course_videos?.[0]?.count || 0}개</p>
                  </div>
                  <div className="flex gap-2 mt-auto pt-4">
                    <Button asChild variant="outline" className="flex-1 bg-transparent">
                      <Link href={`/instructor/courses/${course.id}`}>관리</Link>
                    </Button>
                    <Button asChild className="flex-1">
                      <Link href={`/instructor/courses/${course.id}/videos`}>영상</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
