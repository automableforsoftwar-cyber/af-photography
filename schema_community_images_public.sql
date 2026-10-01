-- AF P · Ensure community_images is publicly readable
-- Run in Supabase SQL Editor if images 404 / fail to load.

UPDATE storage.buckets
SET public = true
WHERE id = 'community_images';

-- Anyone can read (public URLs work in <img> / next/image)
DROP POLICY IF EXISTS "community_images_public_read" ON storage.objects;
CREATE POLICY "community_images_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'community_images');
