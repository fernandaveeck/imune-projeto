import { useState } from "react";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/imune/PasswordInput";
import { AuthShell } from "@/components/imune/AuthShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/pets" });
  },
  head: () => ({
    meta: [
      { title: "Entrar — Imune" },
      { name: "description", content: "Acesse o Imune para acompanhar as vacinas dos seus pets." },
      { property: "og:title", content: "Entrar — Imune" },
      {
        property: "og:description",
        content: "Acesse o Imune para acompanhar as vacinas dos seus pets.",
      },
    ],
  }),
  component: LoginPage,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string | undefined; password?: string | undefined }>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;

    const next: { email?: string | undefined; password?: string | undefined } = {};
    if (!email.trim()) next.email = "Informe seu e-mail.";
    else if (!EMAIL_RE.test(email.trim())) next.email = "Digite um endereço de e-mail válido.";
    if (!password) next.password = "Informe sua senha.";
    setErrors(next);
    if (next.email) {
      document.getElementById("login-email")?.focus();
      return;
    }
    if (next.password) {
      document.getElementById("login-password")?.focus();
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setErrors({ password: "E-mail ou senha incorretos. Verifique os dados e tente novamente." });
        toast.error("Não foi possível realizar o login.");
        return;
      }
      toast.success("Login realizado com sucesso.");
      navigate({ to: "/pets", replace: true });
    } catch {
      toast.error("Não foi possível realizar o login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
          <p className="text-sm font-semibold text-primary">Boas-vindas de volta</p>
          <h1 className="mt-2 text-4xl font-semibold text-foreground">Entrar</h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Acompanhe a vacinação dos seus pets.
          </p>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <Label htmlFor="login-email">E-mail *</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((prev) => (prev.email ? { ...prev, email: undefined } : prev));
                }}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "login-email-error" : undefined}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email ? (
                <p id="login-email-error" className="text-sm text-destructive">
                  {errors.email}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Senha *</Label>
              <PasswordInput
                id="login-password"
                placeholder="Digite sua senha"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => (prev.password ? { ...prev, password: undefined } : prev));
                }}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "login-password-error" : undefined}
                className={errors.password ? "border-destructive" : ""}
              />
              {errors.password ? (
                <p id="login-password-error" className="text-sm text-destructive">
                  {errors.password}
                </p>
              ) : null}
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="mt-8 border-t border-border/70 pt-7 text-center text-sm text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Criar conta
            </Link>
          </p>
    </AuthShell>
  );
}
