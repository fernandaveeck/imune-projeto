import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PetForm, type PetFormSubmit } from "@/components/imune/PetForm";
import { createPet } from "@/lib/imune/api";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/pets/new")({
  head: () => ({
    meta: [
      { title: "Cadastrar pet — Imune" },
      { name: "description", content: "Cadastre um pet e registre suas vacinas no Imune." },
      { property: "og:title", content: "Cadastrar pet — Imune" },
      {
        property: "og:description",
        content: "Cadastre um pet e registre suas vacinas no Imune.",
      },
    ],
  }),
  component: NewPetPage,
});

function NewPetPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useSession();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(data: PetFormSubmit) {
    if (!profile || !data.photo) return;
    setSubmitting(true);
    try {
      const petId = await createPet(profile.id, data.input, data.photo, data.vaccines);
      await queryClient.invalidateQueries({ queryKey: ["pets"] });
      toast.success("Pet cadastrado com sucesso.");
      navigate({ to: "/pets/$id", params: { id: petId } });
    } catch {
      toast.error("Não foi possível cadastrar o pet. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <p className="text-sm font-semibold text-primary">Novo companheiro</p>
      <h1 className="mt-2 text-3xl font-semibold text-foreground sm:text-4xl">Cadastrar pet</h1>
      <p className="mb-8 mt-2 text-sm text-muted-foreground">
        Preencha os dados do pet e registre as vacinas já aplicadas.
      </p>
      <PetForm
        userId={profile?.id ?? ""}
        submitting={submitting}
        submitLabel="Cadastrar pet"
        onSubmit={handleSubmit}
        onCancel={() => navigate({ to: "/pets" })}
      />
    </main>
  );
}
