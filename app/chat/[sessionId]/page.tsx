import { createClient } from "@/lib/server"
import { redirect, notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ChatInterface } from "@/components/chat-interface"
import { SessionActions } from "@/components/session-actions"

export default async function ChatPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get PT session details
  const { data: session } = await supabase
    .from("pt_sessions")
    .select("*, instructor:profiles!pt_sessions_instructor_id_fkey(*), student:profiles!pt_sessions_student_id_fkey(*)")
    .eq("id", sessionId)
    .single()

  if (!session) {
    notFound()
  }

  // Check if user is part of this session
  if (session.instructor_id !== user.id && session.student_id !== user.id) {
    redirect("/dashboard")
  }

  const isInstructor = session.instructor_id === user.id
  const otherUser = isInstructor ? session.student : session.instructor

  // Get chat messages
  const { data: messages } = await supabase
    .from("chat_messages")
    .select("*, sender:profiles!chat_messages_sender_id_fkey(*)")
    .eq("pt_session_id", sessionId)
    .order("created_at", { ascending: true })

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
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-2xl font-bold">
            Mat We
          </Link>
          <Button asChild variant="ghost">
            <Link href={isInstructor ? "/instructor/pt-sessions" : "/student/pt-sessions"}>← PT 목록</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1 flex flex-col max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-3 flex-1">
          <div className="lg:col-span-2 flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{otherUser?.display_name}님과의 채팅</CardTitle>
                    <CardDescription>{isInstructor ? "수강생" : "강사"}님과 대화하세요</CardDescription>
                  </div>
                  {getStatusBadge(session.status)}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0">
                <ChatInterface sessionId={sessionId} userId={user.id} initialMessages={messages || []} />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>세션 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">상태</p>
                  <p className="font-medium">
                    {session.status === "pending"
                      ? "대기중"
                      : session.status === "confirmed"
                        ? "확정"
                        : session.status === "completed"
                          ? "완료"
                          : "취소됨"}
                  </p>
                </div>
                {session.scheduled_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">예정 일시</p>
                    <p className="font-medium">{new Date(session.scheduled_at).toLocaleString("ko-KR")}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">시간</p>
                  <p className="font-medium">{session.duration}분</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">금액</p>
                  <p className="font-medium">{session.price.toLocaleString()}원</p>
                </div>
                {session.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">요청사항</p>
                    <p className="font-medium text-sm">{session.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {isInstructor && session.status === "pending" && (
              <SessionActions sessionId={sessionId} currentStatus={session.status} />
            )}

            <Card>
              <CardHeader>
                <CardTitle>{otherUser?.display_name}</CardTitle>
                <CardDescription>{isInstructor ? "수강생" : "강사"}</CardDescription>
              </CardHeader>
              <CardContent>
                {otherUser?.bio && <p className="text-sm text-muted-foreground">{otherUser.bio}</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
