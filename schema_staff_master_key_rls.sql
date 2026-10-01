-- AF P · Staff Master Key RLS (instructor / organizer)
-- Complements app-level VIP bypass.

DROP POLICY IF EXISTS "user_courses_staff_select" ON public.user_courses;
CREATE POLICY "user_courses_staff_select"
  ON public.user_courses FOR SELECT TO authenticated
  USING (public.is_staff());

DROP POLICY IF EXISTS "user_courses_staff_write" ON public.user_courses;
CREATE POLICY "user_courses_staff_write"
  ON public.user_courses FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "course_messages_staff_update" ON public.course_messages;
CREATE POLICY "course_messages_staff_update"
  ON public.course_messages FOR UPDATE TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "community_posts_staff_update" ON public.community_posts;
CREATE POLICY "community_posts_staff_update"
  ON public.community_posts FOR UPDATE TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "dm_staff_select" ON public.direct_messages;
CREATE POLICY "dm_staff_select"
  ON public.direct_messages FOR SELECT TO authenticated
  USING (public.is_staff());

DROP POLICY IF EXISTS "dm_staff_delete" ON public.direct_messages;
CREATE POLICY "dm_staff_delete"
  ON public.direct_messages FOR DELETE TO authenticated
  USING (public.is_staff());

DROP POLICY IF EXISTS "amgad_staff_select" ON public.amgad_messages;
CREATE POLICY "amgad_staff_select"
  ON public.amgad_messages FOR SELECT TO authenticated
  USING (public.is_staff());

DROP POLICY IF EXISTS "amgad_staff_delete" ON public.amgad_messages;
CREATE POLICY "amgad_staff_delete"
  ON public.amgad_messages FOR DELETE TO authenticated
  USING (public.is_staff());

DROP POLICY IF EXISTS "access_codes_staff_all" ON public.access_codes;
CREATE POLICY "access_codes_staff_all"
  ON public.access_codes FOR ALL TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "votes_staff_delete" ON public.votes;
CREATE POLICY "votes_staff_delete"
  ON public.votes FOR DELETE TO authenticated
  USING (public.is_staff());

DROP POLICY IF EXISTS "user_progress_staff_select" ON public.user_progress;
CREATE POLICY "user_progress_staff_select"
  ON public.user_progress FOR SELECT TO authenticated
  USING (public.is_staff());
