export type UserRole = "instructor" | "student";

export type CourseLevel = "beginner" | "intermediate" | "advanced";

export type PTSessionStatus = "pending" | "confirmed" | "completed" | "cancelled";

// 관심 운동 종목 (추후 확장 가능)
export type SportType = "jiujitsu" | "wrestling" | "judo" | "mma";

export const SPORT_LABELS: Record<SportType, string> = {
  jiujitsu: "주짓수",
  wrestling: "레슬링",
  judo: "유도",
  mma: "종합격투기",
};

// 현재 지원하는 종목 (추후 확장 시 여기에 추가)
export const AVAILABLE_SPORTS: SportType[] = ["jiujitsu"];

// 카테고리 레벨 (1=종목, 2=포지션, 3=테크닉)
export type CategoryLevel = 1 | 2 | 3;

export const CATEGORY_LEVEL_LABELS: Record<CategoryLevel, string> = {
  1: "종목",
  2: "포지션",
  3: "테크닉",
};

export interface Profile {
  id: string;
  email: string | null;
  display_name: string;
  bio: string | null;
  role: UserRole;
  avatar_url: string | null;
  interested_sports: SportType[];
  is_profile_complete: boolean;
  requested_instructor?: boolean; // 강사 신청 대기 중 여부
  // PT 관련 필드 (강사 전용)
  pt_price_per_hour?: number | null;
  pt_description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  instructor_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  price: number;
  level: CourseLevel | null;
  average_rating: number;
  review_count: number;
  student_count: number;
  created_at: string;
  updated_at: string;
  instructor?: Profile;
  categories?: Category[];
}

export interface CourseVideo {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  mux_playback_id: string | null;
  mux_asset_id: string | null;
  duration: number | null;
  order_index: number;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  name_ko: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  level: CategoryLevel;
  sort_order: number;
  icon: string | null;
  created_at: string;
  parent?: Category;
  children?: Category[];
}

export interface CourseCategory {
  id: string;
  course_id: string;
  category_id: string;
  created_at: string;
  category?: Category;
}

export interface CourseReview {
  id: string;
  course_id: string;
  student_id: string;
  rating: number;
  content: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  student?: Profile;
  course?: Course;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  enrolled_at: string;
  course?: Course;
}

export interface PTSession {
  id: string;
  instructor_id: string;
  student_id: string;
  scheduled_at: string | null;
  duration: number;
  status: PTSessionStatus;
  price: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  instructor?: Profile;
  student?: Profile;
}

export interface ChatMessage {
  id: string;
  pt_session_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender?: Profile;
}

export interface CommunityPost {
  id: string;
  author_id: string;
  title: string;
  content: string;
  image_url: string | null;
  likes_count: number;
  views_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  author?: Profile;
}

export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: Profile;
}

export interface PostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

// 강사 신청 상태
export type InstructorApplicationStatus = "pending" | "approved" | "rejected";

export interface InstructorApplication {
  id: string;
  user_id: string;
  status: InstructorApplicationStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  user?: Profile;
}
