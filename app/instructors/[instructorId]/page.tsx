import { createClient } from "@/lib/server"
import { redirect, notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { PTRequestForm } from "@/components/pt-request-form"

export default async function InstructorProfilePage({ params }: { params: Promise<{ instructorId: string }> }) {
  const { instructorId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get instructor profile
  const { data: instructor } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", instructorId)
    .eq("role", "instructor")
    .single()

  if (!instructor) {
    notFound()
  }

  // Get instructor's courses
  const { data: courses } = await supabase.from("courses").select("*").eq("instructor_id", instructorId).limit(3)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-2xl font-bold">
            Mat We
          </Link>
          <Button asChild variant="ghost">
            <Link href="/courses">← 강의 목록</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{instructor.display_name}</CardTitle>
                <CardDescription>주짓수 강사</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{instructor.bio || "소개가 없습니다"}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>강의 목록</CardTitle>
              </CardHeader>
              <CardContent>
                {!courses || courses.length === 0 ? (
                  <p className="text-muted-foreground">아직 등록된 강의가 없습니다</p>
                ) : (
                  <div className="space-y-4">
                    {courses.map((course) => (
                      <Link key={course.id} href={`/courses/${course.id}`}>
                        <Card className="hover:bg-accent cursor-pointer">
                          <CardHeader className="py-4">
                            <CardTitle className="text-base">{course.title}</CardTitle>
                            <CardDescription className="line-clamp-1">{course.description}</CardDescription>
                            <p className="text-sm font-semibold">{course.price.toLocaleString()}원</p>
                          </CardHeader>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>PT 신청</CardTitle>
                <CardDescription>1:1 개인 트레이닝을 신청하세요</CardDescription>
              </CardHeader>
              <CardContent>
                <PTRequestForm instructorId={instructorId} studentId={user.id} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
