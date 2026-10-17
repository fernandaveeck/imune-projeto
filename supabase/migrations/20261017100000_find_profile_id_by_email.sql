CREATE OR REPLACE FUNCTION public.can_view_profile(target_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT target_profile_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.pets AS p
      LEFT JOIN public.pet_cotitulares AS pc ON pc.pet_id = p.id
      WHERE (p.owner_id = auth.uid() OR public.is_pet_cotitular(p.id))
        AND (p.owner_id = target_profile_id OR pc.profile_id = target_profile_id)
    );
$$;

REVOKE ALL ON FUNCTION public.can_view_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_profile(uuid) TO authenticated;

DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Users can view own and shared profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.can_view_profile(id));

CREATE OR REPLACE FUNCTION public.find_profile_id_by_email(lookup_email text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.id
  FROM public.profiles AS p
  WHERE auth.uid() IS NOT NULL
    AND p.id <> auth.uid()
    AND lower(btrim(p.email)) = lower(btrim(lookup_email))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.find_profile_id_by_email(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.find_profile_id_by_email(text) TO authenticated;
