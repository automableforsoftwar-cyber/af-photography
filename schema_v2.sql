-- AF P · schema_v2
-- Real-email accounts, course-specific single-use codes, public community voting.
-- IMPORTANT: No DELETE policies — progress and community data are retained permanently.

-- ---------------------------------------------------------------------------
-- 1. profiles — marketing identity (email); phone optional
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles
  ALTER COLUMN phone_number DROP NOT NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_key
  ON public.profiles (email)
  WHERE email IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. access_codes — course-specific + single-use friendly
-- ---------------------------------------------------------------------------

ALTER TABLE public.access_codes
  ADD COLUMN IF NOT EXISTS target_course TEXT;

-- Default existing codes to photographer-eye (primary product) if null
UPDATE public.access_codes
SET target_course = 'photographer-eye'
WHERE target_course IS NULL;

ALTER TABLE public.access_codes
  ALTER COLUMN target_course SET NOT NULL;

ALTER TABLE public.access_codes
  ALTER COLUMN max_uses SET DEFAULT 1;

CREATE INDEX IF NOT EXISTS access_codes_target_course_idx
  ON public.access_codes (target_course);

CREATE INDEX IF NOT EXISTS access_codes_code_idx
  ON public.access_codes (code);

-- ---------------------------------------------------------------------------
-- 3. user_courses — multiple enrollments per account
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  unlocked_via_code TEXT REFERENCES public.access_codes (code),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT user_courses_user_course_key UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS user_courses_user_id_idx
  ON public.user_courses (user_id);

CREATE INDEX IF NOT EXISTS user_courses_course_id_idx
  ON public.user_courses (course_id);

-- ---------------------------------------------------------------------------
-- 4. user_progress — granular per course (no deletion policies later)
-- ---------------------------------------------------------------------------

ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS course_id TEXT;

-- Backfill a placeholder for any legacy rows
UPDATE public.user_progress
SET course_id = 'photographer-eye'
WHERE course_id IS NULL;

-- Drop old unique-on-user_id if present, enforce (user_id, course_id)
ALTER TABLE public.user_progress
  DROP CONSTRAINT IF EXISTS user_progress_user_id_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_progress_user_course_key'
      AND conrelid = 'public.user_progress'::regclass
  ) THEN
    ALTER TABLE public.user_progress
      ADD CONSTRAINT user_progress_user_course_key
      UNIQUE (user_id, course_id);
  END IF;
END $$;

ALTER TABLE public.user_progress
  ALTER COLUMN course_id SET NOT NULL;

-- ---------------------------------------------------------------------------
-- 5. community_posts + votes (public FOMO showcase)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author_label TEXT,
  image_url TEXT NOT NULL,
  vote_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT votes_post_user_key UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS community_posts_created_at_idx
  ON public.community_posts (created_at DESC);

CREATE INDEX IF NOT EXISTS votes_post_id_idx
  ON public.votes (post_id);

-- ---------------------------------------------------------------------------
-- 6. RLS — enable everywhere; NO DELETE policies
-- ---------------------------------------------------------------------------

ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- access_codes --------------------------------------------------------------
DROP POLICY IF EXISTS "anon_select_access_codes" ON public.access_codes;
DROP POLICY IF EXISTS "anon_update_access_codes" ON public.access_codes;
DROP POLICY IF EXISTS "public_select_access_codes" ON public.access_codes;
DROP POLICY IF EXISTS "authenticated_update_access_codes" ON public.access_codes;
DROP POLICY IF EXISTS "authenticated_select_access_codes" ON public.access_codes;

CREATE POLICY "authenticated_select_access_codes"
  ON public.access_codes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated_update_access_codes"
  ON public.access_codes
  FOR UPDATE
  TO authenticated
  USING (current_uses < max_uses)
  WITH CHECK (current_uses <= max_uses AND current_uses >= 0);

-- profiles -----------------------------------------------------------------
DROP POLICY IF EXISTS "anon_select_profiles" ON public.profiles;
DROP POLICY IF EXISTS "anon_insert_profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- user_courses -------------------------------------------------------------
DROP POLICY IF EXISTS "user_courses_select_own" ON public.user_courses;
DROP POLICY IF EXISTS "user_courses_insert_own" ON public.user_courses;
DROP POLICY IF EXISTS "user_courses_update_own" ON public.user_courses;

CREATE POLICY "user_courses_select_own"
  ON public.user_courses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_courses_insert_own"
  ON public.user_courses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_courses_update_own"
  ON public.user_courses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- user_progress ------------------------------------------------------------
DROP POLICY IF EXISTS "user_progress_select_own" ON public.user_progress;
DROP POLICY IF EXISTS "user_progress_update_own" ON public.user_progress;
DROP POLICY IF EXISTS "user_progress_insert_own" ON public.user_progress;

CREATE POLICY "user_progress_select_own"
  ON public.user_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_progress_update_own"
  ON public.user_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_progress_insert_own"
  ON public.user_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- community_posts — public read (FOMO); auth write own ------------------
DROP POLICY IF EXISTS "community_posts_public_select" ON public.community_posts;
DROP POLICY IF EXISTS "community_posts_insert_own" ON public.community_posts;
DROP POLICY IF EXISTS "community_posts_update_vote" ON public.community_posts;

CREATE POLICY "community_posts_public_select"
  ON public.community_posts
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "community_posts_insert_own"
  ON public.community_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to bump vote_count (no DELETE)
CREATE POLICY "community_posts_update_vote"
  ON public.community_posts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- votes — public read counts; auth insert own; NO DELETE -----------------
DROP POLICY IF EXISTS "votes_public_select" ON public.votes;
DROP POLICY IF EXISTS "votes_insert_own" ON public.votes;

CREATE POLICY "votes_public_select"
  ON public.votes
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "votes_insert_own"
  ON public.votes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Explicit note: intentionally NO DELETE policies on
-- profiles, user_courses, user_progress, community_posts, votes.
