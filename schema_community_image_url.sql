-- AF P · community_posts.image_url (already present — safe to re-run)
ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS image_url text;

-- course_messages.image_url used by #عام / #الصور chat channels
ALTER TABLE public.course_messages
  ADD COLUMN IF NOT EXISTS image_url text;
