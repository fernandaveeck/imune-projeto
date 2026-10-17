import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  HeartHandshake,
  ImagePlus,
  Plus,
  ShieldCheck,
  Syringe,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DatePicker } from "@/components/imune/DatePicker";
import {
  breedsForSpecies,
  birthYearOptions,
  PHOTO_MAX_BYTES,
  PHOTO_TYPES,
  SEXES,
  SPECIES,
} from "@/lib/imune/constants";
import { listProfiles, getPhotoUrl } from "@/lib/imune/api";
import type { PetInput, PetWithRelations, VaccineInput } from "@/lib/imune/types";

export interface PetFormSubmit {
  input: PetInput;
  photo: File | null;
  vaccines: VaccineInput[];
}

interface VaccineRow extends VaccineInput {
  key: string;
}

const MIN_BIRTH_DATE_ISO = "2000-01-01";
const MIN_BIRTH_DATE = new Date(2000, 0, 1);
const now = new Date();
const MAX_BIRTH_DATE = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const MAX_BIRTH_DATE_ISO = format(MAX_BIRTH_DATE, "yyyy-MM-dd");
const MIN_VACCINE_DATE_ISO = "2000-01-01";
const MAX_VACCINE_DATE_ISO = "2034-12-31";
const MIN_VACCINE_DATE = new Date(2000, 0, 1);
const MAX_VACCINE_DATE = new Date(2034, 11, 31);

function emptyVaccine(): VaccineRow {
  return {
    key: crypto.randomUUID(),
    name: "",
    administered_at: "",
    next_due_at: "",
    notes: "",
  };
}

