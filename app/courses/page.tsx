import { getAllCourses, getCurrentUser, getEnrolledCourseIds, getAllCategories } from "@/lib/api/server";
import { CoursesList } from "@/components/course/courses-list";
import type { CourseWithDetails } from "@/lib/api/server/courses";
import type { Category } from "@/lib/database";

// 더미 강의 데이터
const DUMMY_COURSES: CourseWithDetails[] = [
  {
    id: "dummy-1",
    instructor_id: "dummy-instructor-1",
    title: "주짓수 기초 마스터 클래스: 화이트벨트를 위한 완벽 가이드",
    description:
      "주짓수를 처음 시작하는 분들을 위한 체계적인 기초 강의입니다. 기본 자세부터 필수 테크닉까지 단계별로 배워보세요.",
    thumbnail_url: "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&h=450&fit=crop",
    price: 89000,
    level: "beginner",
    average_rating: 4.7,
    review_count: 183,
    student_count: 1250,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    instructor: {
      id: "dummy-instructor-1",
      email: "instructor@example.com",
      display_name: "김주짓",
      bio: "10년 경력의 블랙벨트 강사",
      role: "instructor",
      avatar_url: null,
      interested_sports: ["jiujitsu"],
      is_profile_complete: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    categories: [
      {
        id: "cat-1",
        name: "jiujitsu",
        name_ko: "주짓수",
        slug: "jiujitsu",
        description: null,
        parent_id: null,
        level: 1,
        sort_order: 1,
        icon: null,
        created_at: new Date().toISOString(),
      },
    ],
  },
];

// 더미 카테고리 데이터
const DUMMY_CATEGORIES: Category[] = [
  {
    id: "cat-1",
    name: "jiujitsu",
    name_ko: "주짓수",
    slug: "jiujitsu",
    description: null,
    parent_id: null,
    level: 1,
    sort_order: 1,
    icon: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "cat-2",
    name: "wrestling",
    name_ko: "레슬링",
    slug: "wrestling",
    description: null,
    parent_id: null,
    level: 1,
    sort_order: 2,
    icon: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "cat-3",
    name: "judo",
    name_ko: "유도",
    slug: "judo",
    description: null,
    parent_id: null,
    level: 1,
    sort_order: 3,
    icon: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "cat-guard",
    name: "guard",
    name_ko: "가드",
    slug: "jiujitsu-guard",
    description: null,
    parent_id: "cat-1",
    level: 2,
    sort_order: 1,
    icon: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "cat-top",
    name: "top",
    name_ko: "탑",
    slug: "jiujitsu-top",
    description: null,
    parent_id: "cat-1",
    level: 2,
    sort_order: 2,
    icon: null,
    created_at: new Date().toISOString(),
  },
];

export default async function CoursesPage() {
  // Fetch all data in parallel
  const [courses, user, categories] = await Promise.all([getAllCourses(), getCurrentUser(), getAllCategories()]);

  // If user is logged in, get their enrollments
  let enrolledCourseIds: string[] = [];
  if (user) {
    enrolledCourseIds = await getEnrolledCourseIds(user.id);
  }

  // 실제 강의가 없으면 더미 데이터 사용 (강의와 카테고리 세트로)
  const useDummyData = courses.length === 0;
  const displayCourses = useDummyData ? DUMMY_COURSES : courses;
  const displayCategories = useDummyData ? DUMMY_CATEGORIES : categories;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-heading text-2xl mb-2">COURSES</h1>
          <p className="text-muted-foreground">전문 강사의 고품질 주짓수 강의를 만나보세요</p>
        </div>

        <CoursesList
          courses={displayCourses}
          categories={displayCategories}
          enrolledCourseIds={enrolledCourseIds}
          isLoggedIn={!!user}
        />
      </main>
    </div>
  );
}
