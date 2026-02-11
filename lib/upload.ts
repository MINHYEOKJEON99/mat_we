import imageCompression from "browser-image-compression";
import { createClient } from "./client";

const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_WIDTH = 1920;
const MAX_VIDEO_SIZE_MB = 30;
const MAX_VIDEO_DURATION_SECONDS = 60;

export interface UploadResult {
  url: string;
  path: string;
}

export interface UploadError {
  message: string;
}

/**
 * Compress and optimize image before upload
 */
export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: MAX_IMAGE_SIZE_MB,
    maxWidthOrHeight: MAX_IMAGE_WIDTH,
    useWebWorker: true,
    fileType: "image/webp" as const,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error("Image compression failed:", error);
    return file;
  }
}

/**
 * Validate video file (size and duration)
 */
export async function validateVideo(file: File): Promise<{ valid: boolean; error?: string }> {
  // Check file size
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > MAX_VIDEO_SIZE_MB) {
    return {
      valid: false,
      error: `영상 크기는 ${MAX_VIDEO_SIZE_MB}MB를 초과할 수 없습니다. (현재: ${sizeMB.toFixed(1)}MB)`,
    };
  }

  // Check video duration
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      if (video.duration > MAX_VIDEO_DURATION_SECONDS) {
        resolve({
          valid: false,
          error: `영상 길이는 ${MAX_VIDEO_DURATION_SECONDS}초를 초과할 수 없습니다. (현재: ${Math.round(video.duration)}초)`,
        });
      } else {
        resolve({ valid: true });
      }
    };

    video.onerror = () => {
      resolve({ valid: false, error: "영상 파일을 읽을 수 없습니다." });
    };

    video.src = URL.createObjectURL(file);
  });
}

/**
 * Upload image to Supabase storage with optimization
 */
export async function uploadImage(
  file: File,
  userId: string
): Promise<UploadResult | UploadError> {
  const supabase = createClient();

  try {
    console.log("[uploadImage] Starting compression...", file.name, file.size);

    // Compress image
    const compressedFile = await compressImage(file);
    console.log("[uploadImage] Compression complete. New size:", compressedFile.size);

    // Generate unique filename
    const fileExt = "webp";
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    console.log("[uploadImage] Starting upload to community-media bucket...", fileName);

    // Upload to Supabase storage (직접 await로 실제 에러 확인)
    const { data, error } = await supabase.storage
      .from("community-media")
      .upload(fileName, compressedFile, {
        contentType: "image/webp",
        cacheControl: "3600",
        upsert: false,
      });

    console.log("[uploadImage] Upload result:", { data, error });

    // 에러 상세 정보 출력
    if (error) {
      console.error("[uploadImage] Detailed error:", {
        message: error.message,
        statusCode: (error as any).statusCode,
        error: (error as any).error,
        details: error
      });
    }

    if (error) {
      return { message: `이미지 업로드 실패: ${error.message}` };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("community-media")
      .getPublicUrl(data.path);

    console.log("[uploadImage] Upload successful:", urlData.publicUrl);

    return {
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error("[uploadImage] Upload error:", error);
    return {
      message: error instanceof Error ? error.message : "이미지 업로드 중 오류가 발생했습니다.",
    };
  }
}

/**
 * Upload video to Supabase storage with validation
 */
export async function uploadVideo(
  file: File,
  userId: string
): Promise<UploadResult | UploadError> {
  const supabase = createClient();

  try {
    // Validate video
    const validation = await validateVideo(file);
    if (!validation.valid) {
      return { message: validation.error || "영상 유효성 검사 실패" };
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop() || "mp4";
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from("community-media")
      .upload(fileName, file, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      return { message: `영상 업로드 실패: ${error.message}` };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("community-media")
      .getPublicUrl(data.path);

    return {
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "영상 업로드 중 오류가 발생했습니다.",
    };
  }
}

/**
 * Delete media from Supabase storage
 */
export async function deleteMedia(path: string): Promise<boolean> {
  const supabase = createClient();

  try {
    const { error } = await supabase.storage
      .from("community-media")
      .remove([path]);

    return !error;
  } catch {
    return false;
  }
}

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

/**
 * Check if file is a video
 */
export function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/");
}
