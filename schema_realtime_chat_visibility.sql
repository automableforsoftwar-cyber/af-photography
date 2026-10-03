-- Recreate course_messages RLS + open SELECT for enrolled/staff
-- Add staff to community_posts SELECT
-- Publish chat tables to supabase_realtime

ALTER TABLE public.course_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "course_messages_select_authenticated" ON public.course_messages;
CREATE POLICY "course_messages_select_authenticated"
  ON public.course_messages
  FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    OR EXISTS (
      SELECT 1 FROM public.user_courses uc
      WHERE uc.user_id = auth.uid()
        AND uc.course_id = course_messages.course_id
        AND uc.expires_at > timezone('utc'::text, now())
    )
  );

DROP POLICY IF EXISTS "community_posts_public_select" ON public.community_posts;
CREATE POLICY "community_posts_public_select"
  ON public.community_posts
  FOR SELECT
  TO anon, authenticated
  USING (
    course_id IS NULL
    OR public.is_staff()
    OR (
      auth.uid() IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.user_courses uc
        WHERE uc.user_id = auth.uid()
          AND uc.course_id = community_posts.course_id
          AND uc.expires_at > timezone('utc'::text, now())
      )
    )
  );

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.course_messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

ALTER TABLE public.course_messages REPLICA IDENTITY FULL;
ALTER TABLE public.community_posts REPLICA IDENTITY FULL;
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;
