import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PetForm, type PetFormSubmit } from "@/components/imune/PetForm";
import { getPet, updatePet } from "@/lib/imune/api";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/pets/$id/edit")({
  head: () => ({
    meta: [
      { title: "Editar pet — Imune" },
      { name: "description", content: "Atualize os dados e as vacinas do seu pet no Imune." },
      { property: "og:title", content: "Editar pet — Imune" },
      {
        property: "og:description",
        content: "Atualize os dados e as vacinas do seu pet no Imune.",
      },
    ],
  }),
  component: EditPetPage,
});

function EditPetPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useSession();
  const [submitting, setSubmitting] = useState(false);

  const petQuery = useQuery({ queryKey: ["pet", id], queryFn: () => getPet(id) });
  const pet = petQuery.data;

  if (petQuery.isPending || !profile) {
    return (
      <main className="mx-auto max-w-4xl space-y-4 px-4 py-8">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </main>
    );
  }

  if (petQuery.isError || !pet) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg font-semibold text-foreground">Pet não encontrado.</p>
        <Button asChild className="mt-4">
          <Link to="/pets">Voltar para meus pets</Link>
        </Button>
      </main>
    );
  }

  if (pet.owner_id !== profile.id) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg font-semibold text-foreground">
          Somente o autor pode editar este pet.
        </p>
        <Button asChild className="mt-4">
          <Link to="/pets/$id" params={{ id: pet.id }}>
            Ver detalhes
          </Link>
        </Button>
      </main>
    );
  }

  async function handleSubmit(data: PetFormSubmit) {
    if (!pet || !profile) return;
    setSubmitting(true);
    try {
      await updatePet(pet.id, profile.id, data.input, data.photo, data.vaccines);
      await queryClient.invalidateQueries({ queryKey: ["pets"] });
      await queryClient.invalidateQueries({ queryKey: ["pet", pet.id] });
      toast.success("Pet atualizado com sucesso.");
      navigate({ to: "/pets/$id", params: { id: pet.id } });
    } catch {
      toast.error("Não foi possível salvar as alterações. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <p className="text-sm font-semibold text-primary">Perfil do pet</p>
      <h1 className="mt-2 text-3xl font-semibold text-foreground sm:text-4xl">Editar {pet.name}</h1>
      <p className="mb-8 mt-2 text-sm text-muted-foreground">
        Atualize os dados do pet e o histórico de vacinas.
      </p>
      <PetForm
        pet={pet}
        userId={profile.id}
        submitting={submitting}
        submitLabel="Salvar alterações"
        onSubmit={handleSubmit}
        onCancel={() => navigate({ to: "/pets/$id", params: { id: pet.id } })}
      />
    </main>
  );
}
