"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle } from "lucide-react"

interface PostActionsProps {
  postId: string
  userId: string
  isLiked: boolean
  likesCount: number
}

export function PostActions({
  postId,
  userId,
  isLiked: initialIsLiked,
  likesCount: initialLikesCount,
}: PostActionsProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [likesCount, setLikesCount] = useState(initialLikesCount)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLike = async () => {
    const supabase = createClient()
    setIsLoading(true)

    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId)

        if (error) throw error

        setIsLiked(false)
        setLikesCount((prev) => prev - 1)
      } else {
        // Like
        const { error } = await supabase.from("post_likes").insert({
          post_id: postId,
          user_id: userId,
        })

        if (error) throw error

        setIsLiked(true)
        setLikesCount((prev) => prev + 1)
      }

      router.refresh()
    } catch (error) {
      console.error("Failed to toggle like:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Button variant="outline" size="sm" onClick={handleLike} disabled={isLoading} className="bg-transparent">
        <Heart className={`mr-2 h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
        {likesCount}
      </Button>
      <Button variant="outline" size="sm" className="bg-transparent">
        <MessageCircle className="mr-2 h-4 w-4" />
        댓글
      </Button>
    </div>
  )
}
