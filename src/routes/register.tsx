import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/imune/PasswordInput";
import { AuthShell } from "@/components/imune/AuthShell";
import { supabase } from "@/integrations/supabase/client";
import { checkEmailAvailable } from "@/lib/imune/auth.functions";

export const Route = createFileRoute("/register")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/pets" });
  },
  head: () => ({
    meta: [
      { title: "Criar conta — Imune" },
      {
        name: "description",
        content: "Crie sua conta no Imune e registre as vacinas dos seus pets.",
      },
      { property: "og:title", content: "Criar conta — Imune" },
      {
        property: "og:description",
        content: "Crie sua conta no Imune e registre as vacinas dos seus pets.",
      },
    ],
  }),
  component: RegisterPage,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_TAKEN = "Já existe uma conta cadastrada com este e-mail.";

interface RegisterErrors {
  name?: string | undefined;
  email?: string | undefined;
  password?: string | undefined;
  confirmPassword?: string | undefined;
}

function messageForSignUpError(message: string): { field?: keyof RegisterErrors; toast: string } {
  const m = message.toLowerCase();
  if (/already registered|already been registered|user already exists|exists/.test(m)) {
    return { field: "email", toast: EMAIL_TAKEN };
  }
  if (/rate limit|too many requests/.test(m)) {
    return {
      toast: "Muitas tentativas de cadastro. Aguarde alguns minutos e tente novamente.",
    };
  }
  if (/invalid email|email address.*invalid/.test(m)) {
    return { field: "email", toast: "Digite um endereço de e-mail válido." };
  }
  if (/password/.test(m)) {
    return { field: "password", toast: "A senha deve possuir pelo menos 6 caracteres." };
  }
  return { toast: "Não foi possível criar sua conta. Verifique os dados e tente novamente." };
}

function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const value = email.trim().toLowerCase();
    if (!value || !EMAIL_RE.test(value)) {
      setCheckingEmail(false);
      setErrors((prev) => (prev.email === EMAIL_TAKEN ? { ...prev, email: undefined } : prev));
      return;
    }

    setCheckingEmail(true);
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      try {
        const result = await checkEmailAvailable({ data: { email: value } });
        if (id !== requestId.current) return;
        setErrors((prev) => ({
          ...prev,
          email: result.checked && !result.available ? EMAIL_TAKEN : undefined,
        }));
      } catch {
        if (id === requestId.current) setErrors((prev) => ({ ...prev, email: undefined }));
      } finally {
        if (id === requestId.current) setCheckingEmail(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [email]);

  function validate(): RegisterErrors {
    const next: RegisterErrors = {};
    if (!name.trim()) next.name = "Informe seu nome.";
    else if (name.trim().length < 2) next.name = "O nome deve possuir pelo menos 2 caracteres.";
    if (!email.trim()) next.email = "Informe seu e-mail.";
    else if (!EMAIL_RE.test(email.trim())) next.email = "Digite um endereço de e-mail válido.";
    else if (errors.email === EMAIL_TAKEN) next.email = EMAIL_TAKEN;
    if (!password) next.password = "Informe uma senha.";
    else if (password.length < 6) next.password = "A senha deve possuir pelo menos 6 caracteres.";
    if (!confirmPassword) next.confirmPassword = "Confirme sua senha.";
    else if (confirmPassword !== password)
      next.confirmPassword = "As senhas informadas não são iguais.";
    return next;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (loading || checkingEmail) return;

    const next = validate();
    setErrors(next);

    const firstError = (
      [
        ["name", next.name],
        ["email", next.email],
        ["password", next.password],
        ["confirm-password", next.confirmPassword],
      ] as const
    ).find(([, message]) => Boolean(message));
    if (firstError) {
      document.getElementById(`register-${firstError[0]}`)?.focus();
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name: name.trim() },
          emailRedirectTo: `${window.location.origin}/pets`,
        },
      });
      if (error) {
        console.error("[Imune] signUp error", error.status, error.message);
        const mapped = messageForSignUpError(error.message);
        if (mapped.field) setErrors({ [mapped.field]: mapped.toast });
        toast.error(mapped.toast);
        return;
      }
      toast.success("Conta criada com sucesso.");
      const { data } = await supabase.auth.getUser();
      navigate({ to: data.user ? "/pets" : "/login", replace: true });
    } catch (err) {
      console.error("[Imune] signUp exception", err);
      toast.error("Não foi possível criar sua conta. Verifique os dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
          <p className="text-sm font-semibold text-primary">Comece por aqui</p>
          <h1 className="mt-2 text-4xl font-semibold text-foreground">Criar conta</h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Cadastre-se para acompanhar a vacinação dos seus pets.
          </p>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <Label htmlFor="register-name">Nome *</Label>
              <Input
                id="register-name"
                placeholder="Seu nome completo"
                autoComplete="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors((prev) => (prev.name ? { ...prev, name: undefined } : prev));
                }}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "register-name-error" : undefined}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name ? (
                <p id="register-name-error" className="text-sm text-destructive">
                  {errors.name}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-email">E-mail *</Label>
              <div className="relative">
                <Input
                  id="register-email"
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((prev) => (prev.email ? { ...prev, email: undefined } : prev));
                  }}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "register-email-error" : undefined}
                  className={errors.email ? "border-destructive pr-10" : "pr-10"}
                />
                {checkingEmail ? (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                ) : null}
              </div>
              {checkingEmail ? (
                <p className="text-sm text-muted-foreground">Verificando disponibilidade...</p>
              ) : null}
              {errors.email ? (
                <p id="register-email-error" className="text-sm text-destructive">
                  {errors.email}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-password">Senha *</Label>
              <PasswordInput
                id="register-password"
                placeholder="Mínimo de 6 caracteres"
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => (prev.password ? { ...prev, password: undefined } : prev));
                }}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "register-password-error" : undefined}
                className={errors.password ? "border-destructive" : ""}
              />
              {errors.password ? (
                <p id="register-password-error" className="text-sm text-destructive">
                  {errors.password}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-confirm-password">Confirmar senha *</Label>
              <PasswordInput
                id="register-confirm-password"
                placeholder="Repita a senha"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrors((prev) =>
                    prev.confirmPassword ? { ...prev, confirmPassword: undefined } : prev,
                  );
                }}
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={
                  errors.confirmPassword ? "register-confirm-password-error" : undefined
                }
                className={errors.confirmPassword ? "border-destructive" : ""}
              />
              {errors.confirmPassword ? (
                <p id="register-confirm-password-error" className="text-sm text-destructive">
                  {errors.confirmPassword}
                </p>
              ) : null}
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading || checkingEmail}>
              {loading ? "Criando conta..." : checkingEmail ? "Verificando..." : "Criar conta"}
            </Button>
          </form>

          <p className="mt-8 border-t border-border/70 pt-7 text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Entrar
            </Link>
          </p>
    </AuthShell>
  );
}
