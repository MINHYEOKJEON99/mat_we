"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { CategoryFilter } from "@/components/course/category-filter"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  const searchParams = useSearchParams()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get("category")
  )

  // URL 동기화 (클라이언트 사이드, 페이지 리로드 없음)
  const handleCategoryChange = useCallback((slug: string | null) => {
    setSelectedCategory(slug)

    // URL 업데이트 (히스토리에 추가, 페이지 리로드 없음)
    const url = new URL(window.location.href)
    if (slug) {
      url.searchParams.set("category", slug)
    } else {
      url.searchParams.delete("category")
    }
    window.history.pushState({}, "", url.toString())
  }, [])

  // 브라우저 뒤로가기/앞으로가기 처리
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search)
      setSelectedCategory(params.get("category"))
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

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
          onCategoryChange={handleCategoryChange}
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
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCourses.map((course) => {
            const isEnrolled = enrolledCourseIds.includes(course.id)
            const rating = course.average_rating || 0
            const reviewCount = course.review_count || 0

            return (
              <Link
                key={course.id}
                href={isEnrolled ? `/student/courses/${course.id}` : (isLoggedIn ? `/courses/${course.id}` : "/auth/login")}
                className="group"
              >
                <article className="bg-card border rounded-lg overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    {course.thumbnail_url ? (
                      <Image
                        src={course.thumbnail_url}
                        alt={course.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        <span className="text-muted-foreground text-sm">이미지 없음</span>
                      </div>
                    )}
                    {/* Enrolled Badge Overlay */}
                    {isEnrolled && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-primary text-primary-foreground">수강중</Badge>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-2">
                    {/* Title */}
                    <h3 className="font-bold text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>

                    {/* Instructor */}
                    <p className="text-xs text-muted-foreground truncate">
                      {course.instructor?.display_name || "강사 미정"}
                    </p>

                    {/* Rating & Reviews */}
                    <div className="flex items-center gap-1.5">
                      {rating > 0 ? (
                        <>
                          <span className="font-bold text-sm text-amber-600 dark:text-amber-500">
                            {rating.toFixed(1)}
                          </span>
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3.5 w-3.5 ${
                                  star <= Math.round(rating)
                                    ? "fill-amber-400 text-amber-400"
                                    : "fill-muted text-muted"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            ({reviewCount.toLocaleString()})
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">아직 리뷰가 없습니다</span>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1">
                      {(course.student_count || 0) >= 100 && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
                          베스트셀러
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                        {course.level === "beginner" ? "초급" : course.level === "intermediate" ? "중급" : "고급"}
                      </Badge>
                      {course.categories && course.categories.length > 0 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                          {course.categories[0].name_ko}
                        </Badge>
                      )}
                    </div>

                    {/* Price */}
                    <div className="pt-1">
                      <span className="font-bold text-base">
                        {course.price === 0 ? "무료" : `₩${course.price.toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
