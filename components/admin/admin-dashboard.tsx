"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Check, X, LogOut, UserMinus } from "lucide-react";
import type { InstructorApplication, Profile } from "@/lib/database";

interface ApplicationWithUser extends Omit<InstructorApplication, 'user'> {
  user: Profile | null;
}

interface AdminDashboardProps {
  applications: ApplicationWithUser[];
  instructors: Profile[];
}

export function AdminDashboard({ applications, instructors }: AdminDashboardProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const router = useRouter();

  const pendingApplications = applications.filter((app) => app.status === "pending");
  const processedApplications = applications.filter((app) => app.status !== "pending");

  const handleAction = async (applicationId: string, action: "approve" | "reject") => {
    setProcessingId(applicationId);

    try {
      const res = await fetch("/api/admin/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, action }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "처리 실패");
      }

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "오류가 발생했습니다");
    } finally {
      setProcessingId(null);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const handleDemoteInstructor = async (userId: string) => {
    if (!confirm("정말로 이 강사를 수강생으로 변경하시겠습니까?")) {
      return;
    }

    setProcessingId(userId);

    try {
      const res = await fetch("/api/admin/demote-instructor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "처리 실패");
      }

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "오류가 발생했습니다");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">승인됨</Badge>;
      case "rejected":
        return <Badge variant="destructive">거절됨</Badge>;
      default:
        return <Badge variant="outline">대기중</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Mat We 관리자</h1>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            로그아웃
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Pending Applications */}
          <Card>
            <CardHeader>
              <CardTitle>강사 신청 대기</CardTitle>
              <CardDescription>
                {pendingApplications.length}건의 신청이 대기 중입니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingApplications.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  대기 중인 신청이 없습니다
                </p>
              ) : (
                <div className="space-y-4">
                  {pendingApplications.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={app.user?.avatar_url || undefined} />
                          <AvatarFallback>
                            {app.user?.display_name?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{app.user?.display_name || "알 수 없음"}</p>
                            <span className="text-muted-foreground">님의 강사 신청</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {app.user?.email} •{" "}
                            {formatDistanceToNow(new Date(app.created_at), {
                              addSuffix: true,
                              locale: ko,
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAction(app.id, "approve")}
                          disabled={processingId === app.id}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          승인
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(app.id, "reject")}
                          disabled={processingId === app.id}
                        >
                          <X className="h-4 w-4 mr-1" />
                          거절
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Processed Applications */}
          <Card>
            <CardHeader>
              <CardTitle>처리된 신청</CardTitle>
              <CardDescription>
                총 {processedApplications.length}건의 신청이 처리되었습니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              {processedApplications.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  처리된 신청이 없습니다
                </p>
              ) : (
                <div className="space-y-4">
                  {processedApplications.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-4 border rounded-lg opacity-70"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={app.user?.avatar_url || undefined} />
                          <AvatarFallback>
                            {app.user?.display_name?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{app.user?.display_name || "알 수 없음"}</p>
                            {getStatusBadge(app.status)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {app.user?.email} •{" "}
                            {formatDistanceToNow(new Date(app.updated_at), {
                              addSuffix: true,
                              locale: ko,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructors List */}
          <Card>
            <CardHeader>
              <CardTitle>강사 목록</CardTitle>
              <CardDescription>
                현재 {instructors.length}명의 강사가 활동 중입니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              {instructors.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  등록된 강사가 없습니다
                </p>
              ) : (
                <div className="space-y-4">
                  {instructors.map((instructor) => (
                    <div
                      key={instructor.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={instructor.avatar_url || undefined} />
                          <AvatarFallback>
                            {instructor.display_name?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{instructor.display_name || "알 수 없음"}</p>
                            <Badge className="bg-green-500">강사</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {instructor.email} •{" "}
                            {formatDistanceToNow(new Date(instructor.created_at), {
                              addSuffix: true,
                              locale: ko,
                            })}
                            에 가입
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDemoteInstructor(instructor.id)}
                        disabled={processingId === instructor.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        강사 해제
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
