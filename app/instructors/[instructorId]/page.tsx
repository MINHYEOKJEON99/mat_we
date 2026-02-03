import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PTRequestForm } from "@/components/pt/pt-request-form"
import { MessageButton } from "@/components/dm/message-button"
import { requireAuth, getInstructorProfile, getCoursesByInstructor } from "@/lib/api/server"
import { formatPrice } from "@/lib/utils"
import { ArrowLeft, GraduationCap } from "lucide-react"

export default async function InstructorProfilePage({ params }: { params: Promise<{ instructorId: string }> }) {
  const { instructorId } = await params

  const user = await requireAuth()

  // Get instructor profile
  const instructor = await getInstructorProfile(instructorId)

  if (!instructor) {
    notFound()
  }

  // Get instructor's courses (limit 3)
  const allCourses = await getCoursesByInstructor(instructorId)
  const courses = allCourses.slice(0, 3)

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/instructors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            강사 목록
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Instructor Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Avatar */}
                  <Avatar className="h-24 w-24 shrink-0">
                    <AvatarImage src={instructor.avatar_url || undefined} alt={instructor.display_name} />
                    <AvatarFallback className="text-2xl">
                      {instructor.display_name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-2xl font-bold">{instructor.display_name}</h1>
                        <Badge variant="secondary">강사</Badge>
                      </div>
                      {instructor.pt_price_per_hour && (
                        <p className="text-lg font-semibold text-primary">
                          PT {formatPrice(instructor.pt_price_per_hour)}원 / 회
                        </p>
                      )}
                    </div>

                    {/* Message Button */}
                    {user.id !== instructorId && (
                      <MessageButton partnerId={instructorId} partnerName={instructor.display_name} />
                    )}
                  </div>
                </div>

                {/* Bio */}
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold mb-2">소개</h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {instructor.pt_description || instructor.bio || "소개가 없습니다"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Courses Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  <CardTitle>강의 목록</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {!courses || courses.length === 0 ? (
                  <p className="text-muted-foreground">아직 등록된 강의가 없습니다</p>
                ) : (
                  <div className="space-y-4">
                    {courses.map((course) => (
                      <Link key={course.id} href={`/courses/${course.id}`} className="block">
                        <Card className="hover:bg-accent/50 transition-colors cursor-pointer overflow-hidden">
                          <div className="flex gap-4 p-4">
                            {course.thumbnail_url && (
                              <div className="relative w-24 h-16 shrink-0 rounded overflow-hidden bg-muted">
                                <Image
                                  src={course.thumbnail_url}
                                  alt={course.title}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{course.title}</h4>
                              <p className="text-sm text-muted-foreground line-clamp-1">{course.description}</p>
                              <p className="text-sm font-semibold mt-1">{formatPrice(course.price)}원</p>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                    {allCourses.length > 3 && (
                      <Button asChild variant="outline" className="w-full">
                        <Link href={`/courses?instructor=${instructorId}`}>
                          모든 강의 보기 ({allCourses.length}개)
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - PT Request */}
          <div id="contact">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>PT 신청</CardTitle>
                <CardDescription>
                  {instructor.pt_price_per_hour
                    ? `${formatPrice(instructor.pt_price_per_hour)}원 / 회 (1회 60분)`
                    : "1:1 개인 트레이닝을 신청하세요"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PTRequestForm
                  instructorId={instructorId}
                  studentId={user.id}
                  instructorName={instructor.display_name}
                  ptPricePerSession={instructor.pt_price_per_hour}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
