-- profiles.governorate + staff inbox SELECT for instructor & organizer

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS governorate TEXT;

DROP POLICY IF EXISTS "amgad_select" ON public.amgad_messages;
CREATE POLICY "amgad_select"
  ON public.amgad_messages
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = sender_id
    OR auth.uid() = recipient_id
    OR public.is_staff()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('instructor', 'organizer')
        AND COALESCE(p.is_blocked, false) = false
    )
  );

DROP POLICY IF EXISTS "dm_staff_select" ON public.direct_messages;
CREATE POLICY "dm_staff_select"
  ON public.direct_messages
  FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('instructor', 'organizer')
        AND COALESCE(p.is_blocked, false) = false
    )
  );
