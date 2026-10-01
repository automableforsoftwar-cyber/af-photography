-- AF P · Peer-to-peer Direct Messages
-- Run in Supabase SQL Editor.
--
-- NOTE: The previous course-scoped Amgad inbox lived in `direct_messages`.
-- It is renamed to `amgad_messages` so this table can match the P2P schema.

-- ---------------------------------------------------------------------------
-- 1) Preserve Amgad inbox
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'direct_messages'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'direct_messages'
      AND column_name = 'course_id'
  ) THEN
    ALTER TABLE public.direct_messages RENAME TO amgad_messages;
  END IF;
END $$;

DROP POLICY IF EXISTS "dm_select_own" ON public.amgad_messages;
DROP POLICY IF EXISTS "dm_insert_own" ON public.amgad_messages;
DROP POLICY IF EXISTS "amgad_dm_select_own" ON public.amgad_messages;
DROP POLICY IF EXISTS "amgad_dm_insert_own" ON public.amgad_messages;

CREATE POLICY "amgad_dm_select_own"
  ON public.amgad_messages FOR SELECT TO authenticated
  USING (auth.uid() = sender_id);

CREATE POLICY "amgad_dm_insert_own"
  ON public.amgad_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.user_courses uc
      WHERE uc.user_id = auth.uid()
        AND uc.course_id = amgad_messages.course_id
        AND uc.expires_at > timezone('utc'::text, now())
    )
  );

-- ---------------------------------------------------------------------------
-- 2) Peer-to-peer direct_messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT direct_messages_no_self_chat CHECK (sender_id <> receiver_id)
);

CREATE INDEX IF NOT EXISTS direct_messages_sender_id_idx
  ON public.direct_messages (sender_id);
CREATE INDEX IF NOT EXISTS direct_messages_receiver_id_idx
  ON public.direct_messages (receiver_id);
CREATE INDEX IF NOT EXISTS direct_messages_pair_created_idx
  ON public.direct_messages (sender_id, receiver_id, created_at);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dm_peer_select" ON public.direct_messages;
DROP POLICY IF EXISTS "dm_peer_insert" ON public.direct_messages;

-- Users can ONLY read messages where they are sender OR receiver
CREATE POLICY "dm_peer_select"
  ON public.direct_messages FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can ONLY insert as themselves (sender_id = auth.uid())
CREATE POLICY "dm_peer_insert"
  ON public.direct_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- ---------------------------------------------------------------------------
-- 3) Allow authenticated users to read peer display names
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);
