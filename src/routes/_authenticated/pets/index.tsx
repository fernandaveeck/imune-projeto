import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, PawPrint, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PetCard } from "@/components/imune/PetCard";
import { listPets } from "@/lib/imune/api";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated/pets/")({
  head: () => ({
    meta: [
      { title: "Meus pets — Imune" },
      { name: "description", content: "Veja seus pets e a próxima vacinação de cada um." },
      { property: "og:title", content: "Meus pets — Imune" },
      {
        property: "og:description",
        content: "Veja seus pets e a próxima vacinação de cada um.",
      },
    ],
  }),
  component: PetsPage,
});

function PetsPage() {
  const { data: profile } = useSession();
  const [scope, setScope] = useState<"mine" | "shared">("mine");
  const [search, setSearch] = useState("");
  const userId = profile?.id ?? "";

  const petsQuery = useQuery({
    queryKey: ["pets", scope, userId],
    queryFn: () => listPets(scope, userId),
    enabled: Boolean(userId),
  });

  const pets = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = petsQuery.data ?? [];
    const filtered = term
      ? list.filter(
          (pet) =>
            pet.name.toLowerCase().includes(term) || pet.breed.toLowerCase().includes(term),
        )
      : list;
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [petsQuery.data, search]);

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8 sm:py-10">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
        <div className="min-w-0">
          <p className="mb-2 text-sm font-semibold text-primary">Sua família por perto</p>
          <h1 className="truncate text-3xl font-semibold text-foreground sm:text-4xl">Meus pets</h1>
          <p className="mt-2 text-sm text-muted-foreground">Titular administra. Cotitular acompanha.</p>
        </div>
        <Button asChild className="hidden sm:inline-flex">
          <Link to="/pets/new">
            <Plus className="mr-2 h-4 w-4" />
            Cadastrar pet
          </Link>
        </Button>
      </div>

      <Button asChild className="mt-5 w-full sm:hidden">
        <Link to="/pets/new"><Plus className="h-4 w-4" />Cadastrar pet</Link>
      </Button>

      <div className="mt-8 grid gap-3 rounded-2xl border border-border/70 bg-card p-2.5 shadow-card md:grid-cols-[auto_minmax(240px,1fr)] md:items-center">
        <Tabs value={scope} onValueChange={(value) => setScope(value as "mine" | "shared")}>
          <TabsList className="grid h-auto w-full grid-cols-1 min-[451px]:grid-cols-2 md:w-auto">
            <TabsTrigger className="min-w-0 whitespace-normal break-words px-2 text-center" value="mine">Meus pets</TabsTrigger>
            <TabsTrigger className="min-w-0 whitespace-normal break-words px-2 text-center" value="shared">Compartilhados comigo</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          <Input
            id="pets-search"
            placeholder="Buscar por nome ou raça"
            aria-label="Buscar por nome ou raça"
            className="border-transparent bg-secondary/45 pl-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-7">
        {petsQuery.isPending ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-3 rounded-2xl border border-border bg-card p-3 shadow-card">
                <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-16 w-full rounded-2xl" />
              </div>
            ))}
          </div>
        ) : petsQuery.isError ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-card">
            <p className="text-foreground">Não foi possível carregar seus pets.</p>
            <Button className="mt-4" onClick={() => petsQuery.refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : pets.length === 0 ? (
          <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-brand-surface px-6 py-14 text-center">
            <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-2xl bg-card text-primary shadow-card"><PawPrint className="h-9 w-9" /></div>
            <p className="text-lg font-semibold text-foreground">
              {search.trim()
                ? "Nenhum pet encontrado para esta busca."
                : scope === "mine"
                  ? "Você ainda não cadastrou nenhum pet."
                  : "Nenhum pet foi compartilhado com você."}
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{search.trim() ? "Tente buscar por outro nome ou raça." : scope === "mine" ? "Cadastre seu primeiro companheiro e mantenha os cuidados sempre organizados." : "Quando alguém compartilhar um pet com você, ele aparecerá aqui."}</p>
            {scope === "mine" && !search.trim() ? (
              <Button asChild className="mt-6">
                <Link to="/pets/new"><Heart className="h-4 w-4" />Cadastrar pet</Link>
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pets.map((pet) => (
              <PetCard key={pet.id} pet={pet} showOwner={scope === "shared"} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
