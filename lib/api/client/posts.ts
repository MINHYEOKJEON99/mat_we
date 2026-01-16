import { createClient } from "@/lib/client"

/**
 * Update a post (client-side)
 */
export async function updatePost(
  postId: string,
  data: { title: string; content: string; image_url: string | null }
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from("community_posts")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId)

  if (error) {
    throw new Error(`Failed to update post: ${error.message}`)
  }
}

/**
 * Delete a post (client-side)
 */
export async function deletePost(postId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from("community_posts")
    .delete()
    .eq("id", postId)

  if (error) {
    throw new Error(`Failed to delete post: ${error.message}`)
  }
}
