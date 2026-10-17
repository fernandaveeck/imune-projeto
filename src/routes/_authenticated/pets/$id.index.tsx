import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CalendarCheck, PawPrint, Syringe, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDemo } from "@/lib/imune/demo-store";
import {
  ageLabel,
  formatLongDate,
  formatShortDate,
  formatWeight,
  nextVaccinationStatus,
  sexLabel,
  speciesLabel,
  toneClasses,
} from "@/lib/imune/format";

export const Route = createFileRoute("/_authenticated/pets/$id/")({
  head: () => ({
    meta: [
      { title: "Detalhes do pet — Imune Demo" },
      { name: "description", content: "Histórico de vacinação e dados do pet no Imune Demo." },
    ],
  }),
  component: PetDetailPage,
});

function PetDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { pets, deletePet } = useDemo();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pet = pets.find((item) => item.id === id);

  if (!pet) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-lg font-semibold text-foreground">Pet não encontrado.</p>
        <Button asChild className="mt-4">
          <Link to="/pets">Voltar para meus pets</Link>
        </Button>
      </main>
    );
  }

  const sortedVaccines = [...pet.vaccinations].sort((a, b) =>
    b.administered_at.localeCompare(a.administered_at),
  );
  const upcoming = [...pet.vaccinations].sort((a, b) =>
    a.next_due_at.localeCompare(b.next_due_at),
  )[0];
  const upcomingStatus = upcoming ? nextVaccinationStatus(upcoming.next_due_at) : null;

  function handleDelete() {
    deletePet(id);
    toast.success("Pet excluído com sucesso.");
    navigate({ to: "/pets", replace: true });
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <Link
        to="/pets"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>
      <div className="mt-5 grid gap-7 overflow-hidden rounded-2xl border border-border/75 bg-card p-4 shadow-card md:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.35fr)] md:p-6">
        <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl bg-brand-surface md:aspect-square">
          <div
            className="absolute h-[80%] w-[80%] rounded-full border border-primary/10"
            aria-hidden="true"
          />
          <div
            className="absolute h-[55%] w-[55%] rounded-full border border-primary/10"
            aria-hidden="true"
          />
          <span className="relative grid h-28 w-28 place-items-center rounded-[2rem] bg-card text-primary shadow-card">
            <PawPrint className="h-14 w-14" strokeWidth={1.8} aria-hidden="true" />
          </span>
        </div>
        <div className="flex min-w-0 flex-col justify-center space-y-5 py-1 md:py-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-primary">Perfil do pet</p>
            <h1 className="break-words text-4xl font-semibold text-foreground sm:text-5xl">
              {pet.name}
            </h1>
            <p className="mt-2 text-base text-muted-foreground">
              {speciesLabel(pet.species)} · {pet.breed}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-5 border-y border-border/70 py-5 sm:grid-cols-3">
            <Info label="Idade" value={ageLabel(pet.birth_date, pet.approx_birth_year)} />
            <Info
              label="Nascimento"
              value={
                pet.birth_date
                  ? formatLongDate(pet.birth_date)
                  : pet.approx_birth_year
                    ? `Aprox. ${pet.approx_birth_year}`
                    : "—"
              }
            />
            <Info label="Peso" value={formatWeight(pet.weight)} />
            <Info label="Sexo" value={sexLabel(pet.sex)} />
            <Info label="Titular" value="Convidado" />
          </dl>
          {pet.notes ? (
            <div className="rounded-xl bg-brand-surface p-4">
              <p className="text-xs font-semibold text-primary">Observações</p>
              <p className="mt-1 whitespace-pre-line text-sm text-foreground">{pet.notes}</p>
            </div>
          ) : null}
          <div>
            <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          </div>
        </div>
      </div>

      <section className="mt-10">
        <div className="flex min-w-0 flex-col items-start gap-3 min-[451px]:grid min-[451px]:grid-cols-[minmax(0,1fr)_auto] min-[451px]:items-end">
          <div className="min-w-0 max-w-full">
            <p className="mb-1 text-sm font-semibold text-primary">Carteira de cuidados</p>
            <h2 className="break-words text-2xl font-semibold text-foreground sm:text-3xl">
              Histórico de vacinação
            </h2>
          </div>
          {upcoming && upcomingStatus ? (
            <span
              className={`max-w-full whitespace-normal break-words rounded-2xl px-3 py-1 text-xs font-semibold min-[451px]:justify-self-end ${toneClasses(upcomingStatus.tone)}`}
            >
              Próxima: {upcoming.name} · {formatShortDate(upcoming.next_due_at)} ·{" "}
              {upcomingStatus.label}
            </span>
          ) : null}
        </div>
        {sortedVaccines.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-primary/25 bg-brand-surface p-10 text-center">
            <Syringe className="mx-auto h-8 w-8 text-primary/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              Nenhuma vacina registrada para este pet.
            </p>
          </div>
        ) : (
          <ul className="relative mt-6 space-y-4 before:absolute before:bottom-5 before:left-[19px] before:top-5 before:w-px before:bg-border sm:before:left-[23px]">
            {sortedVaccines.map((vaccine) => {
              const status = nextVaccinationStatus(vaccine.next_due_at);
              return (
                <li
                  key={vaccine.id}
                  className="relative grid min-w-0 grid-cols-[40px_minmax(0,1fr)] gap-3 sm:grid-cols-[48px_minmax(0,1fr)] sm:gap-4"
                >
                  <div className="z-10 grid h-10 w-10 place-items-center rounded-xl border border-primary/20 bg-card text-primary shadow-card sm:h-12 sm:w-12">
                    <CalendarCheck className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 rounded-2xl border border-border/75 bg-card p-3 shadow-card sm:p-5">
                    <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 break-words font-semibold text-foreground">
                        {vaccine.name}
                      </p>
                      <span
                        className={`max-w-full whitespace-normal break-words rounded-2xl px-2.5 py-1 text-xs font-semibold ${toneClasses(status.tone)}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-1 break-words text-sm leading-relaxed text-muted-foreground">
                      Aplicada em {formatShortDate(vaccine.administered_at)} · Próxima aplicação em{" "}
                      {formatShortDate(vaccine.next_due_at)}
                    </p>
                    {vaccine.notes ? (
                      <p className="mt-2 whitespace-pre-line text-sm text-foreground">
                        {vaccine.notes}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {pet.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o pet e seu histórico de vacinação desta demonstração.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}
