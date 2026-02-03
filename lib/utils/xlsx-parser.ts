/**
 * XLSX parser for contractor estimates
 * Parses xlsx files and extracts work items with prices
 */

import * as XLSX from "xlsx";
import { ContractorWorkItem } from "@/lib/supabase/types";
import { GEL_TO_RUB } from "@/lib/data/extracted-prices";

export interface ParsedContractorEstimate {
  items: ContractorWorkItem[];
  total: number;
  metadata: {
    address?: string;
    customer?: string;
    area_sqm?: number;
    currency?: "RUB" | "GEL" | "USD";
  };
}

// Category detection patterns
const CATEGORY_PATTERNS: Record<string, string[]> = {
  "Подготовительные": [
    "подготов", "заклеив", "защит", "укрыв", "пленк", "картон", "уборка", "вынос", "очистк"
  ],
  "Демонтаж": [
    "демонтаж", "снятие", "разбор", "удален", "слом", "сбивка", "срез", "вывоз мусор"
  ],
  "Стены": [
    "штукатурк", "шпаклев", "шпатлев", "грунтов стен", "стен", "обои", "покраск стен",
    "малярн", "гипсокартон стен", "откос", "армир сет", "маяк"
  ],
  "Полы": [
    "стяжк", "наливн", "пол", "ламинат", "плинтус", "паркет", "линолеум",
    "гидроизоляц пол", "порог"
  ],
  "Потолки": [
    "потолок", "потолк", "натяжн", "гкл потолок", "короб"
  ],
  "Плитка": [
    "плитк", "кафел", "керамогранит", "мозаик", "затирк", "фуг"
  ],
  "Электрика": [
    "электр", "розетк", "выключател", "провод", "кабел", "щит", "автомат",
    "точка осв", "светильник", "люстр", "бра", "подсветк"
  ],
  "Сантехника": [
    "сантехник", "труб", "канализ", "водопровод", "унитаз", "раковин", "смесител",
    "ванн", "душ", "инсталляц", "полотенцесуш", "водонагрев", "слив", "сифон"
  ],
  "Двери": [
    "дверь", "дверн", "наличник", "коробк двер"
  ],
  "Окна": [
    "окно", "оконн", "подоконник", "откос окон"
  ],
  "Черновые работы": [
    "черновой", "штроб", "бетон", "кладк", "кирпич", "пеноблок", "перегородк",
    "арматур", "опалубк"
  ],
};

/**
 * Detect category from work name
 */
function detectCategory(workName: string): string {
  const lower = workName.toLowerCase();

  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    for (const pattern of patterns) {
      if (lower.includes(pattern)) {
        return category;
      }
    }
  }

  return "Прочее";
}

/**
 * Detect unit from cell value or work name
 */
function detectUnit(value: string, workName: string): string {
  const lower = (value || "").toLowerCase().trim();
  const workLower = workName.toLowerCase();

  // Check explicit unit value
  if (["м²", "м2", "кв.м", "кв.м.", "м.кв", "кв м"].includes(lower)) return "м²";
  if (["м.п.", "мп", "м.п", "п.м.", "п.м", "пог.м", "пм"].includes(lower)) return "м.п.";
  if (["шт", "шт.", "штук", "штука"].includes(lower)) return "шт";
  if (["точка", "точк", "точек", "тч"].includes(lower)) return "точка";
  if (["компл", "компл.", "комплект"].includes(lower)) return "компл.";
  if (["м³", "м3", "куб.м", "куб м"].includes(lower)) return "м³";

  // Infer from work name
  if (workLower.includes("дверь") || workLower.includes("унитаз") ||
      workLower.includes("раковин") || workLower.includes("смеситель") ||
      workLower.includes("ванн") || workLower.includes("светильник")) {
    return "шт";
  }
  if (workLower.includes("плинтус") || workLower.includes("откос") ||
      workLower.includes("кабел") || workLower.includes("провод")) {
    return "м.п.";
  }
  if (workLower.includes("розетк") || workLower.includes("выключател") ||
      workLower.includes("точка") || workLower.includes("точек")) {
    return "точка";
  }

  return "м²"; // Default
}

