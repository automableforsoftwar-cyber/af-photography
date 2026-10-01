-- AF P · Peer DM image support
-- Run in Supabase SQL Editor if not already applied.

ALTER TABLE public.direct_messages
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Optional: free Storage when a DM with an image is deleted (3-day purge)
DROP TRIGGER IF EXISTS trg_delete_peer_dm_image ON public.direct_messages;
CREATE TRIGGER trg_delete_peer_dm_image
  AFTER DELETE ON public.direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_community_image_from_storage();
