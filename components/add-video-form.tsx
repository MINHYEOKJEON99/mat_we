"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface AddVideoFormProps {
  courseId: string
}

export function AddVideoForm({ courseId }: AddVideoFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [muxPlaybackId, setMuxPlaybackId] = useState("")
  const [muxAssetId, setMuxAssetId] = useState("")
  const [duration, setDuration] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      // Get the current max order_index
      const { data: existingVideos } = await supabase
        .from("course_videos")
        .select("order_index")
        .eq("course_id", courseId)
        .order("order_index", { ascending: false })
        .limit(1)

      const nextOrderIndex = existingVideos && existingVideos.length > 0 ? existingVideos[0].order_index + 1 : 0

      const { error } = await supabase.from("course_videos").insert({
        course_id: courseId,
        title,
        description: description || null,
        mux_playback_id: muxPlaybackId || null,
        mux_asset_id: muxAssetId || null,
        duration: duration ? Number.parseInt(duration) : null,
        order_index: nextOrderIndex,
      })

      if (error) throw error

      // Reset form
      setTitle("")
      setDescription("")
      setMuxPlaybackId("")
      setMuxAssetId("")
      setDuration("")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "영상 추가 중 오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="video-title">영상 제목 *</Label>
        <Input
          id="video-title"
          placeholder="예: 기본 가드 자세"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="video-description">영상 설명</Label>
        <Textarea
          id="video-description"
          placeholder="영상 내용을 간단히 설명하세요"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mux-playback-id">Mux Playback ID</Label>
        <Input
          id="mux-playback-id"
          placeholder="예: abc123def456"
          value={muxPlaybackId}
          onChange={(e) => setMuxPlaybackId(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mux-asset-id">Mux Asset ID (선택)</Label>
        <Input
          id="mux-asset-id"
          placeholder="예: xyz789"
          value={muxAssetId}
          onChange={(e) => setMuxAssetId(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">재생시간 (초)</Label>
        <Input
          id="duration"
          type="number"
          placeholder="예: 300"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "추가 중..." : "영상 추가"}
      </Button>
    </form>
  )
}
