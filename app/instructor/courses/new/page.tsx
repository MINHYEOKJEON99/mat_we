import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CreateCourseForm } from "@/components/course/create-course-form";
import { requireAuth, getProfileById, getAllCategories } from "@/lib/api/server";

export default async function NewCoursePage() {
  const user = await requireAuth();
  const profile = await getProfileById(user.id);

  if (!profile || profile.role !== "instructor") {
    redirect("/dashboard");
  }

  const categories = await getAllCategories();

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">새 강의 만들기</h1>
          <p className="text-muted-foreground">강의 정보를 입력하세요</p>
        </div>
        <CreateCourseForm instructorId={user.id} categories={categories} />
      </main>
    </div>
  );
}
