import { supabase } from "@/integrations/supabase/client";
import { PHOTO_BUCKET } from "./constants";
import type {
  PetInput,
  PetListItem,
  PetWithRelations,
  Profile,
  VaccineInput,
} from "./types";

const PET_COLUMNS =
  "id, owner_id, name, species, breed, birth_date, approx_birth_year, weight, sex, photo_path, notes";
const VACCINE_COLUMNS = "id, pet_id, name, administered_at, next_due_at, notes";

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export async function getMyProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, name, email")
    .eq("id", user.id)
    .maybeSingle();
  return data ?? { id: user.id, name: user.email ?? "", email: user.email ?? "" };
}

export async function findProfileIdByEmail(email: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("find_profile_id_by_email", {
    lookup_email: email.trim().toLowerCase(),
  });
  if (error) throw error;
  return data ?? null;
}

export async function listPets(
  scope: "mine" | "shared",
  userId: string,
): Promise<PetListItem[]> {
  let sharedPetIds: string[] = [];
  if (scope === "shared") {
    const { data: relations, error: relationsError } = await supabase
      .from("pet_cotitulares")
      .select("pet_id")
      .eq("profile_id", userId);
    if (relationsError) throw relationsError;
    sharedPetIds = (relations ?? []).map((relation) => relation.pet_id);
    if (sharedPetIds.length === 0) return [];
  }

  const petsQuery = supabase
    .from("pets")
    .select(`${PET_COLUMNS}, owner:profiles!pets_owner_id_fkey(id, name, email), vaccinations(${VACCINE_COLUMNS})`);
  const { data, error } =
    scope === "mine"
      ? await petsQuery.eq("owner_id", userId).order("name", { ascending: true })
      : await petsQuery.in("id", sharedPetIds).order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as PetListItem[];
}

export async function getPet(id: string): Promise<PetWithRelations | null> {
  const { data, error } = await supabase
    .from("pets")
    .select(
      `${PET_COLUMNS}, owner:profiles!pets_owner_id_fkey(id, name, email), vaccinations(${VACCINE_COLUMNS})`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { data: relations, error: relationsError } = await supabase
    .from("pet_cotitulares")
    .select("profile:profiles!pet_cotitulares_profile_id_fkey(id, name, email)")
    .eq("pet_id", id);
  if (relationsError) throw relationsError;

  return {
    ...(data as unknown as Omit<PetWithRelations, "cotitulares">),
    cotitulares: (relations ?? []).flatMap((relation) =>
      relation.profile ? [relation.profile] : [],
    ),
  };
}

async function syncPetCotitulares(petId: string, cotitularIds: string[]): Promise<void> {
  const { data: currentRelations, error: currentError } = await supabase
    .from("pet_cotitulares")
    .select("profile_id")
    .eq("pet_id", petId);
  if (currentError) throw currentError;

  const currentIds = new Set((currentRelations ?? []).map((relation) => relation.profile_id));
  const desiredIds = new Set(cotitularIds);
  const toAdd = [...desiredIds].filter((profileId) => !currentIds.has(profileId));
  const toRemove = [...currentIds].filter((profileId) => !desiredIds.has(profileId));

  if (toAdd.length > 0) {
    const { error } = await supabase.from("pet_cotitulares").insert(
      toAdd.map((profile_id) => ({ pet_id: petId, profile_id })),
    );
    if (error) throw error;
  }

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from("pet_cotitulares")
      .delete()
      .eq("pet_id", petId)
      .in("profile_id", toRemove);
    if (error) throw error;
  }
}

export async function getPhotoUrl(path: string): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

function extensionFor(file: File): string {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

async function uploadPhoto(ownerId: string, petId: string, file: File): Promise<string> {
  const path = `${ownerId}/${petId}/cover.${extensionFor(file)}`;
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  return path;
}

async function removePhoto(path: string) {
  if (!path) return;
  await supabase.storage.from(PHOTO_BUCKET).remove([path]);
}

function vaccineRows(petId: string, vaccines: VaccineInput[]) {
  return vaccines.map((v) => ({
    pet_id: petId,
    name: v.name.trim(),
    administered_at: v.administered_at,
    next_due_at: v.next_due_at,
    notes: v.notes.trim() ? v.notes.trim() : null,
  }));
}

export async function createPet(
  ownerId: string,
  input: PetInput,
  photo: File,
  vaccines: VaccineInput[],
): Promise<string> {
  const petId = crypto.randomUUID();
  const photoPath = await uploadPhoto(ownerId, petId, photo);

  const { error: petError } = await supabase.from("pets").insert({
    id: petId,
    owner_id: ownerId,
    name: input.name,
    species: input.species,
    breed: input.breed,
    birth_date: input.birth_date,
    approx_birth_year: input.approx_birth_year,
    weight: input.weight,
    sex: input.sex,
    photo_path: photoPath,
    notes: input.notes,
  });

  if (petError) {
    await removePhoto(photoPath);
    throw petError;
  }

  try {
    await syncPetCotitulares(petId, input.cotitular_ids);
  } catch (error) {
    await supabase.from("pets").delete().eq("id", petId);
    await removePhoto(photoPath);
    throw error;
  }

  if (vaccines.length > 0) {
    const { error: vaccineError } = await supabase
      .from("vaccinations")
      .insert(vaccineRows(petId, vaccines));
    if (vaccineError) {
      await supabase.from("pets").delete().eq("id", petId);
      await removePhoto(photoPath);
      throw vaccineError;
    }
  }

  return petId;
}

export async function updatePet(
  petId: string,
  ownerId: string,
  input: PetInput,
  photo: File | null,
  vaccines: VaccineInput[],
): Promise<void> {
  let photoPath: string | null = null;
  if (photo) photoPath = await uploadPhoto(ownerId, petId, photo);

  const { error: petError } = await supabase
    .from("pets")
    .update({
      name: input.name,
      species: input.species,
      breed: input.breed,
      birth_date: input.birth_date,
      approx_birth_year: input.approx_birth_year,
      weight: input.weight,
      sex: input.sex,
      notes: input.notes,
      ...(photoPath ? { photo_path: photoPath } : {}),
    })
    .eq("id", petId);
  if (petError) throw petError;

  await syncPetCotitulares(petId, input.cotitular_ids);

  const { error: deleteError } = await supabase.from("vaccinations").delete().eq("pet_id", petId);
  if (deleteError) throw deleteError;

  if (vaccines.length > 0) {
    const { error: vaccineError } = await supabase
      .from("vaccinations")
      .insert(vaccineRows(petId, vaccines));
    if (vaccineError) throw vaccineError;
  }
}

export async function deletePet(petId: string, photoPath: string): Promise<void> {
  const { error } = await supabase.from("pets").delete().eq("id", petId);
  if (error) throw error;
  await removePhoto(photoPath);
}
