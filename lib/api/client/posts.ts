import { supabaseUpdate, supabaseDelete } from "./supabase-rest"

/**
 * Update a post (client-side)
 */
export async function updatePost(
  postId: string,
  data: { title: string; content: string; image_url: string | null }
): Promise<void> {
  await supabaseUpdate(
    "community_posts",
    `id=eq.${postId}`,
    {
      title: data.title,
      content: data.content,
      image_url: data.image_url,
      updated_at: new Date().toISOString(),
    }
  )
}

/**
 * Delete a post (client-side)
 */
export async function deletePost(postId: string): Promise<void> {
  await supabaseDelete("community_posts", `id=eq.${postId}`)
}
