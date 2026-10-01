-- AF P · 3-day chat / post retention
-- Run in Supabase SQL Editor (Dashboard → SQL).
-- Deletes course chat, Amgad inbox DMs, and community posts older than 3 days.
-- Votes cascade when posts are deleted (FK ON DELETE CASCADE).

-- ---------------------------------------------------------------------------
-- A) One-shot purge (run anytime)
-- ---------------------------------------------------------------------------
DELETE FROM public.course_messages
WHERE created_at < now() - interval '3 days';

DELETE FROM public.direct_messages
WHERE created_at < now() - interval '3 days';

DELETE FROM public.community_posts
WHERE created_at < now() - interval '3 days';

-- ---------------------------------------------------------------------------
-- B) Automatic daily purge via pg_cron (03:00 UTC)
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Unschedule prior job with the same name (safe if missing)
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'purge-chats-older-than-3-days';

SELECT cron.schedule(
  'purge-chats-older-than-3-days',
  '0 3 * * *',
  $$
  DELETE FROM public.course_messages
  WHERE created_at < now() - interval '3 days';

  DELETE FROM public.direct_messages
  WHERE created_at < now() - interval '3 days';

  DELETE FROM public.community_posts
  WHERE created_at < now() - interval '3 days';
  $$
);
