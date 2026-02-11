# 영상 업로드 트러블슈팅 문서

## 📋 목차
- [문제 개요](#문제-개요)
- [문제 1: 로그아웃 멈춤](#문제-1-로그아웃-멈춤)
- [문제 2: 썸네일/영상 업로드 멈춤](#문제-2-썸네일영상-업로드-멈춤)
- [문제 3: Server Action 파일 크기 제한](#문제-3-server-action-파일-크기-제한)
- [최종 해결책: Presigned URL](#최종-해결책-presigned-url)
- [구현 세부사항](#구현-세부사항)
- [교훈](#교훈)

---

## 문제 개요

**환경:**
- Next.js 15.2.8
- Supabase (`@supabase/ssr` 0.8.0, `@supabase/supabase-js` 2.90.1)
- React 18.3.1

**증상:**
강의 생성 페이지에서 썸네일과 영상 파일 업로드 시 프로세스가 멈추고 무한 대기 상태 발생.

---

## 문제 1: 로그아웃 멈춤

### 증상
```typescript
await supabase.auth.signOut()  // 여기서 멈춤
```

로그아웃 페이지(`/auth/logout`)에서 "로그아웃 중..." 상태로 멈추고 더 이상 진행되지 않음.

### 콘솔 로그
```
[Logout] Starting logout process...
[signOut] Creating Supabase client...
[signOut] Calling supabase.auth.signOut()...
// 여기서 멈춤, 에러도 없음
```

### 시도한 해결 방법들

#### 1차 시도: `scope: 'local'` 옵션 추가
```typescript
await supabase.auth.signOut({ scope: 'local' })
```
**결과:** ❌ 실패 - 여전히 멈춤

#### 2차 시도: 타임아웃 추가
```typescript
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error("타임아웃")), 30000)
)
await Promise.race([supabase.auth.signOut(), timeoutPromise])
```
**결과:** ❌ 실패 - 30초 후 타임아웃 에러 발생

### 최종 해결: 직접 스토리지 정리
```typescript
// Supabase signOut() 호출 제거
// 직접 스토리지 정리
sessionStorage.clear()
localStorage.clear()

// 서버 쿠키는 API 라우트로 삭제
await fetch('/api/logout', { method: 'POST' })

// 전체 페이지 새로고침으로 리다이렉트
window.location.href = "/"
```

**결과:** ✅ 성공

### 원인 분석
- Supabase 브라우저 클라이언트 SDK의 특정 비동기 메서드(`auth.signOut()`)가 응답을 반환하지 않음
- 내부적으로 무언가를 기다리고 있지만 타임아웃이나 에러를 발생시키지 않음
- LockManager API 관련 이슈일 가능성 (이미 `noOpLock` 적용했지만 효과 없음)

---

## 문제 2: 썸네일/영상 업로드 멈춤

### 증상
```typescript
const { data, error } = await supabase.storage
  .from("community-media")
  .upload(fileName, file, {...})
// 여기서 멈춤
```

### 콘솔 로그
```
[uploadImage] Starting compression... 사진.jpeg 981160
[uploadImage] Compression complete. New size: 509104
[uploadImage] Starting upload to community-media bucket...
// 여기서 멈춤, 네트워크 요청도 안 나감
```

### 확인 사항
1. **Storage 버킷 설정** ✅ 정상
   - `community-media` 버킷 존재
   - Public bucket 활성화
   - RLS 정책 설정됨 (INSERT, SELECT, DELETE)

2. **네트워크 탭** 확인
   - Supabase Storage API 요청 자체가 나가지 않음
   - 브라우저에서 SDK 레벨에서 멈춤

### 시도한 해결 방법들

#### 1차 시도: 타임아웃 추가
```typescript
const uploadPromise = supabase.storage.from("community-media").upload(...)
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error("타임아웃")), 30000)
)
const result = await Promise.race([uploadPromise, timeoutPromise])
```
**결과:** ❌ 실패 - 30초 타임아웃

#### 2차 시도: Server Action으로 우회
```typescript
// Server Action (서버에서 실행)
export async function uploadCourseImage(formData: FormData) {
  const supabase = await createClient() // 서버 클라이언트
  const { data, error } = await supabase.storage
    .from("community-media")
    .upload(fileName, file)
  return { url: data.publicUrl }
}
```
**결과:** ✅ 서버에서는 정상 작동!

하지만 새로운 문제 발생...

---

## 문제 3: Server Action 파일 크기 제한

### 증상
```
[Video 1] Uploading to server...
// 5.6MB 영상에서 멈춤
```

영상 파일이 Server Action으로 전송될 때 멈춤. 썸네일(981KB)은 성공했지만 영상(5.6MB)은 실패.

### 원인
Next.js Server Action의 기본 body 크기 제한: **1MB**

### 시도한 해결: `next.config.ts` 설정
```typescript
experimental: {
  serverActions: {
    bodySizeLimit: "500mb",
  },
}
```

**문제점:**
- 파일이 브라우저 → Next.js 서버 → Supabase Storage로 **2번 전송**됨
- Next.js 서버 메모리 사용
- 대용량 파일(GB급)에는 부적합
- 타임아웃 가능성

---

## 최종 해결책: Presigned URL

### 개념
1. **서버**: 업로드 권한만 발급 (Presigned URL)
2. **브라우저**: Supabase Storage에 **직접 업로드**
3. **서버**: DB 레코드만 생성

### 장점
✅ **Supabase 클라이언트 SDK 완전 우회**
- `supabase.storage.upload()` 사용 안 함
- 순수 `fetch` API만 사용

✅ **대용량 파일 지원**
- GB급 파일도 가능
- Next.js 서버 메모리 영향 없음

✅ **빠른 업로드**
- 중간 서버 거치지 않음
- 브라우저 → Supabase 직접 연결

✅ **진행률 표시 가능**
- `fetch` API의 `ReadableStream` 사용 가능

### 아키텍처 비교

**❌ 기존 방식 (클라이언트 SDK):**
```
브라우저 --[supabase.storage.upload()]--> Supabase Storage
         ❌ 멈춤
```

**⚠️ Server Action 방식:**
```
브라우저 --[FormData]--> Next.js 서버 --[supabase.storage.upload()]--> Supabase Storage
         (5MB 제한)        (메모리 사용)
```

**✅ Presigned URL 방식:**
```
1. 브라우저 --[파일명, 타입]--> Next.js 서버
                                    ↓
                              [Presigned URL 생성]
                                    ↓
2. 브라우저 <--[Upload URL]-- Next.js 서버

3. 브라우저 --[fetch PUT]--> Supabase Storage (직접)
```

---

## 구현 세부사항

### 1. Server Action: Presigned URL 생성

**파일:** `app/instructor/courses/new/actions.ts`

```typescript
"use server"

import { createClient } from "@/lib/server"

export async function createUploadUrl(
  fileName: string,
  fileType: string,
  userId: string
): Promise<{ uploadUrl: string; path: string; publicUrl: string } | { error: string }> {
  try {
    const supabase = await createClient()

    // 고유 파일명 생성
    const fileExt = fileName.split(".").pop() || "jpg"
    const uniqueFileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    // Presigned URL 생성 (5분간 유효)
    const { data, error } = await supabase.storage
      .from("community-media")
      .createSignedUploadUrl(uniqueFileName)

    if (error) {
      return { error: `업로드 URL 생성 실패: ${error.message}` }
    }

    // Public URL 생성
    const { data: publicUrlData } = supabase.storage
      .from("community-media")
      .getPublicUrl(uniqueFileName)

    return {
      uploadUrl: data.signedUrl,
      path: uniqueFileName,
      publicUrl: publicUrlData.publicUrl,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "업로드 URL 생성 중 오류",
    }
  }
}
```

### 2. 클라이언트: 직접 업로드

**파일:** `components/course/create-course-form.tsx`

```typescript
const uploadFileWithPresignedUrl = async (
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; path: string } | { error: string }> => {
  try {
    // 1. Presigned URL 생성
    const urlResult = await createUploadUrl(file.name, file.type, userId)

    if ('error' in urlResult) {
      return { error: urlResult.error }
    }

    console.log(`[Upload] Got presigned URL, uploading ${file.name}...`)

    // 2. Presigned URL로 직접 업로드
    const uploadResponse = await fetch(urlResult.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
        'x-upsert': 'false',
      },
    })

    if (!uploadResponse.ok) {
      return { error: `업로드 실패: ${uploadResponse.statusText}` }
    }

    console.log(`[Upload] ✅ Upload successful: ${file.name}`)

    return {
      url: urlResult.publicUrl,
      path: urlResult.path,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : '업로드 중 오류',
    }
  }
}
```

### 3. 사용 예시

```typescript
// 썸네일 업로드
const thumbnailResult = await uploadFileWithPresignedUrl(
  thumbnailFile,
  instructorId
)

if ('error' in thumbnailResult) {
  throw new Error(thumbnailResult.error)
}

thumbnailUrl = thumbnailResult.url

// 영상 업로드
const videoResult = await uploadFileWithPresignedUrl(
  videoFile,
  `courses/${courseId}`
)

if ('error' in videoResult) {
  throw new Error(videoResult.error)
}

// DB에 영상 레코드 생성
await createCourseVideo(courseId, {
  title: videoTitle,
  video_url: videoResult.url,
  duration: videoDuration,
  order_index: 0,
})
```

---

## 교훈

### 1. Supabase 클라이언트 SDK의 한계
- 특정 메서드(`auth.signOut()`, `storage.upload()`)가 브라우저 환경에서 불안정함
- 에러나 타임아웃 없이 무한 대기 상태 발생 가능
- 원인: LockManager API, 브라우저 제약, 네트워크 정책 등 복합적

### 2. Server Action의 한계
- 파일 전송에는 부적합 (크기 제한, 메모리 사용)
- DB 작업이나 인증 체크 같은 서버 로직에만 사용 권장

### 3. Presigned URL의 우수성
- 대용량 파일 업로드의 업계 표준 패턴
- AWS S3, Google Cloud Storage, Supabase Storage 모두 지원
- SDK 의존성 없이 순수 HTTP로 동작
- 확장성, 안정성, 성능 모두 우수

### 4. 디버깅 전략
1. **로그 추가**: 각 단계마다 콘솔 로그로 진행 상황 확인
2. **네트워크 탭**: 실제 HTTP 요청이 나가는지 확인
3. **타임아웃 테스트**: 무한 대기인지 느린 것인지 구분
4. **서버 vs 클라이언트**: 서버에서는 되는지 확인 (환경 차이 파악)
5. **대안 탐색**: 한 가지 방법에 집착하지 말고 다른 패턴 시도

### 5. 향후 개선 사항
- [ ] 업로드 진행률 표시 (XMLHttpRequest 또는 fetch stream 활용)
- [ ] 재시도 로직 (네트워크 에러 대응)
- [ ] 청크 업로드 (초대형 파일 지원)
- [ ] 업로드 취소 기능 (AbortController)
- [ ] 이미지 압축 최적화 (WebP 변환, 리사이징)
- [ ] 비디오 썸네일 자동 생성

---

## 참고 자료

- [Supabase Storage - Upload to signed URL](https://supabase.com/docs/reference/javascript/storage-from-upload-to-signed-url)
- [Next.js Server Actions - Body Size Limit](https://nextjs.org/docs/app/api-reference/next-config-js/serverActions)
- [MDN - Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [Supabase GitHub Issues](https://github.com/supabase/supabase-js/issues)

---

**작성일:** 2026-01-25
**작성자:** AI Assistant & User
**최종 수정일:** 2026-01-25
