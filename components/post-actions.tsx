"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle } from "lucide-react"
import { useToggleLike } from "@/hooks"

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
  const toggleLike = useToggleLike()

  const handleLike = async () => {
    // 낙관적 업데이트
    const newIsLiked = !isLiked
    setIsLiked(newIsLiked)
    setLikesCount((prev) => newIsLiked ? prev + 1 : prev - 1)

    try {
      await toggleLike.mutateAsync({
        postId,
        userId,
        isLiked,
      })
    } catch (error) {
      // 실패 시 롤백
      setIsLiked(isLiked)
      setLikesCount((prev) => newIsLiked ? prev - 1 : prev + 1)
      console.error("Failed to toggle like:", error)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Button
        variant="outline"
        size="sm"
        onClick={handleLike}
        disabled={toggleLike.isPending}
        className="bg-transparent"
      >
        <Heart className={`mr-2 h-4 w-4 ${isLiked ? "fill-current text-red-500" : ""}`} />
        {likesCount}
      </Button>
      <Button variant="outline" size="sm" className="bg-transparent">
        <MessageCircle className="mr-2 h-4 w-4" />
        댓글
      </Button>
    </div>
  )
}
