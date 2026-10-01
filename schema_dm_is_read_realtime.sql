-- AF P · Unread flags + Realtime for peer direct_messages
-- Run in Supabase SQL Editor.

ALTER TABLE public.direct_messages
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS direct_messages_receiver_unread_idx
  ON public.direct_messages (receiver_id, is_read)
  WHERE is_read = false;

DROP POLICY IF EXISTS "dm_peer_update_read" ON public.direct_messages;
CREATE POLICY "dm_peer_update_read"
  ON public.direct_messages FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id OR auth.uid() = sender_id)
  WITH CHECK (auth.uid() = receiver_id OR auth.uid() = sender_id);

-- Enable Realtime replication for live INSERT notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'direct_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
  END IF;
END $$;
