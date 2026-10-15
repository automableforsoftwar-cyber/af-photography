-- AF P · Staff can delete competition posts; storage cleanup never blocks DELETE
-- Applied via Supabase migration: fix_community_posts_staff_delete_and_storage_trigger

DROP POLICY IF EXISTS "community_posts_delete_own_or_staff" ON public.community_posts;
DROP POLICY IF EXISTS "community_posts_staff_delete" ON public.community_posts;

CREATE POLICY "community_posts_staff_delete"
  ON public.community_posts
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('instructor', 'organizer')
        AND COALESCE(p.is_blocked, false) = false
    )
  );
