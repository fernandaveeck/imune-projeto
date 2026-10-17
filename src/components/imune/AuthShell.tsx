import type { ReactNode } from "react";
import { HeartPulse, PawPrint, ShieldCheck } from "lucide-react";
import { Logo } from "./Logo";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-6 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-auth-glow" />
      <div className="relative mx-auto grid min-h-[calc(100vh-3rem)] max-w-[1180px] overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-soft lg:grid-cols-[minmax(0,0.92fr)_minmax(440px,0.72fr)]">
        <section className="relative hidden overflow-hidden bg-brand-surface p-12 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border-[42px] border-primary/8" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full border-[48px] border-brand-blue/10" />
          <Logo className="relative z-10 h-16 w-auto self-start" />
          <div className="relative z-10 max-w-md pb-8">
            <p className="font-display text-4xl font-semibold leading-tight text-foreground">
              Cuidado que acompanha cada fase do seu pet.
            </p>
            <p className="mt-5 max-w-sm text-base leading-relaxed text-muted-foreground">
              Uma forma simples e carinhosa de manter vacinas, datas e histórico sempre por perto.
            </p>
          </div>
          <div className="relative z-10 grid grid-cols-2 gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Histórico organizado</span>
            <span className="flex items-center gap-2"><HeartPulse className="h-4 w-4 text-brand-blue" /> Cuidado contínuo</span>
          </div>
        </section>
        <section className="flex min-w-0 items-center justify-center px-5 py-10 sm:px-10 lg:px-14">
          <div className="w-full max-w-[430px]">
            <Logo className="mb-10 h-14 w-auto lg:hidden" />
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
