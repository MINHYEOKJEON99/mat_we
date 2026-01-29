"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Star, Play } from "lucide-react"
import type { Course, Profile } from "@/lib/database"

type EnrollmentWithCourse = {
  id: string
  student_id: string
  course_id: string
  enrolled_at: string
}

type CourseWithInstructor = Course & {
  instructor: Pick<Profile, "id" | "display_name" | "avatar_url"> | null
}

interface EnrolledCourseCardProps {
  enrollment: EnrollmentWithCourse
  course: CourseWithInstructor
}

export function EnrolledCourseCard({ enrollment, course }: EnrolledCourseCardProps) {
  // Generate stable progress based on enrollment ID
  // TODO: Replace with actual progress tracking when implemented
  const hashCode = enrollment.id.split("").reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  const progress = Math.abs(hashCode) % 101
  const rating = course.average_rating || 0

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= Math.round(rating)
                ? "fill-yellow-400 text-yellow-400"
                : "fill-muted text-muted"
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="group relative">
      <Link href={`/student/courses/${course.id}`}>
        <Card className="overflow-hidden hover:shadow-lg transition-shadow">
          {/* Thumbnail */}
          <div className="relative aspect-video bg-muted">
            {course.thumbnail_url ? (
              <Image
                src={course.thumbnail_url}
                alt={course.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <Play className="h-12 w-12 text-muted-foreground/50" />
              </div>
            )}

            {/* Menu Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/student/courses/${course.id}`}>
                    학습 계속하기
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/courses/${course.id}`}>
                    강의 상세보기
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Content */}
          <CardContent className="p-4">
            <h3 className="font-semibold line-clamp-2 mb-1 min-h-[48px]">
              {course.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
              {course.instructor?.display_name || "강사 정보 없음"}
            </p>

            {/* Progress Bar */}
            <div className="mb-3">
              <Progress value={progress} className="h-1" />
            </div>

            {/* Progress & Rating */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-primary">
                {progress}% 완료
              </span>
              <div className="flex items-center gap-1">
                {renderStars(rating)}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}
