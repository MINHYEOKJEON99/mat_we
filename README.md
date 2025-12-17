# Mat We - 주짓수 커뮤니티 플랫폼

Mat We는 주짓수 강사와 수강생을 연결하는 풀스택 커뮤니티 플랫폼입니다.

## 주요 기능

### 1. 인증 시스템
- 이메일/비밀번호 로그인 및 회원가입
- 역할 기반 접근 (강사/수강생)
- Supabase Auth를 활용한 보안 인증

### 2. 강사 기능
- **강의 관리**: 강의 생성, 수정, 삭제
- **영상 관리**: Mux를 통한 영상 업로드 및 관리
- **PT 세션**: PT 요청 확인 및 일정 확정
- **실시간 채팅**: 수강생과 1:1 채팅

### 3. 수강생 기능
- **강의 둘러보기**: 모든 강의 검색 및 조회
- **강의 수강**: 강의 구매 및 영상 학습
- **PT 신청**: 강사에게 1:1 PT 신청
- **실시간 채팅**: 강사와 일정 조율

### 4. 커뮤니티
- **게시글 작성**: 주짓수 관련 경험 공유
- **댓글 및 좋아요**: 커뮤니티 상호작용
- **이미지 첨부**: 게시글에 이미지 추가

### 5. 영상 스트리밍
- **Mux 통합**: 안전하고 빠른 영상 스트리밍
- **적응형 스트리밍**: 네트워크 상황에 맞춘 자동 품질 조절
- **진도 관리**: 영상 시청 진도 추적 (추후 구현)

## 기술 스택

### Frontend
- Next.js 16 (App Router)
- React 19.2
- TypeScript
- Tailwind CSS v4
- shadcn/ui

### Backend
- Supabase (PostgreSQL)
- Supabase Auth
- Supabase Realtime (채팅)
- Row Level Security (RLS)

### Video Streaming
- Mux (비디오 스트리밍)
- Mux Player (비디오 플레이어)

## 데이터베이스 스키마

### 주요 테이블
- `profiles`: 사용자 프로필 (강사/수강생)
- `courses`: 강의 정보
- `course_videos`: 강의 영상
- `enrollments`: 수강 신청
- `pt_sessions`: PT 세션
- `chat_messages`: 채팅 메시지
- `community_posts`: 커뮤니티 게시글
- `post_comments`: 댓글
- `post_likes`: 좋아요

## 보안

### Row Level Security (RLS)
모든 테이블에 RLS가 적용되어 있습니다:
- 사용자는 자신의 데이터만 조회/수정 가능
- 강사는 자신의 강의만 관리 가능
- PT 세션은 참여자만 접근 가능

### 인증
- Supabase Auth를 통한 안전한 인증
- 이메일 확인 후 계정 활성화
- JWT 기반 세션 관리

## 시작하기

### 환경 변수 설정
프로젝트는 이미 Supabase와 연결되어 있습니다. 추가 환경 변수가 필요하지 않습니다.

### 데이터베이스 초기화
1. v0 UI에서 `scripts` 폴더의 SQL 파일을 순서대로 실행:
   - `001_create_tables.sql`
   - `002_enable_rls.sql`
   - `003_create_triggers.sql`

### 개발 서버 실행
```bash
npm install
npm run dev
```

## 배포

Vercel에 배포하려면:
1. v0 UI에서 "Publish" 버튼 클릭
2. Vercel 프로젝트와 연결
3. 자동으로 배포 완료

## Mux 설정

Mux를 사용하려면:
1. [Mux](https://mux.com)에서 계정 생성
2. 영상 업로드 후 Playback ID 획득
3. 강의 영상 관리 페이지에서 Playback ID 입력

### Mux 영상 업로드 방법
1. Mux 대시보드에서 새 영상 업로드
2. 업로드 완료 후 Playback ID 복사
3. Mat We의 강의 영상 관리에서 입력

## 향후 개발 계획

- [ ] 결제 시스템 통합 (Stripe)
- [ ] 영상 시청 진도 추적
- [ ] 수강평 및 별점 시스템
- [ ] 강사 프로필 페이지 개선
- [ ] 알림 시스템
- [ ] 모바일 앱 개발

## 라이선스

MIT License

## 문의

문제가 발생하거나 질문이 있으시면 이슈를 생성해주세요.
```

```tsx file="" isHidden
