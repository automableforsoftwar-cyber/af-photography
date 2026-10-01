-- AF P · Exact email-based RBAC assignment (auth.users → profiles)
-- Run in Supabase SQL Editor. Emails must match registration exactly.

-- Ensure SQL editor / service role can write RBAC fields
CREATE OR REPLACE FUNCTION public.protect_profile_rbac_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF NOT public.is_staff() THEN
    NEW.role := OLD.role;
    NEW.title := OLD.title;
    NEW.is_blocked := OLD.is_blocked;
  END IF;
  RETURN NEW;
END;
$$;

-- 1) Instructor
UPDATE public.profiles p
SET role = 'instructor',
    title = 'المدرب'
WHERE p.id = (
  SELECT u.id
  FROM auth.users u
  WHERE lower(u.email) = lower('amgadfarid200@gmail.com')
  LIMIT 1
);

-- 2–5) Organizers (note mohamedabso200@gmil.com spelling)
UPDATE public.profiles p
SET role = 'organizer',
    title = 'المنظم'
WHERE p.id IN (
  SELECT u.id
  FROM auth.users u
  WHERE lower(u.email) IN (
    lower('soha200@gmail.com'),
    lower('omarayman200@gmail.com'),
    lower('mohamedabso200@gmil.com'),
    lower('mohamedezzt200@gmail.com')
  )
);

-- Verify
SELECT u.email, p.role, p.title, p.is_blocked
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
WHERE lower(u.email) IN (
  'amgadfarid200@gmail.com',
  'soha200@gmail.com',
  'omarayman200@gmail.com',
  'mohamedabso200@gmil.com',
  'mohamedezzt200@gmail.com'
)
ORDER BY u.email;
