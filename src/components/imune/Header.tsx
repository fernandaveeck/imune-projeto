import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";

export function Header() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-card/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between gap-3 px-4">
        <Link to="/pets" aria-label="Ir para meus pets" className="shrink-0">
          <Logo className="h-10" />
        </Link>
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="flex min-w-0 items-center gap-2 rounded-xl bg-secondary/70 px-2.5 py-2 sm:px-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <UserRound className="h-3.5 w-3.5" />
            </span>
            <span className="truncate text-xs font-semibold text-foreground sm:text-sm">
              Convidado
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/login" })}>
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
