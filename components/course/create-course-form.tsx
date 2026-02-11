"use client";

import type React from "react";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { createUploadUrl, createCourse, createCourseVideo } from "@/app/instructor/courses/new/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ImagePlus, Loader2, X, Video, Plus } from "lucide-react";
import Image from "next/image";
import type { Category } from "@/lib/database";
import { formatPrice, parsePrice } from "@/lib/utils";

const courseSchema = z.object({
  title: z.string().min(1, "강의 제목을 입력해주세요"),
  description: z.string().optional(),
  price: z.string().optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  level1CategoryId: z.string().optional(),
  level2CategoryId: z.string().optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface CreateCourseFormProps {
  instructorId: string;
  categories: Category[];
}

interface VideoItem {
  id: string;
  title: string;
  description?: string;
  file: File;
  preview?: string;
  duration?: number;
  uploadProgress?: number;
  uploaded?: boolean;
}

export function CreateCourseForm({ instructorId, categories }: CreateCourseFormProps) {
  // Thumbnail state
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // Video state
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Price state (for comma formatting)
  const [priceDisplay, setPriceDisplay] = useState("");

  // Upload progress state
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [overallProgress, setOverallProgress] = useState<number>(0);

  const router = useRouter();

  /**
   * Presigned URL을 사용하여 Supabase Storage에 직접 업로드
   */
  const uploadFileWithPresignedUrl = async (
    file: File,
    userId: string,
    onProgress?: (progress: number) => void,
  ): Promise<{ url: string; path: string } | { error: string }> => {
    try {
      // 1. Presigned URL 생성
      const urlResult = await createUploadUrl(file.name, file.type, userId);

      if ("error" in urlResult) {
        return { error: urlResult.error };
      }

      console.log(`[Upload] Got presigned URL, uploading ${file.name}...`);

      // 2. Presigned URL로 직접 업로드
      const uploadResponse = await fetch(urlResult.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
          "x-upsert": "false",
        },
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("[Upload] Upload failed:", uploadResponse.status, errorText);
        return { error: `업로드 실패: ${uploadResponse.statusText}` };
      }

      console.log(`[Upload] ✅ Upload successful: ${file.name}`);

      return {
        url: urlResult.publicUrl,
        path: urlResult.path,
      };
    } catch (error) {
      console.error("[Upload] Exception during upload:", error);
      return {
        error: error instanceof Error ? error.message : "업로드 중 오류가 발생했습니다",
      };
    }
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "",
      level: "beginner",
      level1CategoryId: "",
      level2CategoryId: "",
    },
  });

  const selectedLevel1Id = watch("level1CategoryId");

  // Filter categories by level
  const level1Categories = categories.filter((c) => c.level === 1);
  const level2Categories = categories.filter((c) => c.level === 2 && c.parent_id === selectedLevel1Id);

  // Reset level 2 when level 1 changes
  const handleLevel1Change = (value: string) => {
    setValue("level1CategoryId", value);
    setValue("level2CategoryId", "");
  };

  const mutation = useMutation({
    mutationFn: async (data: CourseFormData) => {
      // Calculate total items for progress
      const totalItems = (thumbnailFile ? 1 : 0) + videos.length + 1; // +1 for course creation
      let completedItems = 0;

      const updateProgress = (status: string) => {
        completedItems++;
        setUploadStatus(status);
        setOverallProgress(Math.round((completedItems / totalItems) * 100));
      };

      // Upload thumbnail if exists
      let thumbnailUrl: string | null = null;
      if (thumbnailFile) {
        setUploadStatus("썸네일 업로드 중...");
        setOverallProgress(0);

        console.log("Uploading thumbnail:", thumbnailFile.size, thumbnailFile.type);

        try {
          // Presigned URL을 사용한 직접 업로드
          const uploadResult = await uploadFileWithPresignedUrl(thumbnailFile, instructorId);

          console.log("Thumbnail upload result:", uploadResult);

          // 에러 체크
          if ("error" in uploadResult) {
            throw new Error(uploadResult.error);
          }

          thumbnailUrl = uploadResult.url;
          updateProgress("썸네일 업로드 완료");
        } catch (error) {
          console.error("Thumbnail upload error:", error);
          throw new Error(`썸네일 업로드 중 오류: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
        }
      }

      // Create course via Server Action
      setUploadStatus("강의 생성 중...");
      console.log("Creating course...");

      const courseResult = await createCourse(
        {
          instructor_id: instructorId,
          title: data.title,
          description: data.description || null,
          price: data.price ? Number.parseFloat(parsePrice(data.price)) : 0,
          level: data.level,
          thumbnail_url: thumbnailUrl,
        },
        {
          level1CategoryId: data.level1CategoryId,
          level2CategoryId: data.level2CategoryId,
        },
      );

      if ("error" in courseResult) {
        console.error("Course creation error:", courseResult.error);
        throw new Error(courseResult.error);
      }

      const courseId = courseResult.id;
      console.log("Course created:", courseId);
      updateProgress("강의 생성 완료");

      // Upload videos
      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        const videoSizeMB = (video.file.size / (1024 * 1024)).toFixed(1);
        setUploadStatus(`영상 ${i + 1}/${videos.length} 업로드 중... (${videoSizeMB}MB)`);

        console.log(`[Video ${i + 1}/${videos.length}] Starting upload:`, video.title, `${videoSizeMB}MB`);

        // Show uploading state on card
        setVideos((prev) => prev.map((v) => (v.id === video.id ? { ...v, uploadProgress: 50 } : v)));

        try {
          console.log(`[Video ${i + 1}] Uploading to Supabase Storage...`);
          const uploadStartTime = Date.now();

          // Presigned URL을 사용한 직접 업로드
          const videoUploadResult = await uploadFileWithPresignedUrl(video.file, `courses/${courseId}`, (progress) => {
            setVideos((prev) => prev.map((v) => (v.id === video.id ? { ...v, uploadProgress: progress } : v)));
          });

          const uploadDuration = ((Date.now() - uploadStartTime) / 1000).toFixed(1);
          console.log(`[Video ${i + 1}] Upload completed in ${uploadDuration}s:`, videoUploadResult);

          if ("error" in videoUploadResult) {
            console.error(`[Video ${i + 1}] Upload failed:`, videoUploadResult.error);
            setVideos((prev) => prev.map((v) => (v.id === video.id ? { ...v, uploadProgress: undefined } : v)));
            continue;
          }

          console.log(`[Video ${i + 1}] Creating database record...`);

          // Server Action을 통한 비디오 레코드 생성
          const videoRecordResult = await createCourseVideo(courseId, {
            title: video.title || `영상 ${i + 1}`,
            description: video.description || null,
            video_url: videoUploadResult.url,
            duration: video.duration || 0,
            order_index: i,
          });

          if ("error" in videoRecordResult) {
            console.error(`[Video ${i + 1}] Database insert failed:`, videoRecordResult.error);
          } else {
            console.log(`[Video ${i + 1}] Database record created successfully`);
          }

          setVideos((prev) => prev.map((v) => (v.id === video.id ? { ...v, uploaded: true, uploadProgress: 100 } : v)));
          updateProgress(`영상 ${i + 1} 업로드 완료`);
          console.log(`[Video ${i + 1}] ✅ Complete`);
        } catch (error) {
          console.error(`[Video ${i + 1}] Upload error:`, error);
          setVideos((prev) => prev.map((v) => (v.id === video.id ? { ...v, uploadProgress: undefined } : v)));
        }
      }

      setUploadStatus("완료!");
      setOverallProgress(100);
      return { id: courseId };
    },
    onSuccess: (result) => {
      router.push(`/courses/${result.id}`);
      router.refresh();
    },
  });

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("이미지 크기는 5MB를 초과할 수 없습니다");
        return;
      }
      // Revoke previous preview URL if exists
      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
      }
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
    // Reset input to allow re-selecting the same file
    e.target.value = "";
  };

  const handleRemoveThumbnail = () => {
    if (thumbnailPreview) {
      URL.revokeObjectURL(thumbnailPreview);
    }
    setThumbnailFile(null);
    setThumbnailPreview(null);
    // Reset file input
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = "";
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 500 * 1024 * 1024) {
        alert(`${file.name}: 영상 크기는 500MB를 초과할 수 없습니다`);
        return;
      }

      const videoId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const preview = URL.createObjectURL(file);

      // Get video duration using a separate blob URL
      const durationUrl = URL.createObjectURL(file);
      const videoEl = document.createElement("video");
      videoEl.preload = "metadata";
      videoEl.onloadedmetadata = () => {
        setVideos((prev) => prev.map((v) => (v.id === videoId ? { ...v, duration: Math.round(videoEl.duration) } : v)));
        URL.revokeObjectURL(durationUrl); // Only revoke the duration URL, not the preview
      };
      videoEl.src = durationUrl;

      setVideos((prev) => [
        ...prev,
        {
          id: videoId,
          title: file.name.replace(/\.[^/.]+$/, ""),
          file,
          preview,
        },
      ]);
    });

    e.target.value = "";
  };

  const handleRemoveVideo = (id: string) => {
    setVideos((prev) => {
      const video = prev.find((v) => v.id === id);
      if (video?.preview) {
        URL.revokeObjectURL(video.preview);
      }
      return prev.filter((v) => v.id !== id);
    });
  };

  const handleVideoTitleChange = (id: string, newTitle: string) => {
    setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, title: newTitle } : v)));
  };

  const handleVideoDescriptionChange = (id: string, newDescription: string) => {
    setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, description: newDescription } : v)));
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const onSubmit = (data: CourseFormData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Top Section: Thumbnail + Course Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Thumbnail Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">썸네일</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {thumbnailPreview ? (
                <div className="relative aspect-video rounded-lg overflow-hidden border">
                  <Image src={thumbnailPreview} alt="썸네일 미리보기" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={handleRemoveThumbnail}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => thumbnailInputRef.current?.click()}
                  className="w-full aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <ImagePlus className="h-10 w-10" />
                  <span className="text-sm">클릭하여 썸네일 업로드</span>
                  <span className="text-xs">권장: 16:9 비율, 최대 5MB</span>
                </button>
              )}
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="hidden"
              />
              {thumbnailPreview && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => thumbnailInputRef.current?.click()}>
                  썸네일 변경
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Course Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">강의 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">강의 제목 *</Label>
              <Input id="title" placeholder="예: 기초 주짓수 완전정복" {...register("title")} />
              {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">강의 설명</Label>
              <Textarea
                id="description"
                placeholder="강의에 대한 설명을 입력하세요"
                rows={4}
                {...register("description")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category1">종목 (1차)</Label>
                <Select value={selectedLevel1Id || ""} onValueChange={handleLevel1Change}>
                  <SelectTrigger>
                    <SelectValue placeholder="종목 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {level1Categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name_ko}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category2">포지션 (2차)</Label>
                <Select
                  value={watch("level2CategoryId") || ""}
                  onValueChange={(value) => setValue("level2CategoryId", value)}
                  disabled={!selectedLevel1Id}>
                  <SelectTrigger>
                    <SelectValue placeholder={selectedLevel1Id ? "포지션 선택" : "종목을 먼저 선택"} />
                  </SelectTrigger>
                  <SelectContent>
                    {level2Categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name_ko}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">가격 (원)</Label>
                <Input
                  id="price"
                  type="text"
                  inputMode="numeric"
                  placeholder="50,000"
                  value={priceDisplay}
                  onChange={(e) => {
                    const formatted = formatPrice(e.target.value);
                    setPriceDisplay(formatted);
                    setValue("price", parsePrice(formatted));
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">난이도</Label>
                <Select
                  value={watch("level")}
                  onValueChange={(value: "beginner" | "intermediate" | "advanced") => setValue("level", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">초급</SelectItem>
                    <SelectItem value="intermediate">중급</SelectItem>
                    <SelectItem value="advanced">고급</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Video Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Video className="h-5 w-5" />
            강의 영상
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Video Cards */}
            {videos.map((video, index) => (
              <Card key={video.id} className="overflow-hidden">
                <div className="flex gap-4 p-4">
                  {/* Video Preview */}
                  <div className="relative w-32 h-24 flex-shrink-0 rounded-lg overflow-hidden border bg-black">
                    {video.preview && <video src={video.preview} className="w-full h-full object-cover" />}
                    {/* Order Badge */}
                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </div>
                    {/* Duration Badge */}
                    {video.duration && (
                      <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-xs">
                        {formatDuration(video.duration)}
                      </div>
                    )}
                    {/* Upload Progress Overlay */}
                    {video.uploadProgress !== undefined && video.uploadProgress < 100 && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                        <div className="text-white text-sm font-bold">{video.uploadProgress}%</div>
                      </div>
                    )}
                    {/* Uploaded Check */}
                    {video.uploaded && (
                      <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                          <span className="text-white text-sm">✓</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Video Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Label className="text-sm">영상 제목</Label>
                      {!mutation.isPending && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVideo(video.id)}
                          className="p-1 hover:bg-destructive hover:text-destructive-foreground rounded transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <Input
                      value={video.title}
                      onChange={(e) => handleVideoTitleChange(video.id, e.target.value)}
                      placeholder="예: 가드 패스 기초"
                      className="text-sm"
                      disabled={mutation.isPending}
                    />

                    <div>
                      <Label className="text-sm">영상 설명 (선택)</Label>
                      <Textarea
                        value={video.description || ""}
                        onChange={(e) => handleVideoDescriptionChange(video.id, e.target.value)}
                        placeholder="이 영상에서 배울 내용을 간단히 설명해주세요"
                        className="text-sm mt-1 resize-none"
                        rows={2}
                        disabled={mutation.isPending}
                      />
                    </div>

                    <p className="text-xs text-muted-foreground">
                      파일 크기: {(video.file.size / (1024 * 1024)).toFixed(1)}MB
                    </p>
                  </div>
                </div>
              </Card>
            ))}

            {/* Add Video Button */}
            {!mutation.isPending && (
              <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50 transition-colors">
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="w-full h-full min-h-[120px] flex flex-col items-center justify-center gap-2 text-muted-foreground p-8">
                  <Plus className="h-8 w-8" />
                  <span className="text-sm font-medium">영상 추가</span>
                  <span className="text-xs">클릭하여 파일 선택</span>
                </button>
              </Card>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            MP4, WebM 지원 (최대 500MB) · 여러 영상을 한번에 선택할 수 있습니다
          </p>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            multiple
            onChange={handleVideoChange}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {mutation.isPending && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{uploadStatus}</span>
                <span>{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {mutation.error && <p className="text-sm text-red-500">{mutation.error.message}</p>}

      {/* Submit Buttons */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.back()}
          disabled={mutation.isPending}>
          취소
        </Button>
        <Button type="submit" className="flex-1" disabled={mutation.isPending}>
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              업로드 중...
            </>
          ) : (
            "강의 만들기"
          )}
        </Button>
      </div>
    </form>
  );
}
