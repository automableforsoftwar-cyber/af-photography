-- Launch migration mirror: 30-day expiry + isolated course communities
-- Applied remotely via Supabase MCP; kept in-repo for reference.

ALTER TABLE public.user_courses
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

UPDATE public.user_courses
SET expires_at = COALESCE(unlocked_at, timezone('utc'::text, now())) + INTERVAL '30 days'
WHERE expires_at IS NULL;

CREATE INDEX IF NOT EXISTS user_courses_expires_at_idx
  ON public.user_courses (expires_at);

ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS course_id TEXT;

ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS body TEXT;

ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS channel_id TEXT;

ALTER TABLE public.community_posts
  ALTER COLUMN image_url DROP NOT NULL;

ALTER TABLE public.community_posts
  ALTER COLUMN title DROP NOT NULL;

CREATE INDEX IF NOT EXISTS community_posts_course_id_idx
  ON public.community_posts (course_id);

CREATE TABLE IF NOT EXISTS public.course_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT NOT NULL,
  channel_id TEXT NOT NULL DEFAULT 'general',
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  author_label TEXT,
  body TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS course_messages_course_channel_idx
  ON public.course_messages (course_id, channel_id, created_at ASC);

ALTER TABLE public.course_messages ENABLE ROW LEVEL SECURITY;
