import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { requireAuth, getPTSessionsByStudent } from "@/lib/api/server";
import { MapPin, Clock, Calendar } from "lucide-react";
import { PTSessionCalendarView } from "./calendar-view";

export default async function StudentPTSessionsPage() {
  const user = await requireAuth();

  // Get PT sessions with instructor information
  const sessions = await getPTSessionsByStudent(user.id);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      confirmed: "default",
      completed: "outline",
      cancelled: "destructive",
    };
    const labels: Record<string, string> = {
      pending: "대기중",
      confirmed: "확정",
      completed: "완료",
      cancelled: "취소됨",
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const confirmedSessions = sessions?.filter((s) => s.status === "confirmed") || [];

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

        {/* Calendar View */}
        {confirmedSessions.length > 0 && (
          <div className="mb-8">
            <PTSessionCalendarView sessions={confirmedSessions} />
          </div>
        )}

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
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">시간:</span> {session.duration}분
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">금액:</span> {session.price.toLocaleString()}원
                    </div>
                    {session.location && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="font-medium">장소:</span> {session.location}
                          {session.location_detail && (
                            <span className="text-muted-foreground ml-1">
                              ({session.location_detail})
                            </span>
                          )}
                        </div>
                      </div>
                    )}
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
  );
}
