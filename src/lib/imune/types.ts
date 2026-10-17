export interface Profile {
  id: string;
  name: string;
  email: string;
}

export interface Vaccination {
  id: string;
  pet_id: string;
  name: string;
  administered_at: string;
  next_due_at: string;
  notes: string | null;
}

export interface Pet {
  id: string;
  owner_id: string;
  name: string;
  species: string;
  breed: string;
  birth_date: string | null;
  approx_birth_year: number | null;
  weight: number;
  sex: string;
  photo_path: string;
  notes: string | null;
}

export interface PetWithRelations extends Pet {
  owner: Profile | null;
  cotitulares: Profile[];
  vaccinations: Vaccination[];
}

export interface PetListItem extends Pet {
  owner: Profile | null;
  vaccinations: Vaccination[];
}

export interface VaccineInput {
  id?: string;
  name: string;
  administered_at: string;
  next_due_at: string;
  notes: string;
}

export interface PetInput {
  name: string;
  species: string;
  breed: string;
  birth_date: string | null;
  approx_birth_year: number | null;
  weight: number;
  sex: string;
  cotitular_ids: string[];
  notes: string | null;
}
