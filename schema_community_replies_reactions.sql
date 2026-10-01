-- AF P · Community replies + emoji reactions
-- Run in Supabase SQL Editor if not already applied via migration.

-- ---------------------------------------------------------------------------
-- course_messages (community chat)
-- ---------------------------------------------------------------------------
ALTER TABLE public.course_messages
  ADD COLUMN IF NOT EXISTS reply_to_id UUID
    REFERENCES public.course_messages (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reactions JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS course_messages_reply_to_id_idx
  ON public.course_messages (reply_to_id);

COMMENT ON COLUMN public.course_messages.reply_to_id IS
  'Optional parent message for quoted/threaded replies';
COMMENT ON COLUMN public.course_messages.reactions IS
  'Emoji map: { "👍": ["user-uuid", ...], "❤️": ["user-uuid"] }';

-- ---------------------------------------------------------------------------
-- community_posts (gallery / competition) — same shape for consistency
-- ---------------------------------------------------------------------------
ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS reply_to_id UUID
    REFERENCES public.community_posts (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reactions JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS community_posts_reply_to_id_idx
  ON public.community_posts (reply_to_id);
