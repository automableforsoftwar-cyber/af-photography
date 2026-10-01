-- AF P · Sync Storage cleanup with 3-day post deletion
-- Run in Supabase SQL Editor.
-- When a community_posts row is deleted (e.g. by the 3-day purge),
-- this trigger removes the matching file from the community_images bucket.

CREATE OR REPLACE FUNCTION public.delete_community_image_from_storage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  object_path text;
BEGIN
  IF OLD.image_url IS NULL OR btrim(OLD.image_url) = '' THEN
    RETURN OLD;
  END IF;

  -- Public URL shape:
  -- .../storage/v1/object/public/community_images/{userId}/{file}
  object_path := substring(OLD.image_url FROM '/storage/v1/object/public/community_images/(.+)$');

  IF object_path IS NULL THEN
    -- Fallback: path after bucket name
    object_path := substring(OLD.image_url FROM '/community_images/(.+)$');
  END IF;

  IF object_path IS NULL OR btrim(object_path) = '' THEN
    RETURN OLD;
  END IF;

  -- Decode common URL encodings
  object_path := replace(object_path, '%20', ' ');
  object_path := regexp_replace(object_path, '[?#].*$', '');

  DELETE FROM storage.objects
  WHERE bucket_id = 'community_images'
    AND name = object_path;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_delete_community_post_image ON public.community_posts;
CREATE TRIGGER trg_delete_community_post_image
  AFTER DELETE ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_community_image_from_storage();

-- Also free storage when course chat / Amgad messages with images are purged
DROP TRIGGER IF EXISTS trg_delete_course_message_image ON public.course_messages;
CREATE TRIGGER trg_delete_course_message_image
  AFTER DELETE ON public.course_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_community_image_from_storage();

DROP TRIGGER IF EXISTS trg_delete_amgad_message_image ON public.amgad_messages;
CREATE TRIGGER trg_delete_amgad_message_image
  AFTER DELETE ON public.amgad_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_community_image_from_storage();

COMMENT ON FUNCTION public.delete_community_image_from_storage() IS
  'Deletes community_images storage object when a parent row with image_url is deleted (3-day retention sync).';
