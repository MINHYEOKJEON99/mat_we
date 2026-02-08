"use client";

import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

import { useEffect, useRef, useState, useCallback } from "react";
import { MediaPlayer, MediaProvider, Track, useMediaState } from "@vidstack/react";
import { defaultLayoutIcons, DefaultVideoLayout } from "@vidstack/react/player/layouts/default";
import { Play, Pause, Subtitles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SubtitleTrack {
  src: string;
  label: string;
  language: string;
  default?: boolean;
}

interface VideoPlayerProps {
  src?: string;
  title?: string;
  tracks?: SubtitleTrack[];
}

function formatVTTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`;
}

// 재생/일시정지 오버레이 (클릭 시에만 표시)
function PlayPauseOverlay() {
  const paused = useMediaState("paused");
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const clickedRef = useRef(false);

  useEffect(() => {
    const mediaPlayer = containerRef.current?.closest("[data-media-player]");
    if (!mediaPlayer) return;

    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-media-controls]") || target.closest("button")) return;
      clickedRef.current = true;
    };

    mediaPlayer.addEventListener("click", handleClick);
    return () => mediaPlayer.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    if (clickedRef.current) {
      clickedRef.current = false;
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 600);
      return () => clearTimeout(timer);
    }
  }, [paused]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 flex items-center justify-center pointer-events-none z-10 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}>
      <div className="bg-black/50 rounded-full p-5">
        {paused ? (
          <Pause className="w-10 h-10 text-white fill-white" />
        ) : (
          <Play className="w-10 h-10 text-white fill-white" />
        )}
      </div>
    </div>
  );
}

export function VideoPlayer({ src, title, tracks = [] }: VideoPlayerProps) {
  const videoSrc = src || "";
  const [autoSubtitleUrl, setAutoSubtitleUrl] = useState<string | null>(null);
  const [subtitleStatus, setSubtitleStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [statusText, setStatusText] = useState("");

  const generateSubtitles = useCallback(async () => {
    if (!videoSrc || subtitleStatus === "loading") return;

    try {
      setSubtitleStatus("loading");
      setStatusText("AI 모델 로딩 중...");

      const { pipeline, env } = await import("@xenova/transformers");
      env.allowLocalModels = false;

      const transcriber = await pipeline("automatic-speech-recognition", "Xenova/whisper-tiny", {
        progress_callback: (data: { status: string; progress?: number }) => {
          if (data.status === "progress" && data.progress) {
            setStatusText(`모델 다운로드 중... ${Math.round(data.progress)}%`);
          }
        },
      });

      setStatusText("자막 생성 중... (영상 길이에 따라 시간이 걸릴 수 있습니다)");

      const result = await transcriber(videoSrc, {
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: true,
      });

      // VTT 생성
      let vtt = "WEBVTT\n\n";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const chunks = (result as any).chunks || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      chunks.forEach((chunk: any, i: number) => {
        const [start, end] = chunk.timestamp;
        vtt += `${i + 1}\n`;
        vtt += `${formatVTTTime(start)} --> ${formatVTTTime(end ?? start + 5)}\n`;
        vtt += `${chunk.text.trim()}\n\n`;
      });

      const blob = new Blob([vtt], { type: "text/vtt" });
      setAutoSubtitleUrl(URL.createObjectURL(blob));
      setSubtitleStatus("done");
      setStatusText("");
    } catch (err) {
      console.error("자막 생성 실패:", err);
      setSubtitleStatus("error");
      setStatusText("자막 생성에 실패했습니다");
    }
  }, [videoSrc, subtitleStatus]);

  if (!videoSrc) return null;

  const allTracks = [...tracks];
  if (autoSubtitleUrl) {
    allTracks.push({
      src: autoSubtitleUrl,
      label: "자동 생성",
      language: "ko",
      default: true,
    });
  }

  return (
    <div className="w-full space-y-3">
      <div className="rounded-lg overflow-hidden">
        <MediaPlayer
          className="[--media-brand:#22c55e] [--media-focus-ring-color:#22c55e]"
          title={title}
          src={videoSrc}
          aspectRatio="16/9"
          crossOrigin
          playsInline>
          <MediaProvider />
          <PlayPauseOverlay />
          {allTracks.map((track) => (
            <Track
              key={track.src}
              src={track.src}
              kind="subtitles"
              label={track.label}
              language={track.language}
              default={track.default}
            />
          ))}
          <DefaultVideoLayout icons={defaultLayoutIcons} seekStep={5} smallLayoutWhen={false} />
        </MediaPlayer>
      </div>

      {subtitleStatus !== "done" && (
        <Button
          variant="outline"
          size="sm"
          onClick={generateSubtitles}
          disabled={subtitleStatus === "loading"}
          className="gap-2">
          {subtitleStatus === "loading" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {statusText}
            </>
          ) : subtitleStatus === "error" ? (
            <>
              <Subtitles className="w-4 h-4" />
              다시 시도
            </>
          ) : (
            <>
              <Subtitles className="w-4 h-4" />
              AI 자동 자막 생성
            </>
          )}
        </Button>
      )}
    </div>
  );
}
