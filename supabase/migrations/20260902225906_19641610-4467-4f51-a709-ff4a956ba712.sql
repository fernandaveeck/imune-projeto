CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.profiles TO authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  co_author_id uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  species text NOT NULL,
  breed text NOT NULL,
  birth_date date NULL,
  approx_birth_year smallint NULL,
  weight numeric NOT NULL,
  sex text NOT NULL,
  photo_path text NOT NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pets_species_check CHECK (species IN ('cao','gato')),
  CONSTRAINT pets_sex_check CHECK (sex IN ('macho','femea')),
  CONSTRAINT pets_weight_check CHECK (weight > 0),
  CONSTRAINT pets_coauthor_check CHECK (co_author_id IS NULL OR co_author_id <> owner_id),
  CONSTRAINT pets_birth_check CHECK (
    (birth_date IS NOT NULL AND approx_birth_year IS NULL)
    OR (birth_date IS NULL AND approx_birth_year IS NOT NULL)
  )
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pets TO authenticated;
GRANT ALL ON public.pets TO service_role;

ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Author or co-author can view pet"
  ON public.pets FOR SELECT TO authenticated
  USING (auth.uid() = owner_id OR auth.uid() = co_author_id);

CREATE POLICY "Author can insert pet"
  ON public.pets FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Author can update pet"
  ON public.pets FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Author can delete pet"
  ON public.pets FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TABLE public.vaccinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  name text NOT NULL,
  administered_at date NOT NULL,
  next_due_at date NOT NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vaccinations_dates_check CHECK (next_due_at >= administered_at)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vaccinations TO authenticated;
GRANT ALL ON public.vaccinations TO service_role;

ALTER TABLE public.vaccinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Author or co-author can view vaccinations"
  ON public.vaccinations FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.pets p
    WHERE p.id = pet_id AND (auth.uid() = p.owner_id OR auth.uid() = p.co_author_id)
  ));

CREATE POLICY "Author can insert vaccinations"
  ON public.vaccinations FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.pets p WHERE p.id = pet_id AND auth.uid() = p.owner_id));

CREATE POLICY "Author can update vaccinations"
  ON public.vaccinations FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pets p WHERE p.id = pet_id AND auth.uid() = p.owner_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.pets p WHERE p.id = pet_id AND auth.uid() = p.owner_id));

CREATE POLICY "Author can delete vaccinations"
  ON public.vaccinations FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pets p WHERE p.id = pet_id AND auth.uid() = p.owner_id));

CREATE INDEX pets_owner_id_idx ON public.pets(owner_id);
CREATE INDEX pets_co_author_id_idx ON public.pets(co_author_id);
CREATE INDEX vaccinations_pet_id_idx ON public.vaccinations(pet_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON public.pets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vaccinations_updated_at BEFORE UPDATE ON public.vaccinations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();