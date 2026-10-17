import { createServerFn } from "@tanstack/react-start";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const checkEmailAvailable = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string }) => {
    const email = String(input?.email ?? "")
      .trim()
      .toLowerCase();
    if (!EMAIL_RE.test(email) || email.length > 255) {
      throw new Error("E-mail inválido.");
    }
    return { email };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", data.email)
      .limit(1);
    if (error) return { available: true, checked: false };
    return { available: (rows?.length ?? 0) === 0, checked: true };
  });
