-- AF P · Session-based auth upgrade
-- Phone-as-email accounts link profiles.id → auth.users(id)
-- Run this in the Supabase SQL Editor (or via migration tooling).

-- ---------------------------------------------------------------------------
-- A. profiles: link to auth.users
-- ---------------------------------------------------------------------------

-- Clear rows that cannot satisfy the new FK (legacy VIP-gate rows).
DELETE FROM public.profiles
WHERE id NOT IN (SELECT id FROM auth.users);

ALTER TABLE public.profiles
  ALTER COLUMN id DROP DEFAULT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_id_fkey'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_id_fkey
      FOREIGN KEY (id)
      REFERENCES auth.users (id)
      ON DELETE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_number_key
  ON public.profiles (phone_number);

-- ---------------------------------------------------------------------------
-- B. user_progress
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  completed_lessons JSONB NOT NULL DEFAULT '[]'::jsonb,
  score INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT user_progress_user_id_key UNIQUE (user_id)
);

-- ---------------------------------------------------------------------------
-- C. Re-enable RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- D. RLS policies
-- ---------------------------------------------------------------------------

-- access_codes: public can read (VIP validation before signup);
--              authenticated can update uses after successful signup.
DROP POLICY IF EXISTS "anon_select_access_codes" ON public.access_codes;
DROP POLICY IF EXISTS "anon_update_access_codes" ON public.access_codes;
DROP POLICY IF EXISTS "public_select_access_codes" ON public.access_codes;
DROP POLICY IF EXISTS "authenticated_update_access_codes" ON public.access_codes;

CREATE POLICY "public_select_access_codes"
  ON public.access_codes
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "authenticated_update_access_codes"
  ON public.access_codes
  FOR UPDATE
  TO authenticated
  USING (current_uses < max_uses)
  WITH CHECK (current_uses <= max_uses AND current_uses >= 0);

-- profiles: own row only (SELECT / UPDATE / INSERT own id)
DROP POLICY IF EXISTS "anon_select_profiles" ON public.profiles;
DROP POLICY IF EXISTS "anon_insert_profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- user_progress: own rows only
DROP POLICY IF EXISTS "user_progress_select_own" ON public.user_progress;
DROP POLICY IF EXISTS "user_progress_update_own" ON public.user_progress;
DROP POLICY IF EXISTS "user_progress_insert_own" ON public.user_progress;

CREATE POLICY "user_progress_select_own"
  ON public.user_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_progress_update_own"
  ON public.user_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_progress_insert_own"
  ON public.user_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
