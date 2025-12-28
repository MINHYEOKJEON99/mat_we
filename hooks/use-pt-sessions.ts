import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/client"
import type { PTSession, ChatMessage } from "@/lib/database"

export const ptSessionKeys = {
  all: ["pt-sessions"] as const,
  lists: () => [...ptSessionKeys.all, "list"] as const,
  detail: (id: string) => [...ptSessionKeys.all, "detail", id] as const,
  instructor: (instructorId: string) => [...ptSessionKeys.all, "instructor", instructorId] as const,
  student: (studentId: string) => [...ptSessionKeys.all, "student", studentId] as const,
  messages: (sessionId: string) => [...ptSessionKeys.all, "messages", sessionId] as const,
}

// PT 세션 상세
export function usePTSession(sessionId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ptSessionKeys.detail(sessionId || ""),
    queryFn: async () => {
      if (!sessionId) return null

      const { data, error } = await supabase
        .from("pt_sessions")
        .select(`
          *,
          instructor:profiles!pt_sessions_instructor_id_fkey (
            id, display_name, avatar_url
          ),
          student:profiles!pt_sessions_student_id_fkey (
            id, display_name, avatar_url
          )
        `)
        .eq("id", sessionId)
        .single()

      if (error) throw error
      return data as PTSession & {
        instructor: { id: string; display_name: string; avatar_url: string | null }
        student: { id: string; display_name: string; avatar_url: string | null }
      }
    },
    enabled: !!sessionId,
  })
}

// 강사의 PT 세션 목록
export function useInstructorPTSessions(instructorId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ptSessionKeys.instructor(instructorId || ""),
    queryFn: async () => {
      if (!instructorId) return []

      const { data, error } = await supabase
        .from("pt_sessions")
        .select(`
          *,
          student:profiles!pt_sessions_student_id_fkey (
            id, display_name, avatar_url
          )
        `)
        .eq("instructor_id", instructorId)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data as (PTSession & {
        student: { id: string; display_name: string; avatar_url: string | null }
      })[]
    },
    enabled: !!instructorId,
  })
}

// 학생의 PT 세션 목록
export function useStudentPTSessions(studentId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ptSessionKeys.student(studentId || ""),
    queryFn: async () => {
      if (!studentId) return []

      const { data, error } = await supabase
        .from("pt_sessions")
        .select(`
          *,
          instructor:profiles!pt_sessions_instructor_id_fkey (
            id, display_name, avatar_url
          )
        `)
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data as (PTSession & {
        instructor: { id: string; display_name: string; avatar_url: string | null }
      })[]
    },
    enabled: !!studentId,
  })
}

// 채팅 메시지 목록
export function useChatMessages(sessionId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ptSessionKeys.messages(sessionId || ""),
    queryFn: async () => {
      if (!sessionId) return []

      const { data, error } = await supabase
        .from("chat_messages")
        .select(`
          *,
          sender:profiles!chat_messages_sender_id_fkey (
            id, display_name, avatar_url
          )
        `)
        .eq("pt_session_id", sessionId)
        .order("created_at", { ascending: true })

      if (error) throw error
      return data as (ChatMessage & {
        sender: { id: string; display_name: string; avatar_url: string | null }
      })[]
    },
    enabled: !!sessionId,
    // refetchInterval 제거 - ChatInterface에서 Supabase Realtime 사용 중
  })
}

// PT 세션 생성
export function useCreatePTSession() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<PTSession, "id" | "created_at" | "updated_at">) => {
      const { data: result, error } = await supabase
        .from("pt_sessions")
        .insert(data)
        .select()
        .single<PTSession>()

      if (error) throw error
      return result
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ptSessionKeys.instructor(data.instructor_id) })
      queryClient.invalidateQueries({ queryKey: ptSessionKeys.student(data.student_id) })
    },
  })
}

// PT 세션 상태 업데이트
export function useUpdatePTSessionStatus() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ sessionId, status }: { sessionId: string; status: PTSession["status"] }) => {
      const { data, error } = await supabase
        .from("pt_sessions")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionId)
        .select()
        .single<PTSession>()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ptSessionKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: ptSessionKeys.instructor(data.instructor_id) })
      queryClient.invalidateQueries({ queryKey: ptSessionKeys.student(data.student_id) })
    },
  })
}

// 채팅 메시지 전송
export function useSendMessage() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { pt_session_id: string; sender_id: string; message: string }) => {
      const { data: result, error } = await supabase
        .from("chat_messages")
        .insert(data)
        .select()
        .single<ChatMessage>()

      if (error) throw error
      return result
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ptSessionKeys.messages(data.pt_session_id) })
    },
  })
}
