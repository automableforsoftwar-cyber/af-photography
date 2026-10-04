-- Competitions control plane (applied via Supabase migration competitions_management)

CREATE TABLE IF NOT EXISTS public.competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id text NOT NULL,
  title text NOT NULL DEFAULT 'مسابقة التصوير',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  max_votes_per_user integer NOT NULL DEFAULT 3 CHECK (max_votes_per_user >= 1),
  announced_start boolean NOT NULL DEFAULT false,
  announced_end boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT competitions_time_range CHECK (ends_at > starts_at)
);

ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS competition_id uuid REFERENCES public.competitions (id) ON DELETE SET NULL;
