import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/client"

export const enrollmentKeys = {
  all: ["enrollments"] as const,
  student: (studentId: string) => [...enrollmentKeys.all, "student", studentId] as const,
  course: (courseId: string) => [...enrollmentKeys.all, "course", courseId] as const,
  check: (studentId: string, courseId: string) => [...enrollmentKeys.all, "check", studentId, courseId] as const,
}

interface EnrollmentWithCourse {
  id: string
  enrolled_at: string
  course: {
    id: string
    title: string
    description: string | null
    thumbnail_url: string | null
    level: string | null
    instructor: {
      display_name: string
    }
  }
}

// 학생의 수강 목록
export function useStudentEnrollments(studentId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: enrollmentKeys.student(studentId || ""),
    queryFn: async () => {
      if (!studentId) return []

      const { data, error } = await supabase
        .from("enrollments")
        .select(`
          id,
          enrolled_at,
          course:courses (
            id,
            title,
            description,
            thumbnail_url,
            level,
            instructor:profiles!courses_instructor_id_fkey (
              display_name
            )
          )
        `)
        .eq("student_id", studentId)
        .order("enrolled_at", { ascending: false })

      if (error) throw error

      // Supabase returns nested objects, need to handle the array case
      return (data || []).map((item: any) => ({
        id: item.id,
        enrolled_at: item.enrolled_at,
        course: Array.isArray(item.course) ? item.course[0] : item.course,
      })) as EnrollmentWithCourse[]
    },
    enabled: !!studentId,
  })
}

// 특정 강의의 수강생 수
export function useCourseEnrollmentCount(courseId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: enrollmentKeys.course(courseId || ""),
    queryFn: async () => {
      if (!courseId) return 0

      const { count, error } = await supabase
        .from("enrollments")
        .select("*", { count: "exact", head: true })
        .eq("course_id", courseId)

      if (error) throw error
      return count || 0
    },
    enabled: !!courseId,
  })
}

// 수강 여부 확인
export function useCheckEnrollment(studentId: string | undefined, courseId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: enrollmentKeys.check(studentId || "", courseId || ""),
    queryFn: async () => {
      if (!studentId || !courseId) return false

      const { data, error } = await supabase
        .from("enrollments")
        .select("id")
        .eq("student_id", studentId)
        .eq("course_id", courseId)
        .maybeSingle()

      if (error) throw error
      return !!data
    },
    enabled: !!studentId && !!courseId,
  })
}

// 수강 신청
export function useCreateEnrollment() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ studentId, courseId }: { studentId: string; courseId: string }) => {
      const { data, error } = await supabase
        .from("enrollments")
        .insert({
          student_id: studentId,
          course_id: courseId,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.student(variables.studentId) })
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.course(variables.courseId) })
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.check(variables.studentId, variables.courseId) })
    },
  })
}
