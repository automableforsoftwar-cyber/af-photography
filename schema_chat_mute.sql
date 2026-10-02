-- AF P · Chat mute flag on profiles + RLS enforcement
-- Run in Supabase SQL Editor.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_chat_blocked boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.current_user_is_chat_blocked()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_chat_blocked OR is_blocked FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.current_user_is_chat_blocked() TO authenticated;

DROP POLICY IF EXISTS "course_messages_insert_own" ON public.course_messages;
CREATE POLICY "course_messages_insert_own"
  ON public.course_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND NOT public.current_user_is_chat_blocked()
  );

DROP POLICY IF EXISTS "dm_peer_insert" ON public.direct_messages;
CREATE POLICY "dm_peer_insert"
  ON public.direct_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND NOT public.current_user_is_chat_blocked()
  );
