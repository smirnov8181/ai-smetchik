import { EstimateResult } from "@/lib/supabase/types";

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
