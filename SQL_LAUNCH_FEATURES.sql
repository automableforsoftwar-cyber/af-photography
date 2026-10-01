-- ============================================================
-- AF P LAUNCH SQL — run in Supabase SQL Editor if needed
-- (Already applied via MCP migration on production project)
-- ============================================================

-- 1) Post metadata
ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS user_name TEXT;

ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS description TEXT;

UPDATE public.community_posts
SET user_name = COALESCE(user_name, author_label)
WHERE user_name IS NULL;

UPDATE public.community_posts
SET description = COALESCE(description, title)
WHERE description IS NULL;

-- 2) One vote per user per photo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'votes_post_user_key'
      AND conrelid = 'public.votes'::regclass
  ) THEN
    ALTER TABLE public.votes
      ADD CONSTRAINT votes_post_user_key UNIQUE (post_id, user_id);
  END IF;
END $$;

-- 3) Amgad direct inbox
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT NOT NULL,
  sender_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  sender_name TEXT,
  body TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS direct_messages_course_sender_idx
  ON public.direct_messages (course_id, sender_id, created_at DESC);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dm_select_own" ON public.direct_messages;
DROP POLICY IF EXISTS "dm_insert_own" ON public.direct_messages;

CREATE POLICY "dm_select_own"
  ON public.direct_messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id);

CREATE POLICY "dm_insert_own"
  ON public.direct_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.user_courses uc
      WHERE uc.user_id = auth.uid()
        AND uc.course_id = direct_messages.course_id
        AND uc.expires_at > timezone('utc'::text, now())
    )
  );

-- 4) Public storage bucket for device uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community_images',
  'community_images',
  true,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "community_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "community_images_auth_upload" ON storage.objects;
DROP POLICY IF EXISTS "community_images_auth_update_own" ON storage.objects;
DROP POLICY IF EXISTS "community_images_auth_delete_own" ON storage.objects;

CREATE POLICY "community_images_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'community_images');

CREATE POLICY "community_images_auth_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'community_images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "community_images_auth_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'community_images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'community_images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "community_images_auth_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'community_images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
