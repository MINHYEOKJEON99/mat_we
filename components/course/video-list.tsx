"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CourseVideo } from "@/lib/database"
import { PlayCircle } from "lucide-react"

interface VideoListProps {
  videos: CourseVideo[]
  courseId: string
  currentVideoIndex?: number
  onVideoSelect?: (index: number) => void
}

export function VideoList({ videos, currentVideoIndex = 0, onVideoSelect }: VideoListProps) {
  if (videos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>강의 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">아직 추가된 영상이 없습니다</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>강의 목록</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {videos.map((video, index) => (
          <div
            key={video.id}
            onClick={() => onVideoSelect?.(index)}
            className={`flex items-start gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors ${
              currentVideoIndex === index ? "bg-accent border-2 border-primary" : ""
            }`}
          >
            <PlayCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
              currentVideoIndex === index ? "text-primary" : ""
            }`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium line-clamp-2 ${
                currentVideoIndex === index ? "text-primary" : ""
              }`}>
                {index + 1}. {video.title}
              </p>
              {video.duration && (
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.floor(video.duration / 60)}분 {video.duration % 60}초
                </p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
