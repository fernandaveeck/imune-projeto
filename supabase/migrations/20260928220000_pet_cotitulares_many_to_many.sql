CREATE TABLE public.pet_cotitulares (
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pet_cotitulares_pkey PRIMARY KEY (pet_id, profile_id)
);

CREATE INDEX pet_cotitulares_profile_id_idx
  ON public.pet_cotitulares(profile_id);

GRANT SELECT, INSERT, DELETE ON public.pet_cotitulares TO authenticated;
GRANT ALL ON public.pet_cotitulares TO service_role;

ALTER TABLE public.pet_cotitulares ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_pet_owner(target_pet_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.pets
    WHERE id = target_pet_id AND owner_id = (SELECT auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.is_pet_cotitular(target_pet_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.pet_cotitulares
    WHERE pet_id = target_pet_id AND profile_id = (SELECT auth.uid())
  );
$$;

REVOKE ALL ON FUNCTION public.is_pet_owner(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_pet_cotitular(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_pet_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_pet_cotitular(uuid) TO authenticated;

CREATE POLICY "Users can view their pet cotitular relations"
  ON public.pet_cotitulares FOR SELECT TO authenticated
  USING (
    profile_id = (SELECT auth.uid())
    OR public.is_pet_owner(pet_id)
    OR public.is_pet_cotitular(pet_id)
  );

CREATE POLICY "Pet owners can add cotitulares"
  ON public.pet_cotitulares FOR INSERT TO authenticated
  WITH CHECK (
    public.is_pet_owner(pet_id)
    AND profile_id <> (SELECT auth.uid())
  );

CREATE POLICY "Pet owners can remove cotitulares"
  ON public.pet_cotitulares FOR DELETE TO authenticated
  USING (public.is_pet_owner(pet_id));

DROP POLICY IF EXISTS "Author or co-author can view pet photos" ON storage.objects;
CREATE POLICY "Owner or cotitular can view pet photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'pet-photos'
    AND (
      (storage.foldername(name))[1] = (SELECT auth.uid())::text
      OR EXISTS (
        SELECT 1
        FROM public.pets p
        WHERE p.photo_path = objects.name
          AND (
            p.owner_id = (SELECT auth.uid())
            OR public.is_pet_cotitular(p.id)
          )
      )
    )
  );

DROP POLICY IF EXISTS "Author or co-author can view pet" ON public.pets;
CREATE POLICY "Owner or cotitular can view pet"
  ON public.pets FOR SELECT TO authenticated
  USING (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1
      FROM public.pet_cotitulares pc
      WHERE pc.pet_id = pets.id AND pc.profile_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Author or co-author can view vaccinations" ON public.vaccinations;
CREATE POLICY "Owner or cotitular can view vaccinations"
  ON public.vaccinations FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.pets p WHERE p.id = pet_id
  ));

DROP INDEX IF EXISTS public.pets_co_author_id_idx;
ALTER TABLE public.pets DROP CONSTRAINT IF EXISTS pets_coauthor_check;
ALTER TABLE public.pets DROP COLUMN IF EXISTS co_author_id;
