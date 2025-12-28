import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/client"
import type { Course, CourseVideo } from "@/lib/database"

export const courseKeys = {
  all: ["courses"] as const,
  lists: () => [...courseKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) => [...courseKeys.lists(), filters] as const,
  details: () => [...courseKeys.all, "detail"] as const,
  detail: (id: string) => [...courseKeys.details(), id] as const,
  instructor: (instructorId: string) => [...courseKeys.all, "instructor", instructorId] as const,
  videos: (courseId: string) => [...courseKeys.all, "videos", courseId] as const,
}

// 모든 강의 목록
export function useCourses() {
  const supabase = createClient()

  return useQuery({
    queryKey: courseKeys.lists(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select(`
          *,
          instructor:profiles!courses_instructor_id_fkey (
            id, display_name, avatar_url
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data as (Course & { instructor: { id: string; display_name: string; avatar_url: string | null } })[]
    },
  })
}

// 특정 강의 상세
export function useCourse(courseId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: courseKeys.detail(courseId || ""),
    queryFn: async () => {
      if (!courseId) return null

      const { data, error } = await supabase
        .from("courses")
        .select(`
          *,
          instructor:profiles!courses_instructor_id_fkey (
            id, display_name, avatar_url, bio
          )
        `)
        .eq("id", courseId)
        .single()

      if (error) throw error
      return data as Course & { instructor: { id: string; display_name: string; avatar_url: string | null; bio: string | null } }
    },
    enabled: !!courseId,
  })
}

// 강사의 강의 목록
export function useInstructorCourses(instructorId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: courseKeys.instructor(instructorId || ""),
    queryFn: async () => {
      if (!instructorId) return []

      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("instructor_id", instructorId)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data as Course[]
    },
    enabled: !!instructorId,
  })
}

// 강의 비디오 목록
export function useCourseVideos(courseId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: courseKeys.videos(courseId || ""),
    queryFn: async () => {
      if (!courseId) return []

      const { data, error } = await supabase
        .from("course_videos")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index", { ascending: true })

      if (error) throw error
      return data as CourseVideo[]
    },
    enabled: !!courseId,
  })
}

// 강의 생성
export function useCreateCourse() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<Course, "id" | "created_at" | "updated_at">) => {
      const { data: result, error } = await supabase
        .from("courses")
        .insert(data)
        .select()
        .single<Course>()

      if (error) throw error
      return result
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
      queryClient.invalidateQueries({ queryKey: courseKeys.instructor(data.instructor_id) })
    },
  })
}

// 강의 수정
export function useUpdateCourse() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Course> & { id: string }) => {
      const { data: result, error } = await supabase
        .from("courses")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single<Course>()

      if (error) throw error
      return result
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() })
      queryClient.invalidateQueries({ queryKey: courseKeys.instructor(data.instructor_id) })
    },
  })
}

// 강의 삭제
export function useDeleteCourse() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", courseId)

      if (error) throw error
      return courseId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.all })
    },
  })
}

// 비디오 추가
export function useAddCourseVideo() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<CourseVideo, "id" | "created_at">) => {
      const { data: result, error } = await supabase
        .from("course_videos")
        .insert(data)
        .select()
        .single<CourseVideo>()

      if (error) throw error
      return result
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.videos(data.course_id) })
    },
  })
}
