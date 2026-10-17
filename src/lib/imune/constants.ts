export const SPECIES = [
  { value: "cao", label: "Cão" },
  { value: "gato", label: "Gato" },
] as const;

export type SpeciesValue = (typeof SPECIES)[number]["value"];

export const SEXES = [
  { value: "macho", label: "Macho" },
  { value: "femea", label: "Fêmea" },
] as const;

export const DOG_BREEDS = [
  "SRD — Sem raça definida",
  "Akita",
  "Beagle",
  "Border Collie",
  "Boxer",
  "Bulldog Francês",
  "Bulldog Inglês",
  "Chihuahua",
  "Chow Chow",
  "Dachshund",
  "Doberman",
  "Golden Retriever",
  "Husky Siberiano",
  "Labrador Retriever",
  "Lhasa Apso",
  "Maltês",
  "Pastor Alemão",
  "Pinscher",
  "Pit Bull",
  "Poodle",
  "Pug",
  "Rottweiler",
  "Shih Tzu",
  "Spitz Alemão",
  "Yorkshire Terrier",
  "Outro",
];

export const CAT_BREEDS = [
  "SRD — Sem raça definida",
  "Abissínio",
  "Angorá",
  "Bengal",
  "British Shorthair",
  "Maine Coon",
  "Persa",
  "Ragdoll",
  "Siamês",
  "Sphynx",
  "Outro",
];

export function breedsForSpecies(species: string): string[] {
  if (species === "gato") return CAT_BREEDS;
  if (species === "cao") return DOG_BREEDS;
  return [];
}

export function birthYearOptions(): number[] {
  const current = new Date().getFullYear();
  const earliest = 2000;
  if (current < earliest) return [];
  return Array.from({ length: current - earliest + 1 }, (_, i) => current - i);
}

export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PHOTO_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
export const PHOTO_BUCKET = "pet-photos";
