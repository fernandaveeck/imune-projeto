import logoUrl from "@/assets/logo.png";

export function Logo({ className = "h-10" }: { className?: string }) {
  return (
    <img
      src={logoUrl}
      alt="Imune — sistema de acompanhamento de vacinação de pets"
      className={`${className} w-auto object-contain`}
    />
  );
}

export { logoUrl };
