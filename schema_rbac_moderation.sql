-- AF P · RBAC + moderation on profiles
-- Run in Supabase SQL Editor if not already applied via migration.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'student';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS title text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('instructor', 'organizer', 'student'));

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_title_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_title_check
  CHECK (title IS NULL OR title IN ('المدرب', 'المنظم'));

-- Optional: assign titles when promoting roles manually
-- UPDATE profiles SET role = 'instructor', title = 'المدرب' WHERE email = 'omar@…';
-- UPDATE profiles SET role = 'organizer', title = 'المنظم' WHERE email = '…';

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('instructor', 'organizer')
      AND COALESCE(is_blocked, false) = false
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_blocked()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_blocked FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_blocked() TO authenticated;

DROP POLICY IF EXISTS "profiles_staff_update" ON public.profiles;
CREATE POLICY "profiles_staff_update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "course_messages_insert_own" ON public.course_messages;
CREATE POLICY "course_messages_insert_own"
  ON public.course_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND NOT public.current_user_is_blocked()
  );

DROP POLICY IF EXISTS "course_messages_delete_own_or_staff" ON public.course_messages;
CREATE POLICY "course_messages_delete_own_or_staff"
  ON public.course_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_staff());

DROP POLICY IF EXISTS "dm_peer_insert" ON public.direct_messages;
CREATE POLICY "dm_peer_insert"
  ON public.direct_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND NOT public.current_user_is_blocked()
  );
