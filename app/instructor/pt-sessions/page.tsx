import { createClient } from "@/lib/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default async function InstructorPTSessionsPage() {
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

  // Get PT sessions with student information
  const { data: sessions } = await supabase
    .from("pt_sessions")
    .select("*, student:profiles!pt_sessions_student_id_fkey(*)")
    .eq("instructor_id", user.id)
    .order("created_at", { ascending: false })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      confirmed: "default",
      completed: "outline",
      cancelled: "destructive",
    }
    const labels: Record<string, string> = {
      pending: "대기중",
      confirmed: "확정",
      completed: "완료",
      cancelled: "취소됨",
    }
    return <Badge variant={variants[status]}>{labels[status]}</Badge>
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-2xl font-bold">
            Mat We
          </Link>
          <Button asChild variant="ghost">
            <Link href="/dashboard">← 대시보드</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">PT 세션 관리</h1>
          <p className="text-muted-foreground">수강생의 PT 요청을 확인하고 관리하세요</p>
        </div>

        {!sessions || sessions.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>PT 세션이 없습니다</CardTitle>
              <CardDescription>아직 PT 요청이 없습니다</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sessions.map((session) => (
              <Card key={session.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{session.student?.display_name}님의 PT 요청</CardTitle>
                      <CardDescription className="mt-1">
                        {session.scheduled_at
                          ? `예정: ${new Date(session.scheduled_at).toLocaleString("ko-KR")}`
                          : "일정 미정"}
                      </CardDescription>
                    </div>
                    {getStatusBadge(session.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">시간:</span> {session.duration}분
                    </p>
                    <p>
                      <span className="font-medium">금액:</span> {session.price.toLocaleString()}원
                    </p>
                    {session.notes && (
                      <p>
                        <span className="font-medium">요청사항:</span> {session.notes}
                      </p>
                    )}
                  </div>
                  <div className="mt-4">
                    <Button asChild className="w-full">
                      <Link href={`/chat/${session.id}`}>채팅하기</Link>
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
