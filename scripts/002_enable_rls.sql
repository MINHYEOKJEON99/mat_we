-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pt_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Courses policies
CREATE POLICY "Anyone can view courses"
  ON public.courses FOR SELECT
  USING (true);

CREATE POLICY "Instructors can insert their own courses"
  ON public.courses FOR INSERT
  WITH CHECK (
    auth.uid() = instructor_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'instructor')
  );

CREATE POLICY "Instructors can update their own courses"
  ON public.courses FOR UPDATE
  USING (auth.uid() = instructor_id);

CREATE POLICY "Instructors can delete their own courses"
  ON public.courses FOR DELETE
  USING (auth.uid() = instructor_id);

-- Course videos policies
CREATE POLICY "Anyone can view videos"
  ON public.course_videos FOR SELECT
  USING (true);

CREATE POLICY "Instructors can manage their course videos"
  ON public.course_videos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = course_videos.course_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- Enrollments policies
CREATE POLICY "Users can view their own enrollments"
  ON public.enrollments FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Instructors can view enrollments for their courses"
  ON public.enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = enrollments.course_id
      AND courses.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Students can enroll in courses"
  ON public.enrollments FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- PT sessions policies
CREATE POLICY "Users can view their own PT sessions"
  ON public.pt_sessions FOR SELECT
  USING (auth.uid() = instructor_id OR auth.uid() = student_id);

CREATE POLICY "Students can create PT sessions"
  ON public.pt_sessions FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Both parties can update PT sessions"
  ON public.pt_sessions FOR UPDATE
  USING (auth.uid() = instructor_id OR auth.uid() = student_id);

-- Chat messages policies
CREATE POLICY "Users can view messages in their PT sessions"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pt_sessions
      WHERE pt_sessions.id = chat_messages.pt_session_id
      AND (pt_sessions.instructor_id = auth.uid() OR pt_sessions.student_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their PT sessions"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.pt_sessions
      WHERE pt_sessions.id = chat_messages.pt_session_id
      AND (pt_sessions.instructor_id = auth.uid() OR pt_sessions.student_id = auth.uid())
    )
  );

-- Community posts policies
CREATE POLICY "Anyone can view posts"
  ON public.community_posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON public.community_posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts"
  ON public.community_posts FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts"
  ON public.community_posts FOR DELETE
  USING (auth.uid() = author_id);

-- Post comments policies
CREATE POLICY "Anyone can view comments"
  ON public.post_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.post_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments"
  ON public.post_comments FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments"
  ON public.post_comments FOR DELETE
  USING (auth.uid() = author_id);

-- Post likes policies
CREATE POLICY "Anyone can view likes"
  ON public.post_likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can like posts"
  ON public.post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON public.post_likes FOR DELETE
  USING (auth.uid() = user_id);
