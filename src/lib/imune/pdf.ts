import jsPDF from "jspdf";
import type { PetWithRelations } from "./types";
import { ageLabel, formatShortDate, formatWeight, sexLabel, speciesLabel } from "./format";
import { getPhotoUrl } from "./api";
import logoUrl from "@/assets/logo.png";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 44;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const COLORS = {
  primary: [119, 101, 201] as const,
  primaryDark: [82, 68, 159] as const,
  blue: [115, 160, 219] as const,
  ink: [48, 43, 67] as const,
  muted: [105, 99, 123] as const,
  surface: [248, 247, 252] as const,
  lavender: [236, 234, 247] as const,
  border: [225, 221, 235] as const,
  white: [255, 255, 255] as const,
};

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function fetchPhotoDataUrl(path: string): Promise<string | null> {
  try {
    const url = await getPhotoUrl(path);
    if (!url) return null;
    const response = await fetch(url);
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function fetchImageDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function exportPetPdf(pet: PetWithRelations) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const logo = await fetchImageDataUrl(logoUrl);
  let pageNumber = 1;

  function addPageFrame() {
    doc.setFillColor(...COLORS.surface);
    doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, "F");
    if (logo) {
      doc.addImage(logo, "PNG", MARGIN, 25, 41, 46);
    }
    doc.setTextColor(...COLORS.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("CARTEIRA DE VACINAÇÃO", MARGIN + 52, 54);
    doc.setDrawColor(...COLORS.border);
    doc.line(MARGIN, PAGE_HEIGHT - 38, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 38);
    doc.setFontSize(8);
    doc.text(`Emitido em ${new Date().toLocaleDateString("pt-BR")}`, MARGIN, PAGE_HEIGHT - 22);
    doc.text(`Página ${pageNumber}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 22, { align: "right" });
  }

  function newPage() {
    doc.addPage();
    pageNumber += 1;
    addPageFrame();
    return 98;
  }

  addPageFrame();
  let y = 98;

  const photo = await fetchPhotoDataUrl(pet.photo_path);
  if (photo) {
    try {
      doc.setFillColor(...COLORS.lavender);
      doc.roundedRect(MARGIN, y, 126, 126, 7, 7, "F");
      doc.addImage(photo, "JPEG", MARGIN + 5, y + 5, 116, 116);
    } catch {
      /* imagem opcional */
    }
  }

  const infoX = photo ? MARGIN + 150 : MARGIN;
  let infoY = y + 25;
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("PERFIL DO PET", infoX, infoY);
  infoY += 23;
  doc.setTextColor(...COLORS.ink);
  doc.setFontSize(24);
  doc.text(pet.name, infoX, infoY);
  infoY += 18;

  const details = [
    { label: "ESPÉCIE", value: speciesLabel(pet.species) },
    { label: "RAÇA", value: pet.breed },
    { label: "IDADE", value: ageLabel(pet.birth_date, pet.approx_birth_year) },
    { label: "PESO", value: formatWeight(Number(pet.weight)) },
    { label: "SEXO", value: sexLabel(pet.sex) },
    { label: "TITULAR", value: pet.owner?.name ?? "—" },
    {
      label: "COTITULARES",
      value: pet.cotitulares.map((cotitular) => cotitular.name).join(", ") || "Nenhum",
    },
  ];
  const detailsGap = 8;
  const detailsWidth = PAGE_WIDTH - MARGIN - infoX;
  const detailWidth = (detailsWidth - detailsGap) / 2;

  for (let index = 0; index < details.length; index += 2) {
    const row = details.slice(index, index + 2);
    const valueLines = row.map((detail) =>
      doc.splitTextToSize(detail.value, detailWidth - 18) as string[],
    );
    const rowHeight = Math.max(39, ...valueLines.map((lines) => 27 + lines.length * 10));

    row.forEach((detail, columnIndex) => {
      const detailX = infoX + columnIndex * (detailWidth + detailsGap);
      doc.setFillColor(...COLORS.white);
      doc.setDrawColor(...COLORS.border);
      doc.roundedRect(detailX, infoY, detailWidth, rowHeight - 5, 4, 4, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.primary);
      doc.text(detail.label, detailX + 9, infoY + 12);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.ink);
      doc.text(valueLines[columnIndex] ?? [], detailX + 9, infoY + 26);
    });

    infoY += rowHeight;
  }

  y = Math.max(infoY, y + 126) + 30;

  if (pet.notes) {
    const noteLines = doc.splitTextToSize(pet.notes, CONTENT_WIDTH - 28) as string[];
    const noteHeight = 48 + noteLines.length * 13;
    if (y + noteHeight > PAGE_HEIGHT - 60) y = newPage();
    doc.setFillColor(...COLORS.lavender);
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, noteHeight, 10, 10, "F");
    doc.setTextColor(...COLORS.primaryDark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("OBSERVAÇÕES", MARGIN + 14, y + 21);
    y += 39;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.ink);
    noteLines.forEach((line) => {
      doc.text(line, MARGIN + 14, y);
      y += 13;
    });
    y += 42;
  }

  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("CARTEIRA DE CUIDADOS", MARGIN, y);
  y += 22;
  doc.setTextColor(...COLORS.ink);
  doc.setFontSize(18);
  doc.text("Histórico de vacinação", MARGIN, y);
  y += 24;

  const sorted = [...pet.vaccinations].sort((a, b) =>
    b.administered_at.localeCompare(a.administered_at),
  );

  if (sorted.length === 0) {
    doc.setFillColor(...COLORS.white);
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 54, 10, 10, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.muted);
    doc.text("Nenhuma vacina registrada.", MARGIN + 16, y + 32);
  } else {
    sorted.forEach((vaccine) => {
      const notes = vaccine.notes ? (doc.splitTextToSize(vaccine.notes, CONTENT_WIDTH - 32) as string[]) : [];
      const blockHeight = 64 + notes.length * 12;
      if (y + blockHeight > PAGE_HEIGHT - 58) y = newPage();
      doc.setFillColor(...COLORS.white);
      doc.setDrawColor(...COLORS.border);
      doc.roundedRect(MARGIN, y, CONTENT_WIDTH, blockHeight - 8, 10, 10, "FD");
      doc.setFillColor(...COLORS.blue);
      doc.roundedRect(MARGIN + 12, y + 14, 34, 34, 8, 8, "F");
      doc.setTextColor(...COLORS.white);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("V", MARGIN + 29, y + 36, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...COLORS.ink);
      doc.text(vaccine.name, MARGIN + 58, y + 25);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.muted);
      doc.text(
        `Aplicada em ${formatShortDate(vaccine.administered_at)} · Próxima aplicação em ${formatShortDate(vaccine.next_due_at)}`,
        MARGIN + 58,
        y + 42,
      );
      if (notes.length) {
        let notesY = y + 62;
        doc.setTextColor(...COLORS.ink);
        notes.forEach((line) => {
          doc.text(line, MARGIN + 16, notesY);
          notesY += 12;
        });
      }
      y += blockHeight;
    });
  }

  doc.save(`imune-${slugify(pet.name)}.pdf`);
}
