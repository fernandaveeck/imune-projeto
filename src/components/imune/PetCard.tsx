import { Link } from "@tanstack/react-router";
import { PetPhoto } from "./PetPhoto";
import type { PetListItem } from "@/lib/imune/types";
import {
  ageLabel,
  formatShortDate,
  nextVaccinationStatus,
  speciesLabel,
  toneClasses,
} from "@/lib/imune/format";
import { CalendarDays, ChevronRight } from "lucide-react";

export function nextVaccination(pet: PetListItem) {
  const sorted = [...pet.vaccinations].sort((a, b) =>
    a.next_due_at.localeCompare(b.next_due_at),
  );
  return sorted[0] ?? null;
}

export function PetCard({ pet, showOwner }: { pet: PetListItem; showOwner?: boolean }) {
  const next = nextVaccination(pet);
  const status = next ? nextVaccinationStatus(next.next_due_at) : null;

  return (
    <Link
      to="/pets/$id"
      params={{ id: pet.id }}
      className="group flex min-h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card p-3 shadow-card transition-[border-color,box-shadow] duration-200 hover:border-primary/15 hover:shadow-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20"
    >
      <div className="relative overflow-hidden rounded-xl">
        <PetPhoto path={pet.photo_path} alt={`Foto de ${pet.name}`} className="aspect-[4/3] w-full rounded-xl" />
        <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-xl bg-card/90 text-primary shadow-card backdrop-blur-sm transition-colors group-hover:bg-card">
          <ChevronRight className="h-4 w-4" />
        </span>
      </div>
      <div className="space-y-1 px-1 pt-2">
        <h3 className="text-xl font-semibold text-foreground">{pet.name}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {speciesLabel(pet.species)} · {pet.breed} ·{" "}
          {ageLabel(pet.birth_date, pet.approx_birth_year)}
        </p>
        {showOwner && pet.owner ? (
          <p className="text-xs font-medium text-primary">Por {pet.owner.name}</p>
        ) : null}
      </div>
      {next && status ? (
        <div className="mt-auto space-y-2 rounded-xl bg-brand-surface p-3.5">
          <div className="flex items-center gap-2 text-primary"><CalendarDays className="h-4 w-4" /><p className="text-sm font-semibold text-foreground">{next.name}</p></div>
          <p className="text-xs text-muted-foreground">
            Próxima aplicação: {formatShortDate(next.next_due_at)}
          </p>
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses(status.tone)}`}
          >
            {status.label}
          </span>
        </div>
      ) : (
        <p className="mt-auto rounded-xl bg-muted/60 p-3.5 text-xs text-muted-foreground">
          Nenhuma vacina registrada.
        </p>
      )}
    </Link>
  );
}
