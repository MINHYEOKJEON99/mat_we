"use client"

import { useEffect, useRef } from "react"

interface VideoPlayerProps {
  playbackId: string
  title?: string
}

export function VideoPlayer({ playbackId, title }: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Dynamically load Mux Player script
    if (typeof window !== "undefined" && !customElements.get("mux-player")) {
      const script = document.createElement("script")
      script.src = "https://unpkg.com/@mux/mux-player@2"
      script.type = "module"
      document.head.appendChild(script)
    }
  }, [])

  return (
    <div ref={containerRef} className="w-full rounded-lg overflow-hidden bg-black">
      {/* @ts-expect-error - mux-player is a custom element loaded dynamically */}
      <mux-player
        playback-id={playbackId}
        metadata-video-title={title}
        accent-color="#0ea5e9"
        style={{ width: "100%", aspectRatio: "16/9" }}
      />
    </div>
  )
}
