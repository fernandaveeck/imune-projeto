import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PetForm, type PetFormSubmit } from "@/components/imune/PetForm";
import { useDemo } from "@/lib/imune/demo-store";

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
  const { createPet } = useDemo();

  function handleSubmit(data: PetFormSubmit) {
    createPet(data.input, data.vaccines);
    toast.success("Pet cadastrado com sucesso.");
    navigate({ to: "/pets" });
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <p className="text-sm font-semibold text-primary">Novo companheiro</p>
      <h1 className="mt-2 text-3xl font-semibold text-foreground sm:text-4xl">Cadastrar pet</h1>
      <p className="mb-8 mt-2 text-sm text-muted-foreground">
        Preencha os dados do pet e registre as vacinas já aplicadas.
      </p>
      <PetForm onSubmit={handleSubmit} onCancel={() => navigate({ to: "/pets" })} />
    </main>
  );
}