/**
 * Extract price from cell value
 */
function extractPrice(value: unknown): number | null {
  if (typeof value === "number" && !isNaN(value)) {
    return value;
  }
  if (typeof value === "string") {
    // Remove currency symbols and spaces
    const cleaned = value.replace(/[₾₽$€\s,]/g, "").replace(",", ".");
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  return null;
}

/**
 * Normalize work name
 */
function normalizeWorkName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^\d+[\.\)]\s*/, "") // Remove numbering
    .replace(/^[-–—]\s*/, ""); // Remove leading dashes
}

/**
 * Detect currency from sheet content
 */
function detectCurrency(sheet: XLSX.Sheet): "RUB" | "GEL" | "USD" {
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");

  for (let r = range.s.r; r <= Math.min(range.e.r, 20); r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      if (cell && typeof cell.v === "string") {
        const val = cell.v.toLowerCase();
        if (val.includes("₾") || val.includes("gel") || val.includes("лари")) {
          return "GEL";
        }
        if (val.includes("$") || val.includes("usd") || val.includes("доллар")) {
          return "USD";
        }
        if (val.includes("₽") || val.includes("руб") || val.includes("rub")) {
          return "RUB";
        }
      }
    }
  }

  return "GEL"; // Default based on our examples
}

/**
 * Extract metadata from sheet (address, customer, area)
 */
function extractMetadata(sheet: XLSX.Sheet): ParsedContractorEstimate["metadata"] {
  const metadata: ParsedContractorEstimate["metadata"] = {};
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");

  for (let r = range.s.r; r <= Math.min(range.e.r, 15); r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      if (cell && typeof cell.v === "string") {
        const val = cell.v.toLowerCase();

        // Look for address
        if (val.includes("адрес") || val.includes("объект")) {
          const nextCell = sheet[XLSX.utils.encode_cell({ r, c: c + 1 })];
          if (nextCell && nextCell.v) {
            metadata.address = String(nextCell.v).trim();
          }
        }

        // Look for customer
        if (val.includes("заказчик") || val.includes("клиент")) {
          const nextCell = sheet[XLSX.utils.encode_cell({ r, c: c + 1 })];
          if (nextCell && nextCell.v) {
            metadata.customer = String(nextCell.v).trim();
          }
        }

        // Look for area
        if (val.includes("площадь") && val.includes("м")) {
          const nextCell = sheet[XLSX.utils.encode_cell({ r, c: c + 1 })];
          const areaValue = extractPrice(nextCell?.v);
          if (areaValue && areaValue > 0 && areaValue < 10000) {
            metadata.area_sqm = areaValue;
          }
        }
      }
    }
  }

  return metadata;
}

/**
 * Parse contractor estimate from xlsx buffer
 */
