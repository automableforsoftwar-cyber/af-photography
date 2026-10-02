-- Staff-only writes on announcements / messages channels

DROP POLICY IF EXISTS "course_messages_insert_own" ON public.course_messages;
CREATE POLICY "course_messages_insert_own"
  ON public.course_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND NOT public.current_user_is_chat_blocked()
    AND (
      channel_id NOT IN ('announcements', 'messages', 'الرسائل', 'الإعلانات')
      OR public.is_staff()
    )
    AND (
      public.is_staff()
      OR EXISTS (
        SELECT 1 FROM public.user_courses uc
        WHERE uc.user_id = auth.uid()
          AND uc.course_id = course_messages.course_id
          AND uc.expires_at > timezone('utc'::text, now())
      )
    )
  );

DROP POLICY IF EXISTS "community_posts_insert_own" ON public.community_posts;
CREATE POLICY "community_posts_insert_own"
  ON public.community_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      channel_id IS NULL
      OR channel_id NOT IN ('announcements', 'messages', 'الرسائل', 'الإعلانات')
      OR public.is_staff()
    )
    AND (
      course_id IS NULL
      OR public.is_staff()
      OR EXISTS (
        SELECT 1 FROM public.user_courses uc
        WHERE uc.user_id = auth.uid()
          AND uc.course_id = community_posts.course_id
          AND uc.expires_at > timezone('utc'::text, now())
      )
    )
  );
