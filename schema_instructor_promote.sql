-- Instructor-only staff promotion (role/title changes)
CREATE OR REPLACE FUNCTION public.is_instructor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'instructor'
      AND COALESCE(is_blocked, false) = false
  );
$$;

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
    IF TG_OP = 'UPDATE' AND NEW.is_chat_blocked IS DISTINCT FROM OLD.is_chat_blocked THEN
      NEW.is_chat_blocked := OLD.is_chat_blocked;
    END IF;
    RETURN NEW;
  END IF;

  -- Organizers: mute/block only — cannot change roles
  IF NOT public.is_instructor() THEN
    NEW.role := OLD.role;
    NEW.title := OLD.title;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "profiles_staff_update" ON public.profiles;
CREATE POLICY "profiles_staff_update"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());