export function PetForm({
  pet,
  userId,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  pet?: PetWithRelations;
  userId: string;
  submitting: boolean;
  submitLabel: string;
  onSubmit: (data: PetFormSubmit) => void;
  onCancel: () => void;
}) {
  const breedsInitial = pet ? breedsForSpecies(pet.species) : [];
  const initialBreedKnown = pet ? breedsInitial.includes(pet.breed) : false;

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [name, setName] = useState(pet?.name ?? "");
  const [species, setSpecies] = useState(pet?.species ?? "");
  const [breed, setBreed] = useState(pet ? (initialBreedKnown ? pet.breed : "Outro") : "");
  const [breedOther, setBreedOther] = useState(pet && !initialBreedKnown ? pet.breed : "");
  const [birthType, setBirthType] = useState<"exact" | "approx">(
    pet && !pet.birth_date ? "approx" : "exact",
  );
  const [birthDate, setBirthDate] = useState(pet?.birth_date ?? "");
  const [birthYear, setBirthYear] = useState(
    pet?.approx_birth_year ? String(pet.approx_birth_year) : "",
  );
  const [weight, setWeight] = useState(pet ? String(pet.weight) : "");
  const [sex, setSex] = useState(pet?.sex ?? "");
  const [cotitularIds, setCotitularIds] = useState(
    pet?.cotitulares.map((cotitular) => cotitular.id) ?? [],
  );
  const [cotitularesOpen, setCotitularesOpen] = useState(false);
  const [notes, setNotes] = useState(pet?.notes ?? "");
  const [vaccines, setVaccines] = useState<VaccineRow[]>(
    pet?.vaccinations.length
      ? pet.vaccinations.map((v) => ({
          key: v.id,
          name: v.name,
          administered_at: v.administered_at,
          next_due_at: v.next_due_at,
          notes: v.notes ?? "",
        }))
      : [],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dateInputErrors = useRef<Record<string, string>>({});

  const existingPhoto = useQuery({
    queryKey: ["pet-photo", pet?.photo_path ?? ""],
    queryFn: () => getPhotoUrl(pet?.photo_path ?? ""),
    enabled: Boolean(pet?.photo_path),
  });

  const profiles = useQuery({
    queryKey: ["profiles", userId],
    queryFn: () => listProfiles(userId),
    enabled: Boolean(userId),
  });

  const breeds = useMemo(() => breedsForSpecies(species), [species]);
  const years = useMemo(() => birthYearOptions(), []);
  const previewSrc = photoPreview ?? existingPhoto.data ?? null;
  const selectedCotitulares = (profiles.data ?? []).filter((profile) =>
    cotitularIds.includes(profile.id),
  );
  const cotitularLabel =
    cotitularIds.length === 0
      ? "Nenhum cotitular"
      : cotitularIds.length === 1
        ? (selectedCotitulares[0]?.name ?? "1 cotitular selecionado")
        : `${cotitularIds.length} cotitulares selecionados`;

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type)) {
      setErrors((prev) => ({ ...prev, photo: "Formato inválido. Envie JPG, PNG ou WEBP." }));
      return;
    }
    if (file.size > PHOTO_MAX_BYTES) {
      setErrors((prev) => ({ ...prev, photo: "A imagem deve ter no máximo 5 MB." }));
      return;
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next["photo"];
      return next;
    });
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function clearError(...ids: string[]) {
    setErrors((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const id of ids) {
        if (id in next) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }

  function setDateInputError(validationKey: string, fieldId: string, message?: string) {
    if (message) dateInputErrors.current[validationKey] = message;
    else delete dateInputErrors.current[validationKey];

    setErrors((prev) => {
      if (!message && !(fieldId in prev)) return prev;
      const next = { ...prev };
      if (message) next[fieldId] = message;
      else delete next[fieldId];
      return next;
    });
  }

  function updateVaccine(index: number, patch: Partial<VaccineRow>) {
    setVaccines((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
    const fieldMap: Record<string, string> = {
      name: "name",
      administered_at: "administered-at",
      next_due_at: "next-due-at",
    };
    const ids = Object.keys(patch)
      .map((key) => fieldMap[key])
      .filter((suffix): suffix is string => Boolean(suffix))
      .map((suffix) => `vaccine-${index}-${suffix}`);
    if (ids.length) clearError(...ids);
  }

  function validate() {
    const next: Record<string, string> = {};

    if (!pet && !photo) next["pet-photo"] = "Adicione uma foto do pet.";
    if (!name.trim()) next["pet-name"] = "Informe o nome do pet.";
    if (!species) next["pet-species"] = "Selecione a espécie do pet.";
    if (!breed) next["pet-breed"] = "Selecione a raça do pet.";
    if (breed === "Outro" && !breedOther.trim()) next["pet-breed-other"] = "Informe a raça do pet.";

    if (birthType === "exact") {
      if (dateInputErrors.current["birth-date"])
        next["pet-birth-date"] = dateInputErrors.current["birth-date"];
      else if (!birthDate) next["pet-birth-date"] = "Informe a data de nascimento.";
      else if (birthDate < MIN_BIRTH_DATE_ISO || birthDate > MAX_BIRTH_DATE_ISO)
        next["pet-birth-date"] = "A data de nascimento deve estar entre 01/01/2000 e hoje.";
    } else if (!birthYear) {
      next["pet-birth-year"] = "Selecione o ano aproximado de nascimento.";
    } else if (Number(birthYear) < 2000 || Number(birthYear) > MAX_BIRTH_DATE.getFullYear()) {
      next["pet-birth-year"] =
        `O ano de nascimento deve estar entre 2000 e ${MAX_BIRTH_DATE.getFullYear()}.`;
    }

    const weightValue = Number(weight.replace(",", "."));
    if (!weight.trim()) next["pet-weight"] = "Informe o peso do pet.";
    else if (!Number.isFinite(weightValue) || weightValue <= 0)
      next["pet-weight"] = "Informe um peso válido maior que zero.";

    if (!sex) next["pet-sex"] = "Selecione o sexo do pet.";

    vaccines.forEach((vaccine, index) => {
      if (!vaccine.name.trim()) next[`vaccine-${index}-name`] = "Informe o nome da vacina.";
      const administeredDateError =
        dateInputErrors.current[`vaccine:${vaccine.key}:administered_at`];
      const nextDueDateError = dateInputErrors.current[`vaccine:${vaccine.key}:next_due_at`];
      if (administeredDateError) next[`vaccine-${index}-administered-at`] = administeredDateError;
      else if (!vaccine.administered_at)
        next[`vaccine-${index}-administered-at`] = "Informe a data da aplicação.";
      else if (
        vaccine.administered_at < MIN_VACCINE_DATE_ISO ||
        vaccine.administered_at > MAX_VACCINE_DATE_ISO
      )
        next[`vaccine-${index}-administered-at`] =
          "A data da aplicação deve estar entre 01/01/2000 e 31/12/2034.";
      if (nextDueDateError) next[`vaccine-${index}-next-due-at`] = nextDueDateError;
      else if (!vaccine.next_due_at)
        next[`vaccine-${index}-next-due-at`] = "Informe a data da próxima aplicação.";
      else if (
        vaccine.next_due_at < MIN_VACCINE_DATE_ISO ||
        vaccine.next_due_at > MAX_VACCINE_DATE_ISO
      )
        next[`vaccine-${index}-next-due-at`] =
          "A próxima aplicação deve estar entre 01/01/2000 e 31/12/2034.";
      else if (vaccine.administered_at && vaccine.next_due_at < vaccine.administered_at)
        next[`vaccine-${index}-next-due-at`] =
          "A próxima aplicação não pode ser anterior à data da aplicação.";
    });

    setErrors(next);
    const firstKey = Object.keys(next)[0];
    if (firstKey) {
      document.getElementById(firstKey)?.scrollIntoView({ behavior: "smooth", block: "center" });
      document.getElementById(firstKey)?.focus({ preventScroll: true });
      return false;
    }
    return true;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!validate()) return;

    onSubmit({
      photo,
      input: {
        name: name.trim(),
        species,
        breed: breed === "Outro" ? breedOther.trim() : breed,
        birth_date: birthType === "exact" ? birthDate : null,
        approx_birth_year: birthType === "approx" ? Number(birthYear) : null,
        weight: Number(weight.replace(",", ".")),
        sex,
        cotitular_ids: cotitularIds,
        notes: notes.trim() ? notes.trim() : null,
      },
      vaccines: vaccines.map((v) => ({
        name: v.name.trim(),
        administered_at: v.administered_at,
        next_due_at: v.next_due_at,
        notes: v.notes,
      })),
    });
  }

  function fieldError(id: string) {
    const message = errors[id];
    if (!message) return null;
    return (
      <p id={`${id}-error`} className="text-sm text-destructive">
        {message}
      </p>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="w-fit -ml-2">
        <ArrowLeft />
        Voltar
      </Button>
      <section className="grid gap-6 overflow-hidden rounded-2xl border border-border/75 bg-card p-5 shadow-card sm:grid-cols-[180px_1fr] sm:p-7">
        <div className="relative aspect-square w-full max-w-[180px] overflow-hidden rounded-2xl bg-brand-surface">
          {previewSrc ? (
            <img
              src={previewSrc}
              alt="Prévia da foto do pet"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center text-primary/45">
              <ImagePlus className="h-10 w-10" />
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center">
          <div className="mb-4">
            <p className="text-sm font-semibold text-primary">Retrato do pet</p>
            <h2 className="mt-1 text-2xl font-semibold text-foreground">Foto do pet</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Escolha uma foto clara que ajude a reconhecer seu companheiro rapidamente.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pet-photo" className="cursor-pointer">
              <span className="inline-flex h-11 items-center gap-2 rounded-xl border border-input bg-card px-4 text-sm font-semibold transition-colors hover:border-primary/30 hover:bg-accent">
                <Upload className="h-4 w-4" />
                Selecionar foto
              </span>
            </Label>
            <input
              id="pet-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handlePhotoChange}
              aria-describedby={errors["pet-photo"] ? "pet-photo-error" : undefined}
            />
            <p className="mt-1 text-xs text-muted-foreground">JPG, PNG ou WEBP · até 5 MB</p>
            {fieldError("pet-photo")}
          </div>
        </div>
      </section>

      <section className="space-y-7 rounded-2xl border border-border/75 bg-card p-5 shadow-card sm:p-7">
        <div className="flex items-start gap-3 border-b border-border/70 pb-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-surface text-primary">
            <HeartHandshake className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Dados do pet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Informações para identificar e acompanhar os cuidados.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pet-name">Nome *</Label>
          <Input
            id="pet-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearError("pet-name");
            }}
            aria-invalid={Boolean(errors["pet-name"])}
            aria-describedby={errors["pet-name"] ? "pet-name-error" : undefined}
          />
          {fieldError("pet-name")}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pet-species">Espécie *</Label>
            <Select
              value={species}
              onValueChange={(value) => {
                setSpecies(value);
                setBreed("");
                setBreedOther("");
                clearError("pet-species", "pet-breed", "pet-breed-other");
              }}
            >
              <SelectTrigger
                id="pet-species"
                aria-describedby={errors["pet-species"] ? "pet-species-error" : undefined}
              >
                <SelectValue placeholder="Selecione a espécie" />
              </SelectTrigger>
              <SelectContent>
                {SPECIES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldError("pet-species")}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pet-breed">Raça *</Label>
            <Select
              value={breed}
              onValueChange={(value) => {
                setBreed(value);
                clearError("pet-breed", "pet-breed-other");
              }}
              disabled={!species}
            >
              <SelectTrigger
                id="pet-breed"
                aria-describedby={errors["pet-breed"] ? "pet-breed-error" : undefined}
              >
                <SelectValue
                  placeholder={species ? "Selecione a raça" : "Selecione a espécie primeiro"}
                />
              </SelectTrigger>
              <SelectContent>
                {breeds.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldError("pet-breed")}
          </div>
        </div>

        {breed === "Outro" ? (
          <div className="space-y-2">
            <Label htmlFor="pet-breed-other">Informe a raça *</Label>
            <Input
              id="pet-breed-other"
              value={breedOther}
              onChange={(e) => {
                setBreedOther(e.target.value);
                clearError("pet-breed-other");
              }}
              aria-invalid={Boolean(errors["pet-breed-other"])}
              aria-describedby={errors["pet-breed-other"] ? "pet-breed-other-error" : undefined}
            />
            {fieldError("pet-breed-other")}
          </div>
        ) : null}

        <div className="space-y-3">
          <Label htmlFor="pet-birth-type">Nascimento *</Label>
          <RadioGroup
            id="pet-birth-type"
            value={birthType}
            onValueChange={(value) => {
              setBirthType(value as "exact" | "approx");
              setDateInputError("birth-date", "pet-birth-date");
              clearError("pet-birth-date", "pet-birth-year");
            }}
            className="grid gap-3 sm:grid-cols-2"
          >
            <label
              htmlFor="pet-birth-type-exact"
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border bg-secondary/35 px-4 transition-colors has-[[data-state=checked]]:border-primary/40 has-[[data-state=checked]]:bg-brand-surface"
            >
              <RadioGroupItem
                value="exact"
                id="pet-birth-type-exact"
                className="shrink-0 min-[340px]:max-[570px]:translate-y-px"
              />
              <span className="min-w-0 cursor-pointer text-sm font-normal">Sei a data exata</span>
            </label>
            <label
              htmlFor="pet-birth-type-approx"
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border bg-secondary/35 px-4 transition-colors has-[[data-state=checked]]:border-primary/40 has-[[data-state=checked]]:bg-brand-surface"
            >
              <RadioGroupItem
                value="approx"
                id="pet-birth-type-approx"
                className="shrink-0 min-[340px]:max-[570px]:translate-y-px"
              />
              <span className="min-w-0 cursor-pointer text-sm font-normal">
                Sei apenas o ano aproximado
              </span>
            </label>
          </RadioGroup>

          {birthType === "exact" ? (
            <div className="space-y-2">
              <Label htmlFor="pet-birth-date">Data de nascimento *</Label>
              <DatePicker
                id="pet-birth-date"
                value={birthDate}
                minDate={MIN_BIRTH_DATE}
                maxDate={MAX_BIRTH_DATE}
                onChange={(value) => {
                  setBirthDate(value);
                  clearError("pet-birth-date");
                }}
                onValidationError={(message) =>
                  setDateInputError("birth-date", "pet-birth-date", message)
                }
                aria-invalid={Boolean(errors["pet-birth-date"])}
                aria-describedby={errors["pet-birth-date"] ? "pet-birth-date-error" : undefined}
              />
              {fieldError("pet-birth-date")}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="pet-birth-year">Ano aproximado *</Label>
              <Select
                value={birthYear}
                onValueChange={(value) => {
                  setBirthYear(value);
                  clearError("pet-birth-year");
                }}
              >
                <SelectTrigger
                  id="pet-birth-year"
                  aria-describedby={errors["pet-birth-year"] ? "pet-birth-year-error" : undefined}
                >
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldError("pet-birth-year")}
            </div>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pet-weight">Peso (kg) *</Label>
            <Input
              id="pet-weight"
              inputMode="decimal"
              value={weight}
              onChange={(e) => {
                setWeight(e.target.value);
                clearError("pet-weight");
              }}
              aria-invalid={Boolean(errors["pet-weight"])}
              aria-describedby={errors["pet-weight"] ? "pet-weight-error" : undefined}
            />
            {fieldError("pet-weight")}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pet-sex">Sexo *</Label>
            <Select
              value={sex}
              onValueChange={(value) => {
                setSex(value);
                clearError("pet-sex");
              }}
            >
              <SelectTrigger
                id="pet-sex"
                aria-describedby={errors["pet-sex"] ? "pet-sex-error" : undefined}
              >
                <SelectValue placeholder="Selecione o sexo" />
              </SelectTrigger>
              <SelectContent>
                {SEXES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldError("pet-sex")}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pet-cotitulares">Cotitulares (opcional)</Label>
          <Popover open={cotitularesOpen} onOpenChange={setCotitularesOpen}>
            <PopoverTrigger asChild>
              <button
                id="pet-cotitulares"
                type="button"
                role="combobox"
                aria-haspopup="listbox"
                aria-expanded={cotitularesOpen}
                aria-label="Selecionar cotitulares"
                className="flex h-12 w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-input bg-card px-4 py-2 text-left text-sm transition-[border-color,box-shadow,background-color] hover:border-primary/25 focus:border-primary focus:outline-none focus:ring-4 focus:ring-ring/12"
              >
                <span className="truncate text-foreground">{cotitularLabel}</span>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-[var(--radix-popover-trigger-width)] overflow-hidden p-0 shadow-card"
            >
              <Command>
                <CommandInput placeholder="Buscar por nome ou e-mail..." />
                <CommandList>
                  <CommandEmpty>
                    {profiles.isPending ? "Carregando usuários..." : "Nenhum usuário encontrado."}
                  </CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="Nenhum cotitular"
                      onSelect={() => {
                        setCotitularIds([]);
                        setCotitularesOpen(false);
                      }}
                      className="min-h-14 cursor-pointer items-center py-2 pl-3 pr-3"
                    >
                      <span className="flex-1">Nenhum cotitular</span>
                      <Check
                        className={`h-4 w-4 ${cotitularIds.length === 0 ? "opacity-100" : "opacity-0"}`}
                      />
                    </CommandItem>
                    {profiles.isPending ? (
                      <p className="px-3 py-2 text-xs text-muted-foreground">
                        Carregando usuários...
                      </p>
                    ) : null}
                    {(profiles.data ?? []).map((profile) => {
                      return (
                        <CommandItem
                          key={profile.id}
                          value={`${profile.name} ${profile.email}`}
                          onSelect={() =>
                            setCotitularIds((current) =>
                              current.includes(profile.id)
                                ? current.filter((id) => id !== profile.id)
                                : [...current, profile.id],
                            )
                          }
                          className="min-h-14 cursor-pointer items-center py-2 pl-3 pr-3"
                        >
                          <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                            <span className="max-w-full truncate">{profile.name}</span>
                            <span className="max-w-full truncate text-xs opacity-60">
                              {profile.email}
                            </span>
                          </span>
                          <Check
                            className={`h-4 w-4 ${cotitularIds.includes(profile.id) ? "opacity-100" : "opacity-0"}`}
                          />
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
            Cotitulares acompanham o pet. Somente o titular pode editar ou excluir.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pet-notes">Observações (opcional)</Label>
          <Textarea
            id="pet-notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </section>

      <section className="space-y-6 rounded-2xl border border-border/75 bg-card p-5 shadow-card sm:p-7">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-border/70 pb-5">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-blue-soft text-brand-blue">
              <Syringe className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-foreground">Vacinas</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Registre aplicações e próximas doses.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setVaccines((prev) => [...prev, emptyVaccine()])}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Adicionar vacina</span>
          </Button>
        </div>

        {vaccines.length === 0 ? (
          <div className="rounded-xl border border-dashed border-primary/25 bg-brand-surface px-5 py-8 text-center">
            <Syringe className="mx-auto h-7 w-7 text-primary/50" />
            <p className="mt-3 text-sm font-medium text-foreground">Nenhuma vacina adicionada.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Você pode salvar o pet agora e registrar vacinas depois.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {vaccines.map((vaccine, index) => (
              <div
                key={vaccine.key}
                className="space-y-5 rounded-xl border border-border bg-secondary/25 p-4 sm:p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                      {index + 1}
                    </span>
                    <h3 className="text-base font-semibold text-foreground">Vacina {index + 1}</h3>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setVaccines((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Remover</span>
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`vaccine-${index}-name`}>Nome da vacina *</Label>
                  <Input
                    id={`vaccine-${index}-name`}
                    value={vaccine.name}
                    onChange={(e) => updateVaccine(index, { name: e.target.value })}
                    aria-invalid={Boolean(errors[`vaccine-${index}-name`])}
                  />
                  {fieldError(`vaccine-${index}-name`)}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`vaccine-${index}-administered-at`}>Data da aplicação *</Label>
                    <DatePicker
                      id={`vaccine-${index}-administered-at`}
                      value={vaccine.administered_at}
                      minDate={MIN_VACCINE_DATE}
                      maxDate={MAX_VACCINE_DATE}
                      onChange={(value) => updateVaccine(index, { administered_at: value })}
                      onValidationError={(message) =>
                        setDateInputError(
                          `vaccine:${vaccine.key}:administered_at`,
                          `vaccine-${index}-administered-at`,
                          message,
                        )
                      }
                      aria-invalid={Boolean(errors[`vaccine-${index}-administered-at`])}
                    />
                    {fieldError(`vaccine-${index}-administered-at`)}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`vaccine-${index}-next-due-at`}>Próxima aplicação *</Label>
                    <DatePicker
                      id={`vaccine-${index}-next-due-at`}
                      value={vaccine.next_due_at}
                      minDate={MIN_VACCINE_DATE}
                      maxDate={MAX_VACCINE_DATE}
                      onChange={(value) => updateVaccine(index, { next_due_at: value })}
                      onValidationError={(message) =>
                        setDateInputError(
                          `vaccine:${vaccine.key}:next_due_at`,
                          `vaccine-${index}-next-due-at`,
                          message,
                        )
                      }
                      aria-invalid={Boolean(errors[`vaccine-${index}-next-due-at`])}
                    />
                    {fieldError(`vaccine-${index}-next-due-at`)}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`vaccine-${index}-notes`}>Observações (opcional)</Label>
                  <Textarea
                    id={`vaccine-${index}-notes`}
                    rows={3}
                    value={vaccine.notes}
                    onChange={(e) => updateVaccine(index, { notes: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="sticky bottom-4 z-20 flex flex-wrap justify-between gap-3 rounded-2xl border border-border/80 bg-card/95 p-3 shadow-soft backdrop-blur-xl">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Salvando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
