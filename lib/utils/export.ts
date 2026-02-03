import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { EstimateResult } from "@/lib/supabase/types";

// Extend jsPDF type for autotable plugin
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: Record<string, unknown>) => jsPDF;
  }
}

export function generateEstimatePdf(
  estimate: EstimateResult,
  estimateId: string
): Buffer {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text("Smeta na remont", 14, 20);

  doc.setFontSize(10);
  doc.text(`ID: ${estimateId}`, 14, 28);
  doc.text(`Data: ${new Date().toLocaleDateString("ru-RU")}`, 14, 34);

  let yPos = 44;

  // Sections
  for (const section of estimate.sections) {
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(section.category, 14, yPos);
    yPos += 6;

    const tableData = section.items.map((item) => [
      item.work,
      `${item.quantity} ${item.unit}`,
      item.price_per_unit.toLocaleString("ru-RU"),
      item.labor_cost.toLocaleString("ru-RU"),
      item.material_cost.toLocaleString("ru-RU"),
      item.total.toLocaleString("ru-RU"),
    ]);

    doc.autoTable({
      startY: yPos,
      head: [["Rabota", "Kolichestvo", "Tsena/ed", "Rabota", "Materialy", "Itogo"]],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
      margin: { left: 14, right: 14 },
    });

    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }
  }

  // Totals
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");

  yPos += 5;
  doc.text(
    `Raboty: ${estimate.subtotal_labor.toLocaleString("ru-RU")} rub.`,
    14,
    yPos
  );
  yPos += 7;
  doc.text(
    `Materialy: ${estimate.subtotal_materials.toLocaleString("ru-RU")} rub.`,
    14,
    yPos
  );
  yPos += 7;
  doc.text(
    `Nakladnye (10%): ${estimate.overhead.toLocaleString("ru-RU")} rub.`,
    14,
    yPos
  );
  yPos += 10;
  doc.setFontSize(14);
  doc.text(
    `ITOGO: ${estimate.total.toLocaleString("ru-RU")} rub.`,
    14,
    yPos
  );

  // Caveats
  if (estimate.caveats.length > 0) {
    yPos += 15;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Primechaniya:", 14, yPos);
    yPos += 6;
    for (const caveat of estimate.caveats) {
      doc.text(`- ${caveat}`, 14, yPos);
      yPos += 5;
    }
  }

  return Buffer.from(doc.output("arraybuffer"));
}

/**
 * Escape a value for CSV (handle commas, quotes, newlines)
 */
function escapeCsvValue(value: string | number): string {
  const str = String(value);
  // If contains comma, quote, or newline - wrap in quotes and escape internal quotes
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generate CSV export of estimate
 * Includes UTF-8 BOM for Excel compatibility
 */
export function generateEstimateCsv(
  estimate: EstimateResult,
  estimateId: string
): string {
  // UTF-8 BOM for Excel
  const BOM = "\uFEFF";

  const lines: string[] = [];

  // Header info
  lines.push(`Смета на ремонт`);
  lines.push(`ID: ${estimateId}`);
  lines.push(`Дата: ${new Date().toLocaleDateString("ru-RU")}`);
  lines.push(""); // Empty line

  // Column headers
  lines.push([
    "Категория",
    "Работа",
    "Ед.изм.",
    "Кол-во",
    "Цена/ед.",
    "Работа (руб.)",
    "Материалы (руб.)",
    "Итого (руб.)"
  ].map(escapeCsvValue).join(","));

  // Data rows
  for (const section of estimate.sections) {
    for (const item of section.items) {
      lines.push([
        item.category,
        item.work,
        item.unit,
        item.quantity,
        item.price_per_unit,
        item.labor_cost,
        item.material_cost,
        item.total
      ].map(escapeCsvValue).join(","));
    }
  }

  // Empty line before totals
  lines.push("");

  // Totals
  lines.push([
    "",
    "",
    "",
    "",
    "",
    "Итого работы:",
    "",
    estimate.subtotal_labor
  ].map(escapeCsvValue).join(","));

  lines.push([
    "",
    "",
    "",
    "",
    "",
    "Итого материалы:",
    "",
    estimate.subtotal_materials
  ].map(escapeCsvValue).join(","));

  lines.push([
    "",
    "",
    "",
    "",
    "",
    "Накладные (10%):",
    "",
    estimate.overhead
  ].map(escapeCsvValue).join(","));

  lines.push([
    "",
    "",
    "",
    "",
    "",
    "ИТОГО:",
    "",
    estimate.total
  ].map(escapeCsvValue).join(","));

  // Caveats
  if (estimate.caveats.length > 0) {
    lines.push("");
    lines.push("Примечания:");
    for (const caveat of estimate.caveats) {
      lines.push(escapeCsvValue(`- ${caveat}`));
    }
  }

  return BOM + lines.join("\r\n");
}
