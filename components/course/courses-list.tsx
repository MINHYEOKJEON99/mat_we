"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StarRating } from "@/components/course/star-rating"
import { CategoryFilter } from "@/components/course/category-filter"
import type { Category } from "@/lib/database"
import type { CourseWithDetails } from "@/lib/api/server/courses"

interface CoursesListProps {
  courses: CourseWithDetails[]
  categories: Category[]
  enrolledCourseIds: string[]
  isLoggedIn: boolean
}

export function CoursesList({
  courses,
  categories,
  enrolledCourseIds,
  isLoggedIn,
}: CoursesListProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Filter courses by selected category
  const filteredCourses = useMemo(() => {
    if (!selectedCategory) return courses

    const selectedCat = categories.find(c => c.slug === selectedCategory)
    if (!selectedCat) return courses

    // Get all descendant category IDs
    const getDescendantIds = (parentId: string): string[] => {
      const children = categories.filter(c => c.parent_id === parentId)
      return [
        ...children.map(c => c.id),
        ...children.flatMap(c => getDescendantIds(c.id))
      ]
    }

    const categoryIds = [selectedCat.id, ...getDescendantIds(selectedCat.id)]

    return courses.filter(course =>
      course.categories?.some(cat => categoryIds.includes(cat.id))
    )
  }, [courses, categories, selectedCategory])

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      {categories.length > 0 && (
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      )}

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedCategory
                ? "해당 카테고리에 등록된 강의가 없습니다"
                : "아직 등록된 강의가 없습니다"}
            </CardTitle>
            <CardDescription>
              {selectedCategory
                ? "다른 카테고리를 선택해 보세요"
                : "곧 새로운 강의가 추가될 예정입니다"}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => {
            const isEnrolled = enrolledCourseIds.includes(course.id)
            return (
              <Card key={course.id} className="flex flex-col">
                <CardHeader>
                  {course.thumbnail_url && (
                    <div className="relative w-full h-48 mb-4">
                      <Image
                        src={course.thumbnail_url}
                        alt={course.title}
                        fill
                        className="object-cover rounded-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-1">{course.title}</CardTitle>
                    {isEnrolled && <Badge>수강중</Badge>}
                  </div>
                  <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-2">
                  {/* 카테고리 뱃지 */}
                  {course.categories && course.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {course.categories
                        .filter(cat => cat.level === 3)
                        .slice(0, 3)
                        .map(cat => (
                          <Badge key={cat.id} variant="secondary" className="text-xs">
                            {cat.name_ko}
                          </Badge>
                        ))}
                    </div>
                  )}
                  <div className="text-sm space-y-1">
                    <p className="text-muted-foreground">강사: {course.instructor?.display_name}</p>
                    <p className="text-muted-foreground">
                      레벨: {course.level === "beginner" ? "초급" : course.level === "intermediate" ? "중급" : "고급"}
                    </p>
                    {/* 별점 및 수강생 수 */}
                    <div className="flex items-center gap-3 pt-1">
                      <StarRating
                        rating={course.average_rating || 0}
                        reviewCount={course.review_count || 0}
                      />
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span className="text-xs">
                          {(course.student_count || 0).toLocaleString()}+
                        </span>
                      </div>
                    </div>
                    <p className="font-semibold text-lg pt-1">{course.price.toLocaleString()}원</p>
                  </div>
                  <div className="mt-auto pt-4">
                    {isEnrolled ? (
                      <Button asChild className="w-full">
                        <Link href={`/student/courses/${course.id}`}>학습하기</Link>
                      </Button>
                    ) : (
                      <Button asChild className="w-full" variant={isLoggedIn ? "default" : "outline"}>
                        <Link href={isLoggedIn ? `/courses/${course.id}` : "/auth/login"}>
                          {isLoggedIn ? "자세히 보기" : "로그인하고 구매하기"}
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
