-- Reinforce course_messages SELECT for staff + enrolled students
-- Announcements channel: staff-only INSERT
-- Ensure profiles.is_chat_blocked exists

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_chat_blocked BOOLEAN NOT NULL DEFAULT false;

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

DROP POLICY IF EXISTS "course_messages_insert_own" ON public.course_messages;
CREATE POLICY "course_messages_insert_own"
  ON public.course_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND NOT public.current_user_is_chat_blocked()
    AND (
      channel_id <> 'announcements'
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
