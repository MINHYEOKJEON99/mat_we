import { createClient } from "@/lib/server"
import type { CommunityPost } from "@/lib/database"

export type PostWithAuthor = CommunityPost & {
  author: {
    id: string
    display_name: string
    avatar_url: string | null
    bio?: string | null
  }
}

/**
 * Get all community posts with author info
 */
export async function getAllPosts(): Promise<{
  posts: PostWithAuthor[]
  count: number
}> {
  const supabase = await createClient()

  const { data: posts, count, error } = await supabase
    .from("community_posts")
    .select(`
      *,
      author:profiles!community_posts_author_id_fkey (
        id, display_name, avatar_url
      )
    `, { count: "exact" })
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[Posts] Error fetching posts:", error)
    return { posts: [], count: 0 }
  }

  return {
    posts: (posts as PostWithAuthor[]) || [],
    count: count || 0,
  }
}

/**
 * Get single post by ID with author info
 */
export async function getPostById(postId: string): Promise<PostWithAuthor | null> {
  const supabase = await createClient()

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

  if (error) {
    console.error("[Posts] Error fetching post:", error)
    return null
  }

  return data as PostWithAuthor
}

/**
 * Get posts by author ID
 */
export async function getPostsByAuthor(authorId: string): Promise<CommunityPost[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("community_posts")
    .select("*")
    .eq("author_id", authorId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[Posts] Error fetching author posts:", error)
    return []
  }

  return data as CommunityPost[]
}
