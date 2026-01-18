"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: "sm" | "md" | "lg"
  showValue?: boolean
  reviewCount?: number
  className?: string
}

export function StarRating({
  rating,
  maxRating = 5,
  size = "sm",
  showValue = true,
  reviewCount,
  className,
}: StarRatingProps) {
  const sizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Star
        className={cn(
          sizeClasses[size],
          rating > 0 ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
        )}
      />
      {showValue && (
        <span className={cn("font-medium", textSizeClasses[size])}>
          {rating > 0 ? rating.toFixed(1) : "-"}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className={cn("text-muted-foreground", textSizeClasses[size])}>
          ({reviewCount})
        </span>
      )}
    </div>
  )
}

interface InteractiveStarRatingProps {
  rating: number
  onChange: (rating: number) => void
  maxRating?: number
  size?: "sm" | "md" | "lg"
  className?: string
}

export function InteractiveStarRating({
  rating,
  onChange,
  maxRating = 5,
  size = "md",
  className,
}: InteractiveStarRatingProps) {
  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: maxRating }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
        >
          <Star
            className={cn(
              sizeClasses[size],
              "transition-colors cursor-pointer",
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground hover:text-yellow-400"
            )}
          />
        </button>
      ))}
    </div>
  )
}
