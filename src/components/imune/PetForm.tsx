import { useRef, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, HeartHandshake, Plus, Syringe, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/imune/DatePicker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { birthYearOptions, breedsForSpecies, SEXES, SPECIES } from "@/lib/imune/constants";
import type { DemoPetInput, DemoVaccineInput } from "@/lib/imune/demo-store";

export interface PetFormSubmit {
  input: DemoPetInput;
  vaccines: DemoVaccineInput[];
}

interface VaccineRow extends DemoVaccineInput {
  key: string;
}

const MIN_DATE = new Date(2000, 0, 1);
const MAX_VACCINE_DATE = new Date(2034, 11, 31);
const MAX_BIRTH_DATE = new Date();
const MIN_DATE_ISO = "2000-01-01";
const MAX_VACCINE_DATE_ISO = "2034-12-31";

function emptyVaccine(): VaccineRow {
  return { key: crypto.randomUUID(), name: "", administered_at: "", next_due_at: "", notes: "" };
}

export function PetForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: PetFormSubmit) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [breed, setBreed] = useState("");
  const [breedOther, setBreedOther] = useState("");
  const [birthType, setBirthType] = useState<"exact" | "approx">("exact");
  const [birthDate, setBirthDate] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [weight, setWeight] = useState("");
  const [sex, setSex] = useState("");
  const [notes, setNotes] = useState("");
  const [vaccines, setVaccines] = useState<VaccineRow[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dateErrors = useRef<Record<string, string>>({});

  function clearError(id: string) {
    setErrors((current) => {
      if (!current[id]) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function setDateError(id: string, message?: string) {
    if (message) dateErrors.current[id] = message;
    else delete dateErrors.current[id];
    setErrors((current) => {
      const next = { ...current };
      if (message) next[id] = message;
      else delete next[id];
      return next;
    });
  }

  function updateVaccine(key: string, patch: Partial<DemoVaccineInput>) {
    setVaccines((current) =>
      current.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
    Object.keys(patch).forEach((field) => clearError(`${key}-${field}`));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim()) next["pet-name"] = "Informe o nome do pet.";
    if (!species) next["pet-species"] = "Selecione a espécie do pet.";
    if (!breed) next["pet-breed"] = "Selecione a raça do pet.";
    if (breed === "Outro" && !breedOther.trim()) next["pet-breed-other"] = "Informe a raça do pet.";
    const todayIso = format(new Date(), "yyyy-MM-dd");
    if (birthType === "exact") {
      if (dateErrors.current["pet-birth-date"])
        next["pet-birth-date"] = dateErrors.current["pet-birth-date"];
      else if (!birthDate) next["pet-birth-date"] = "Informe a data de nascimento.";
      else if (birthDate < MIN_DATE_ISO || birthDate > todayIso)
        next["pet-birth-date"] = "A data de nascimento deve estar entre 01/01/2000 e hoje.";
    } else if (!birthYear) {
      next["pet-birth-year"] = "Selecione o ano aproximado de nascimento.";
    }
    const parsedWeight = Number(weight.replace(",", "."));
    if (!weight.trim()) next["pet-weight"] = "Informe o peso do pet.";
    else if (!Number.isFinite(parsedWeight) || parsedWeight <= 0)
      next["pet-weight"] = "Informe um peso válido maior que zero.";
    if (!sex) next["pet-sex"] = "Selecione o sexo do pet.";

    for (const vaccine of vaccines) {
      if (!vaccine.name.trim()) next[`${vaccine.key}-name`] = "Informe o nome da vacina.";
      for (const field of ["administered_at", "next_due_at"] as const) {
        const id = `${vaccine.key}-${field}`;
        const value = vaccine[field];
        if (dateErrors.current[id]) next[id] = dateErrors.current[id];
        else if (!value)
          next[id] =
            field === "administered_at"
              ? "Informe a data da aplicação."
              : "Informe a próxima aplicação.";
        else if (value < MIN_DATE_ISO || value > MAX_VACCINE_DATE_ISO)
          next[id] = "A data deve estar entre 01/01/2000 e 31/12/2034.";
      }
      if (
        vaccine.administered_at &&
        vaccine.next_due_at &&
        vaccine.next_due_at < vaccine.administered_at
      ) {
        next[`${vaccine.key}-next_due_at`] =
          "A próxima aplicação não pode ser anterior à aplicação.";
      }
    }

    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) {
      document.getElementById(first)?.scrollIntoView({ behavior: "smooth", block: "center" });
      document.getElementById(first)?.focus({ preventScroll: true });
      return false;
    }
    return true;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    onSubmit({
      input: {
        name: name.trim(),
        species,
        breed: breed === "Outro" ? breedOther.trim() : breed,
        birth_date: birthType === "exact" ? birthDate : null,
        approx_birth_year: birthType === "approx" ? Number(birthYear) : null,
        weight: Number(weight.replace(",", ".")),
        sex,
        notes: notes.trim() || null,
      },
      vaccines: vaccines.map(({ name, administered_at, next_due_at, notes }) => ({
        name: name.trim(),
        administered_at,
        next_due_at,
        notes: notes.trim(),
      })),
    });
  }

  function errorFor(id: string) {
    return errors[id] ? (
      <p id={`${id}-error`} className="text-sm text-destructive">
        {errors[id]}
      </p>
    ) : null;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="-ml-2 w-fit">
        <ArrowLeft />
        Voltar
      </Button>
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
            onChange={(event) => {
              setName(event.target.value);
              clearError("pet-name");
            }}
            aria-invalid={Boolean(errors["pet-name"])}
            aria-describedby={errors["pet-name"] ? "pet-name-error" : undefined}
          />
          {errorFor("pet-name")}
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
                clearError("pet-species");
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
            {errorFor("pet-species")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pet-breed">Raça *</Label>
            <Select
              value={breed}
              disabled={!species}
              onValueChange={(value) => {
                setBreed(value);
                clearError("pet-breed");
              }}
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
                {breedsForSpecies(species).map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errorFor("pet-breed")}
          </div>
        </div>
        {breed === "Outro" ? (
          <div className="space-y-2">
            <Label htmlFor="pet-breed-other">Informe a raça *</Label>
            <Input
              id="pet-breed-other"
              value={breedOther}
              onChange={(event) => {
                setBreedOther(event.target.value);
                clearError("pet-breed-other");
              }}
            />
            {errorFor("pet-breed-other")}
          </div>
        ) : null}
        <div className="space-y-3">
          <Label htmlFor="pet-birth-type">Nascimento *</Label>
          <RadioGroup
            id="pet-birth-type"
            value={birthType}
            onValueChange={(value) => {
              setBirthType(value as "exact" | "approx");
              clearError("pet-birth-date");
              clearError("pet-birth-year");
            }}
            className="grid gap-3 sm:grid-cols-2"
          >
            <label
              htmlFor="pet-birth-exact"
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border bg-secondary/35 px-4 has-[[data-state=checked]]:border-primary/40 has-[[data-state=checked]]:bg-brand-surface"
            >
              <RadioGroupItem id="pet-birth-exact" value="exact" />
              Sei a data exata
            </label>
            <label
              htmlFor="pet-birth-approx"
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border bg-secondary/35 px-4 has-[[data-state=checked]]:border-primary/40 has-[[data-state=checked]]:bg-brand-surface"
            >
              <RadioGroupItem id="pet-birth-approx" value="approx" />
              Sei apenas o ano aproximado
            </label>
          </RadioGroup>
          {birthType === "exact" ? (
            <div className="space-y-2">
              <Label htmlFor="pet-birth-date">Data de nascimento *</Label>
              <DatePicker
                id="pet-birth-date"
                value={birthDate}
                minDate={MIN_DATE}
                maxDate={MAX_BIRTH_DATE}
                onChange={(value) => {
                  setBirthDate(value);
                  clearError("pet-birth-date");
                }}
                onValidationError={(message) => setDateError("pet-birth-date", message)}
                aria-invalid={Boolean(errors["pet-birth-date"])}
                aria-describedby={errors["pet-birth-date"] ? "pet-birth-date-error" : undefined}
              />
              {errorFor("pet-birth-date")}
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
                <SelectTrigger id="pet-birth-year">
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  {birthYearOptions().map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errorFor("pet-birth-year")}
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
              onChange={(event) => {
                setWeight(event.target.value);
                clearError("pet-weight");
              }}
              aria-invalid={Boolean(errors["pet-weight"])}
            />
            {errorFor("pet-weight")}
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
              <SelectTrigger id="pet-sex">
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
            {errorFor("pet-sex")}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pet-notes">Observações (opcional)</Label>
          <Textarea
            id="pet-notes"
            rows={4}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>
      </section>

      <section className="space-y-6 rounded-2xl border border-border/75 bg-card p-5 shadow-card sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 pb-5">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-blue-soft text-brand-blue">
              <Syringe className="h-5 w-5" />
            </span>
            <div>
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
            onClick={() => setVaccines((current) => [...current, emptyVaccine()])}
          >
            <Plus className="h-4 w-4" />
            Adicionar vacina
          </Button>
        </div>
        {vaccines.length === 0 ? (
          <div className="rounded-xl border border-dashed border-primary/25 bg-brand-surface px-5 py-8 text-center">
            <Syringe className="mx-auto h-7 w-7 text-primary/50" />
            <p className="mt-3 text-sm font-medium text-foreground">Nenhuma vacina adicionada.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Você pode cadastrar o pet sem vacinas.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {vaccines.map((vaccine, index) => (
              <div
                key={vaccine.key}
                className="space-y-5 rounded-xl border border-border bg-secondary/25 p-4 sm:p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                      {index + 1}
                    </span>
                    <h3 className="font-semibold">Vacina {index + 1}</h3>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setVaccines((current) => current.filter((item) => item.key !== vaccine.key))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                    Remover
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${vaccine.key}-name`}>Nome da vacina *</Label>
                  <Input
                    id={`${vaccine.key}-name`}
                    value={vaccine.name}
                    onChange={(event) => updateVaccine(vaccine.key, { name: event.target.value })}
                    aria-invalid={Boolean(errors[`${vaccine.key}-name`])}
                  />
                  {errorFor(`${vaccine.key}-name`)}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`${vaccine.key}-administered_at`}>Data da aplicação *</Label>
                    <DatePicker
                      id={`${vaccine.key}-administered_at`}
                      value={vaccine.administered_at}
                      minDate={MIN_DATE}
                      maxDate={MAX_VACCINE_DATE}
                      onChange={(value) => updateVaccine(vaccine.key, { administered_at: value })}
                      onValidationError={(message) =>
                        setDateError(`${vaccine.key}-administered_at`, message)
                      }
                      aria-invalid={Boolean(errors[`${vaccine.key}-administered_at`])}
                    />
                    {errorFor(`${vaccine.key}-administered_at`)}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${vaccine.key}-next_due_at`}>Próxima aplicação *</Label>
                    <DatePicker
                      id={`${vaccine.key}-next_due_at`}
                      value={vaccine.next_due_at}
                      minDate={MIN_DATE}
                      maxDate={MAX_VACCINE_DATE}
                      onChange={(value) => updateVaccine(vaccine.key, { next_due_at: value })}
                      onValidationError={(message) =>
                        setDateError(`${vaccine.key}-next_due_at`, message)
                      }
                      aria-invalid={Boolean(errors[`${vaccine.key}-next_due_at`])}
                    />
                    {errorFor(`${vaccine.key}-next_due_at`)}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${vaccine.key}-notes`}>Observações (opcional)</Label>
                  <Textarea
                    id={`${vaccine.key}-notes`}
                    rows={3}
                    value={vaccine.notes}
                    onChange={(event) => updateVaccine(vaccine.key, { notes: event.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <div className="sticky bottom-4 z-20 flex flex-wrap justify-between gap-3 rounded-2xl border border-border/80 bg-card/95 p-3 shadow-soft backdrop-blur-xl">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Cadastrar pet</Button>
      </div>
    </form>
  );
}
