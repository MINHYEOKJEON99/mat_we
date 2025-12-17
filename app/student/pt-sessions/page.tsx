import { createClient } from "@/lib/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default async function StudentPTSessionsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get PT sessions with instructor information
  const { data: sessions } = await supabase
    .from("pt_sessions")
    .select("*, instructor:profiles!pt_sessions_instructor_id_fkey(*)")
    .eq("student_id", user.id)
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
          <h1 className="text-3xl font-bold mb-2">내 PT 세션</h1>
          <p className="text-muted-foreground">PT 신청 내역을 확인하세요</p>
        </div>

        {!sessions || sessions.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>PT 세션이 없습니다</CardTitle>
              <CardDescription>강사에게 PT를 신청해보세요</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/courses">강의 둘러보기</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sessions.map((session) => (
              <Card key={session.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{session.instructor?.display_name} 강사님과의 PT</CardTitle>
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
