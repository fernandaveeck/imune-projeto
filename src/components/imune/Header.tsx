import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { VaccinationNotifications } from "./VaccinationNotifications";
import { Logo } from "./Logo";

export function Header() {
  const { data: profile } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate({ to: "/login", replace: true });
    } catch {
      toast.error("Não foi possível encerrar sua sessão. Tente novamente.");
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-card/90 backdrop-blur-xl">
      <div className="mx-auto grid h-[72px] max-w-[1200px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 sm:flex sm:justify-between">
        <Link to="/pets" aria-label="Ir para meus pets">
          <Logo className="h-10 w-auto" />
        </Link>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {profile ? (
            <div className="hidden items-center gap-2 rounded-xl bg-secondary/70 px-3 py-2 sm:flex">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
                <UserRound className="h-3.5 w-3.5" />
              </span>
              <span className="max-w-36 truncate text-sm font-semibold text-foreground">
                {profile.name}
              </span>
            </div>
          ) : null}
          <VaccinationNotifications userId={profile?.id ?? ""} />
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
