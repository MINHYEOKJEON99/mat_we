import { getAllCourses, getCurrentUser, getEnrolledCourseIds, getAllCategories } from "@/lib/api/server";
import { CoursesList } from "@/components/course/courses-list";

export default async function CoursesPage() {
  // Fetch all data in parallel
  const [courses, user, categories] = await Promise.all([
    getAllCourses(),
    getCurrentUser(),
    getAllCategories(),
  ]);

  // If user is logged in, get their enrollments
  let enrolledCourseIds: string[] = [];
  if (user) {
    enrolledCourseIds = await getEnrolledCourseIds(user.id);
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">주짓수 강의</h1>
          <p className="text-muted-foreground">전문 강사의 고품질 주짓수 강의를 만나보세요</p>
        </div>

        <CoursesList
          courses={courses}
          categories={categories}
          enrolledCourseIds={enrolledCourseIds}
          isLoggedIn={!!user}
        />
      </main>
    </div>
  );
}
