import { createClient } from "@/lib/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-2xl font-bold">
            Mat We
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/community">
              <Button variant="ghost">커뮤니티</Button>
            </Link>
            {profile.role === "instructor" ? (
              <Link href="/instructor/courses">
                <Button variant="ghost">내 강의</Button>
              </Link>
            ) : (
              <Link href="/student/courses">
                <Button variant="ghost">수강 중인 강의</Button>
              </Link>
            )}
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">환영합니다, {profile.display_name}님!</h1>
          <p className="text-muted-foreground">
            {profile.role === "instructor" ? "강사 대시보드입니다" : "수강생 대시보드입니다"}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>강의 둘러보기</CardTitle>
              <CardDescription>주짓수 강의를 찾아보세요</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/courses">강의 보기</Link>
              </Button>
            </CardContent>
          </Card>

          {profile.role === "instructor" ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>강의 관리</CardTitle>
                  <CardDescription>내 강의를 관리하고 새 강의를 추가하세요</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href="/instructor/courses">관리하기</Link>
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>PT 세션</CardTitle>
                  <CardDescription>PT 요청을 확인하세요</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href="/instructor/pt-sessions">세션 보기</Link>
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>수강 중인 강의</CardTitle>
                  <CardDescription>내가 수강 중인 강의를 확인하세요</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href="/student/courses">내 강의</Link>
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>PT 예약</CardTitle>
                  <CardDescription>PT 세션을 확인하세요</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href="/student/pt-sessions">세션 보기</Link>
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          <Card>
            <CardHeader>
              <CardTitle>커뮤니티</CardTitle>
              <CardDescription>주짓수 커뮤니티에 참여하세요</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/community">게시글 보기</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
