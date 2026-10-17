import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/imune/AuthShell";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — Imune Demo" },
      { name: "description", content: "Explore a demonstração do Imune como convidado." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();

  return (
    <AuthShell>
      <p className="text-sm font-semibold text-primary">Boas-vindas de volta</p>
      <h1 className="mt-2 text-4xl font-semibold text-foreground">Entrar</h1>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground">
        Acompanhe a vacinação dos seus pets.
      </p>
      <Button size="lg" className="mt-7 w-full" onClick={() => navigate({ to: "/pets" })}>
        Entrar como convidado <ArrowRight className="h-4 w-4" />
      </Button>
    </AuthShell>
  );
}
