export function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function todayDateOnly(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function formatLongDate(value: string): string {
  return parseDateOnly(value).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatShortDate(value: string): string {
  return parseDateOnly(value).toLocaleDateString("pt-BR");
}

export function formatWeight(weight: number): string {
  return `${weight.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg`;
}

export function speciesLabel(species: string): string {
  return species === "gato" ? "Gato" : "Cão";
}

export function sexLabel(sex: string): string {
  return sex === "femea" ? "Fêmea" : "Macho";
}

/** Idade calculada apenas na interface — nunca persistida. */
export function ageLabel(birthDate: string | null, approxYear: number | null): string {
  if (birthDate) {
    const birth = parseDateOnly(birthDate);
    const today = todayDateOnly();
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    if (today.getDate() < birth.getDate()) months -= 1;
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    if (years < 1) {
      if (months <= 0) return "menos de 1 mês";
      return months === 1 ? "1 mês" : `${months} meses`;
    }
    return years === 1 ? "1 ano" : `${years} anos`;
  }
  if (approxYear) {
    const years = new Date().getFullYear() - approxYear;
    if (years <= 0) return "aprox. menos de 1 ano";
    return years === 1 ? "aprox. 1 ano" : `aprox. ${years} anos`;
  }
  return "—";
}

export type VaccineTone = "neutral" | "attention" | "today" | "danger";

export interface NextVaccinationStatus {
  label: string;
  tone: VaccineTone;
  days: number;
}

export function nextVaccinationStatus(nextDueAt: string): NextVaccinationStatus {
  const due = parseDateOnly(nextDueAt);
  const today = todayDateOnly();
  const days = Math.round((due.getTime() - today.getTime()) / 86400000);

  if (days > 1) {
    return { label: `Faltam ${days} dias`, tone: days <= 30 ? "attention" : "neutral", days };
  }
  if (days === 1) return { label: "Falta 1 dia", tone: "attention", days };
  if (days === 0) return { label: "É hoje", tone: "today", days };
  if (days === -1) return { label: "Atrasada há 1 dia", tone: "danger", days };
  return { label: `Atrasada há ${Math.abs(days)} dias`, tone: "danger", days };
}

export function toneClasses(tone: VaccineTone): string {
  switch (tone) {
    case "danger":
      return "bg-destructive/10 text-destructive";
    case "today":
      return "bg-primary/10 text-primary";
    case "attention":
      return "bg-warning/15 text-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}
