import { Link } from "@tanstack/react-router";
import { CalendarDays, ChevronRight, PawPrint } from "lucide-react";
import type { DemoPet } from "@/lib/imune/demo-store";
import {
  ageLabel,
  formatShortDate,
  nextVaccinationStatus,
  speciesLabel,
  toneClasses,
} from "@/lib/imune/format";

function nextVaccination(pet: DemoPet) {
  return [...pet.vaccinations].sort((a, b) => a.next_due_at.localeCompare(b.next_due_at))[0];
}

export function PetCard({ pet }: { pet: DemoPet }) {
  const next = nextVaccination(pet);
  const status = next ? nextVaccinationStatus(next.next_due_at) : null;

  return (
    <Link
      to="/pets/$id"
      params={{ id: pet.id }}
      className="group flex min-h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card p-3 shadow-card transition-[border-color,box-shadow] duration-200 hover:border-primary/25 hover:shadow-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20"
    >
      <div className="relative grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-xl bg-brand-surface">
        <div
          className="absolute inset-6 rounded-full border border-primary/10"
          aria-hidden="true"
        />
        <div
          className="absolute inset-12 rounded-full border border-primary/10"
          aria-hidden="true"
        />
        <span className="relative grid h-24 w-24 place-items-center rounded-[1.75rem] bg-card text-primary shadow-card transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-[-4deg]">
          <PawPrint className="h-12 w-12" strokeWidth={1.8} aria-hidden="true" />
        </span>
        <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-xl bg-card/90 text-primary shadow-card transition-transform group-hover:translate-x-0.5">
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <div className="space-y-1 px-1 pt-3">
        <h2 className="text-xl font-semibold text-foreground">{pet.name}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {speciesLabel(pet.species)} · {pet.breed} ·{" "}
          {ageLabel(pet.birth_date, pet.approx_birth_year)}
        </p>
      </div>
      {next && status ? (
        <div className="mt-auto space-y-2 rounded-xl bg-brand-surface p-3.5 pt-4">
          <div className="flex items-center gap-2 text-primary">
            <CalendarDays className="h-4 w-4" />
            <p className="text-sm font-semibold text-foreground">{next.name}</p>
          </div>
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