export function parseContractorXlsx(buffer: Buffer): ParsedContractorEstimate {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const items: ContractorWorkItem[] = [];
  let total = 0;
  let metadata: ParsedContractorEstimate["metadata"] = {};
  let currency: "RUB" | "GEL" | "USD" = "GEL";

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];

    // Detect currency and extract metadata from first sheet
    if (workbook.SheetNames.indexOf(sheetName) === 0) {
      currency = detectCurrency(sheet);
      metadata = { ...extractMetadata(sheet), currency };
    }

    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      header: 1,
      defval: ""
    }) as unknown[][];

    // Find header row (contains "наименование" or similar)
    let headerRow = -1;
    let colIndices = {
      name: -1,
      unit: -1,
      quantity: -1,
      price: -1,
      total: -1
    };

    for (let i = 0; i < Math.min(data.length, 15); i++) {
      const row = data[i];
      if (!row) continue;

      for (let j = 0; j < row.length; j++) {
        const cell = String(row[j] || "").toLowerCase();
        if (cell.includes("наименование") || cell.includes("название") || cell.includes("работ")) {
          headerRow = i;
          colIndices.name = j;
        }
        if (cell.includes("ед.") || cell.includes("единиц") || cell === "ед") {
          colIndices.unit = j;
        }
        if (cell.includes("кол-во") || cell.includes("количеств") || cell.includes("объем")) {
          colIndices.quantity = j;
        }
        if (cell.includes("цена") && !cell.includes("итого")) {
          colIndices.price = j;
        }
        if (cell.includes("сумма") || cell.includes("итого") || cell.includes("всего")) {
          colIndices.total = j;
        }
      }

      if (headerRow >= 0) break;
    }

    // Parse data rows
    const startRow = headerRow >= 0 ? headerRow + 1 : 0;

    for (let i = startRow; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 3) continue;

      // Try to find work name
      let workName = "";
      let unit = "";
      let quantity: number | null = null;
      let price: number | null = null;
      let rowTotal: number | null = null;

      // Use detected column indices if available
      if (colIndices.name >= 0) {
        workName = normalizeWorkName(String(row[colIndices.name] || ""));
      }
      if (colIndices.unit >= 0) {
        unit = String(row[colIndices.unit] || "");
      }
      if (colIndices.quantity >= 0) {
        quantity = extractPrice(row[colIndices.quantity]);
      }
      if (colIndices.price >= 0) {
        price = extractPrice(row[colIndices.price]);
      }
      if (colIndices.total >= 0) {
        rowTotal = extractPrice(row[colIndices.total]);
      }

      // Fallback: scan row for values
      if (!workName) {
        for (let j = 0; j < row.length; j++) {
          const cell = row[j];
          if (typeof cell === "string" && cell.length > 5 && !workName) {
            const lower = cell.toLowerCase();
            // Skip headers and totals
            if (lower.includes("наименование") || lower.includes("№") ||
                lower === "итого" || lower === "всего" || lower.includes("сумма")) {
              continue;
            }
            workName = normalizeWorkName(cell);
          }
        }
      }

      // Try to extract numbers if not found
      if (quantity === null || price === null) {
        const numbers: number[] = [];
        for (const cell of row) {
          const num = extractPrice(cell);
          if (num !== null && num > 0 && num < 1000000) {
            numbers.push(num);
          }
        }

        // Heuristic: smaller numbers are likely quantity, larger are prices
        if (numbers.length >= 2) {
          numbers.sort((a, b) => a - b);
          if (quantity === null) quantity = numbers[0];
          if (price === null && numbers.length >= 3) {
            price = numbers[1]; // Middle number is often unit price
          }
          if (rowTotal === null) rowTotal = numbers[numbers.length - 1];
        }
      }

      // Skip if we don't have enough data
      if (!workName || workName.length < 3) continue;
      if (quantity === null || quantity <= 0) continue;

      // Calculate missing values
      if (price === null && rowTotal !== null && quantity > 0) {
        price = Math.round(rowTotal / quantity);
      }
      if (rowTotal === null && price !== null && quantity > 0) {
        rowTotal = Math.round(price * quantity);
      }

      if (price === null || price <= 0) continue;
      if (rowTotal === null) rowTotal = Math.round(price * quantity);

      // Convert currency to RUB
      let priceRub = price;
      let totalRub = rowTotal;
      if (currency === "GEL") {
        priceRub = Math.round(price * GEL_TO_RUB);
        totalRub = Math.round(rowTotal * GEL_TO_RUB);
      } else if (currency === "USD") {
        priceRub = Math.round(price * 90); // Approximate USD rate
        totalRub = Math.round(rowTotal * 90);
      }

      const category = detectCategory(workName);
      const detectedUnit = detectUnit(unit, workName);

      items.push({
        category,
        work: workName,
        unit: detectedUnit,
        quantity,
        contractor_price: priceRub,
        contractor_total: totalRub,
      });

      total += totalRub;
    }
  }

  // If we didn't calculate total from items, try to find it in the sheet
  if (total === 0 && items.length > 0) {
    total = items.reduce((sum, item) => sum + item.contractor_total, 0);
  }

  return {
    items,
    total,
    metadata,
  };
}

/**
 * Check if a buffer is an xlsx file
 */
export function isXlsxBuffer(buffer: Buffer): boolean {
  // XLSX files start with PK (ZIP signature)
  return buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4B;
}
