import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, PawPrint, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PetCard } from "@/components/imune/PetCard";
import { useDemo } from "@/lib/imune/demo-store";

export const Route = createFileRoute("/_authenticated/pets/")({
  head: () => ({
    meta: [
      { title: "Meus pets — Imune Demo" },
      {
        name: "description",
        content: "Acompanhe seus pets e as próximas vacinas na demonstração do Imune.",
      },
    ],
  }),
  component: PetsPage,
});

function PetsPage() {
  const { pets } = useDemo();
  const [search, setSearch] = useState("");

  const filteredPets = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return pets
      .filter(
        (pet) =>
          !term ||
          pet.name.toLocaleLowerCase("pt-BR").includes(term) ||
          pet.breed.toLocaleLowerCase("pt-BR").includes(term),
      )
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [pets, search]);

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8 sm:py-10">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
        <div className="min-w-0">
          <p className="mb-2 text-sm font-semibold text-primary">Sua família por perto</p>
          <h1 className="truncate text-3xl font-semibold text-foreground sm:text-4xl">Meus pets</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Seus companheiros e cuidados, em um só lugar.
          </p>
        </div>
        <Button asChild className="hidden sm:inline-flex">
          <Link to="/pets/new">
            <Plus className="h-4 w-4" />
            Cadastrar pet
          </Link>
        </Button>
      </div>
      <Button asChild className="mt-5 w-full sm:hidden">
        <Link to="/pets/new">
          <Plus className="h-4 w-4" />
          Cadastrar pet
        </Link>
      </Button>

      <div className="relative mt-8 rounded-2xl border border-border/70 bg-card p-2.5 shadow-card">
        <Search className="pointer-events-none absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
        <Input
          id="pets-search"
          placeholder="Buscar por nome ou raça"
          aria-label="Buscar por nome ou raça"
          className="border-transparent bg-secondary/45 pl-11"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="mt-7">
        {filteredPets.length === 0 ? (
          <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-brand-surface px-6 py-14 text-center">
            <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-2xl bg-card text-primary shadow-card">
              <PawPrint className="h-9 w-9" />
            </div>
            <p className="text-lg font-semibold text-foreground">
              {search.trim()
                ? "Nenhum pet encontrado para esta busca."
                : "Você ainda não cadastrou nenhum pet."}
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              {search.trim()
                ? "Tente buscar por outro nome ou raça."
                : "Cadastre seu primeiro companheiro e mantenha os cuidados sempre organizados."}
            </p>
            {!search.trim() ? (
              <Button asChild className="mt-6">
                <Link to="/pets/new">
                  <Heart className="h-4 w-4" />
                  Cadastrar pet
                </Link>
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPets.map((pet) => (
              <PetCard key={pet.id} pet={pet} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
