import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Star, ArrowRight } from "lucide-react";
import { getAllCourses } from "@/lib/api/server";
import type { CourseWithDetails } from "@/lib/api/server/courses";

// 더미 데이터 (실제 데이터가 없을 경우 사용)
const DUMMY_COURSES: CourseWithDetails[] = [
  {
    id: "dummy-1",
    instructor_id: "dummy-instructor-1",
    title: "주짓수 기초 완성 과정",
    description: "주짓수를 처음 시작하는 분들을 위한 체계적인 기초 강의입니다.",
    thumbnail_url: "https://images.unsplash.com/photo-1577998474517-7eeeed4e448a?w=800&q=80",
    price: 89000,
    level: "beginner",
    average_rating: 4.9,
    review_count: 183,
    student_count: 234,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    instructor: {
      id: "dummy-instructor-1",
      email: "instructor@example.com",
      display_name: "김태현",
      bio: null,
      role: "instructor",
      avatar_url: null,
      interested_sports: ["jiujitsu"],
      is_profile_complete: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    categories: [],
  },
  {
    id: "dummy-2",
    instructor_id: "dummy-instructor-2",
    title: "가드 패스 마스터클래스",
    description: "중급자를 위한 가드 패스 기술 심화 과정입니다.",
    thumbnail_url: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80",
    price: 129000,
    level: "intermediate",
    average_rating: 5.0,
    review_count: 89,
    student_count: 189,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    instructor: {
      id: "dummy-instructor-2",
      email: "instructor2@example.com",
      display_name: "박준호",
      bio: null,
      role: "instructor",
      avatar_url: null,
      interested_sports: ["jiujitsu"],
      is_profile_complete: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    categories: [],
  },
  {
    id: "dummy-3",
    instructor_id: "dummy-instructor-3",
    title: "셀프 디펜스 실전 과정",
    description: "실전 호신술을 배우는 초급자 과정입니다.",
    thumbnail_url: "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&q=80",
    price: 99000,
    level: "beginner",
    average_rating: 4.8,
    review_count: 156,
    student_count: 312,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    instructor: {
      id: "dummy-instructor-3",
      email: "instructor3@example.com",
      display_name: "이서연",
      bio: null,
      role: "instructor",
      avatar_url: null,
      interested_sports: ["jiujitsu"],
      is_profile_complete: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    categories: [],
  },
];

export async function FeaturedCourses() {
  const courses = await getAllCourses();
  const displayCourses = courses.length > 0 ? courses.slice(0, 3) : DUMMY_COURSES;

  return (
    <div className="w-full">
      <div className="flex items-end justify-between mb-10">
        <div>
          <h2 className="text-2xl md:text-3xl font-heading tracking-wide mb-2">RECENTLY ADDED</h2>
          <p className="text-[13px] text-muted-foreground">최신 강의를 만나보세요</p>
        </div>
        <Link
          href="/courses"
          className="hidden md:inline-flex items-center my-auto gap-2 text-sm font-medium hover:gap-3 transition-all"
        >
          전체 보기
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {displayCourses.map((course) => {
          const rating = course.average_rating || 0;
          const reviewCount = course.review_count || 0;

          return (
            <Link key={course.id} href={`/courses/${course.id}`} className="group">
              <article className="bg-transparent rounded-[5px] overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
                {/* Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  {course.thumbnail_url ? (
                    <Image
                      src={course.thumbnail_url}
                      alt={course.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                      <span className="text-muted-foreground text-sm">이미지 없음</span>
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
                                star <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">({reviewCount.toLocaleString()})</span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">아직 리뷰가 없습니다</span>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1">
                    {(course.student_count || 0) >= 100 && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 h-5 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
                      >
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
          );
        })}
      </div>

      <Link
        href="/courses"
        className="md:hidden inline-flex items-center gap-2 text-sm font-medium hover:gap-3 transition-all mt-8"
      >
        전체 강의 보기
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
