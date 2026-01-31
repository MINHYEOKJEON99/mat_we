import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/client"
import type { CommunityPost, PostComment, PostLike } from "@/lib/database"

export const postKeys = {
  all: ["posts"] as const,
  lists: () => [...postKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) => [...postKeys.lists(), filters] as const,
  details: () => [...postKeys.all, "detail"] as const,
  detail: (id: string) => [...postKeys.details(), id] as const,
  author: (authorId: string) => [...postKeys.all, "author", authorId] as const,
  comments: (postId: string) => [...postKeys.all, "comments", postId] as const,
  likes: (postId: string) => [...postKeys.all, "likes", postId] as const,
  userLikes: (userId: string) => [...postKeys.all, "userLikes", userId] as const,
}

// 모든 게시글 목록
export function usePosts() {
  const supabase = createClient()

  return useQuery({
    queryKey: postKeys.lists(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_posts")
        .select(`
          *,
          author:profiles!community_posts_author_id_fkey (
            id, display_name, avatar_url
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data as (CommunityPost & { author: { id: string; display_name: string; avatar_url: string | null } })[]
    },
  })
}

// 특정 게시글 상세
export function usePost(postId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: postKeys.detail(postId || ""),
    queryFn: async () => {
      if (!postId) return null

      const { data, error } = await supabase
        .from("community_posts")
        .select(`
          *,
          author:profiles!community_posts_author_id_fkey (
            id, display_name, avatar_url
          )
        `)
        .eq("id", postId)
        .single()

      if (error) throw error
      return data as CommunityPost & { author: { id: string; display_name: string; avatar_url: string | null } }
    },
    enabled: !!postId,
  })
}

// 특정 사용자의 게시글 목록
export function useAuthorPosts(authorId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: postKeys.author(authorId || ""),
    queryFn: async () => {
      if (!authorId) return []

      const { data, error } = await supabase
        .from("community_posts")
        .select("*")
        .eq("author_id", authorId)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data as CommunityPost[]
    },
    enabled: !!authorId,
  })
}

// 게시글 댓글 목록 (대댓글 포함)
export function usePostComments(postId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: postKeys.comments(postId || ""),
    queryFn: async () => {
      if (!postId) return []

      const { data, error } = await supabase
        .from("post_comments")
        .select(`
          *,
          author:profiles!post_comments_author_id_fkey (
            id, display_name, avatar_url
          )
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true })

      if (error) throw error
      return data as (PostComment & {
        author: { id: string; display_name: string; avatar_url: string | null }
        parent_id?: string | null
      })[]
    },
    enabled: !!postId,
    staleTime: 1000 * 60,
    refetchOnMount: "always",
    placeholderData: [],
  })
}

// 사용자가 좋아요한 게시글 ID 목록
export function useUserLikes(userId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: postKeys.userLikes(userId || ""),
    queryFn: async () => {
      if (!userId) return []

      const { data, error } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", userId)

      if (error) throw error
      return data.map((like: { post_id: string }) => like.post_id)
    },
    enabled: !!userId,
  })
}

// 게시글 생성
export function useCreatePost() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<CommunityPost, "id" | "created_at" | "updated_at" | "likes_count" | "comments_count">) => {
      const { data: result, error } = await supabase
        .from("community_posts")
        .insert({
          ...data,
          likes_count: 0,
          comments_count: 0,
        })
        .select()
        .single<CommunityPost>()

      if (error) throw error
      return result
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() })
      queryClient.invalidateQueries({ queryKey: postKeys.author(data.author_id) })
    },
  })
}

// 게시글 수정
export function useUpdatePost() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<CommunityPost> & { id: string }) => {
      const { data: result, error } = await supabase
        .from("community_posts")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single<CommunityPost>()

      if (error) throw error
      return result
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: postKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: postKeys.lists() })
      queryClient.invalidateQueries({ queryKey: postKeys.author(data.author_id) })
    },
  })
}

// 게시글 삭제
export function useDeletePost() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from("community_posts")
        .delete()
        .eq("id", postId)

      if (error) throw error
      return postId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all })
    },
  })
}

// 댓글 작성 (대댓글 지원)
export function useCreateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { post_id: string; author_id: string; content: string; parent_id?: string | null }) => {
      const supabase = createClient()

      // Get user session
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error("로그인이 필요합니다")
      }

      const { data: result, error } = await supabase
        .from("post_comments")
        .insert(data)
        .select()
        .single<PostComment>()

      if (error) {
        console.error("Comment creation error:", error)
        throw error
      }

      return result
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: postKeys.comments(data.post_id) })
      queryClient.invalidateQueries({ queryKey: postKeys.detail(data.post_id) })
    },
  })
}

// 댓글 삭제
export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ commentId, postId }: { commentId: string; postId: string }) => {
      const supabase = createClient()

      // Get user session
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error("로그인이 필요합니다")
      }

      const { error } = await supabase
        .from("post_comments")
        .delete()
        .eq("id", commentId)

      if (error) {
        console.error("Comment deletion error:", error)
        throw error
      }

      return { commentId, postId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: postKeys.comments(data.postId) })
      queryClient.invalidateQueries({ queryKey: postKeys.detail(data.postId) })
    },
  })
}

// 좋아요 토글
export function useToggleLike() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ postId, userId, isLiked }: { postId: string; userId: string; isLiked: boolean }) => {
      if (isLiked) {
        // 좋아요 취소
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId)

        if (error) throw error
      } else {
        // 좋아요 추가
        const { error } = await supabase
          .from("post_likes")
          .insert({ post_id: postId, user_id: userId })

        if (error) throw error
      }

      return { postId, userId, isLiked: !isLiked }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: postKeys.detail(data.postId) })
      queryClient.invalidateQueries({ queryKey: postKeys.lists() })
      queryClient.invalidateQueries({ queryKey: postKeys.userLikes(data.userId) })
    },
  })
}
