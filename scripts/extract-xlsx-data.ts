/**
 * Script to extract pricing data from xlsx estimate examples
 * Run with: npx tsx scripts/extract-xlsx-data.ts
 */

import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

interface ExtractedWorkItem {
  name: string;
  variations: string[];
  unit: string;
  priceGel: number;
  category: string;
}

interface ExtractedData {
  works: ExtractedWorkItem[];
  priceStats: Record<string, { min: number; avg: number; max: number; count: number }>;
  materialRatios: Record<string, number>;
}

// Categories for classification
const CATEGORY_PATTERNS: Record<string, string[]> = {
  "Подготовительные": [
    "подготов", "заклеив", "защит", "укрыв", "пленк", "картон", "уборка", "вынос"
  ],
  "Демонтаж": [
    "демонтаж", "снятие", "разбор", "удален", "слом", "сбивка", "срез", "вывоз мусор"
  ],
  "Стены": [
    "штукатурк", "шпаклев", "шпатлев", "грунтов", "стен", "обои", "покраск",
    "малярн", "гипсокартон стен", "откос", "армир", "маяк"
  ],
  "Полы": [
    "стяжк", "наливн", "пол", "ламинат", "плинтус", "паркет", "линолеум",
    "гидроизоляц", "порог", "керамогранит пол"
  ],
  "Потолки": [
    "потолок", "натяжн", "гкл потолок", "короб"
  ],
  "Плитка": [
    "плитк", "кафел", "керамогранит", "мозаик", "затирк", "фуг"
  ],
  "Электрика": [
    "электр", "розетк", "выключател", "провод", "кабел", "щит", "автомат",
    "точка", "светильник", "люстр", "бра", "подсветк"
  ],
  "Сантехника": [
    "сантехник", "труб", "канализ", "водопровод", "унитаз", "раковин", "смесител",
    "ванн", "душ", "инсталляц", "полотенцесуш", "водонагрев", "слив", "сифон"
  ],
  "Двери": [
    "дверь", "дверн", "наличник", "коробк"
  ],
  "Окна": [
    "окно", "оконн", "подоконник", "откос окон"
  ],
  "Черновые работы": [
    "черновой", "штроб", "бетон", "кладк", "кирпич", "пеноблок", "перегородк",
    "арматур", "опалубк"
  ],
};

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

function normalizeWorkName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^\d+[\.\)]\s*/, "") // Remove numbering like "1." or "1)"
    .replace(/^[-–—]\s*/, ""); // Remove leading dashes
}

function extractPriceFromCell(value: unknown): number | null {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    // Remove currency symbols and parse
    const cleaned = value.replace(/[₾₽$€\s,]/g, "").replace(",", ".");
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  return null;
}

function parseXlsxFile(filePath: string): ExtractedWorkItem[] {
  const workbook = XLSX.readFile(filePath);
  const items: ExtractedWorkItem[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      header: 1,
      defval: ""
    }) as unknown[][];

    // Look for rows with work descriptions and prices
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 3) continue;

      // Try to identify work name (usually first non-empty text cell)
      let workName = "";
      let unit = "";
      let price: number | null = null;

      for (let j = 0; j < row.length; j++) {
        const cell = row[j];

        if (typeof cell === "string" && cell.length > 5 && !workName) {
          // Skip header rows
          const lower = cell.toLowerCase();
          if (lower.includes("наименование") || lower.includes("№") ||
              lower.includes("итого") || lower.includes("всего")) {
            continue;
          }
          workName = normalizeWorkName(cell);
        }

        // Detect unit
        if (typeof cell === "string") {
          const cellLower = cell.toLowerCase().trim();
          if (["м²", "м2", "кв.м", "кв.м.", "м.кв"].includes(cellLower)) unit = "м²";
          else if (["м.п.", "мп", "м.п", "п.м.", "п.м"].includes(cellLower)) unit = "м.п.";
          else if (["шт", "шт."].includes(cellLower)) unit = "шт";
          else if (["точка", "точк", "точек"].includes(cellLower)) unit = "точка";
          else if (["компл", "компл.", "комплект"].includes(cellLower)) unit = "компл.";
          else if (["м³", "м3", "куб.м"].includes(cellLower)) unit = "м³";
        }

        // Try to extract price (usually numbers > 1)
        const numPrice = extractPriceFromCell(cell);
        if (numPrice && numPrice > 1 && numPrice < 100000) {
          // Keep the last reasonable price (often per-unit price column)
          price = numPrice;
        }
      }

      if (workName && workName.length > 3 && price && price > 0) {
        items.push({
          name: workName,
          variations: [],
          unit: unit || "м²",
          priceGel: price,
          category: detectCategory(workName),
        });
      }
    }
  }

  return items;
}

function aggregateData(allItems: ExtractedWorkItem[]): ExtractedData {
  // Group by normalized name
  const grouped = new Map<string, ExtractedWorkItem[]>();

  for (const item of allItems) {
    const key = item.name.toLowerCase();
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(item);
  }

  // Calculate statistics
  const priceStats: Record<string, { min: number; avg: number; max: number; count: number }> = {};
  const works: ExtractedWorkItem[] = [];

  for (const [key, items] of grouped) {
    if (items.length === 0) continue;

    const prices = items.map(i => i.priceGel).filter(p => p > 0);
    if (prices.length === 0) continue;

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

    priceStats[key] = { min, avg, max, count: prices.length };

    // Use the first item as the canonical representation
    works.push({
      ...items[0],
      priceGel: Math.round(avg),
      variations: [...new Set(items.map(i => i.name))].slice(0, 5),
    });
  }

  // Calculate material ratios by category
  const materialRatios: Record<string, number> = {
    "Подготовительные": 0.1,
    "Демонтаж": 0.05,
    "Стены": 0.45,
    "Полы": 0.55,
    "Потолки": 0.35,
    "Плитка": 0.6,
    "Электрика": 0.65,
    "Сантехника": 0.4,
    "Двери": 0.15,
    "Окна": 0.2,
    "Черновые работы": 0.5,
    "Прочее": 0.3,
  };

  return { works, priceStats, materialRatios };
}

function generateTypeScriptFile(data: ExtractedData): string {
  const worksByCategory = new Map<string, ExtractedWorkItem[]>();

  for (const work of data.works) {
    if (!worksByCategory.has(work.category)) {
      worksByCategory.set(work.category, []);
    }
    worksByCategory.get(work.category)!.push(work);
  }

  let output = `/**
 * Extracted pricing data from real contractor estimates
 * Generated by scripts/extract-xlsx-data.ts
 *
 * Prices are in GEL (Georgian Lari)
 * Conversion rate: 1 GEL ≈ 34 RUB
 */

export const GEL_TO_RUB = 34;

export interface ExtractedPrice {
  name: string;
  variations: string[];
  unit: string;
  priceGel: number;
  priceRub: number;
  category: string;
}

export const EXTRACTED_PRICES: ExtractedPrice[] = [
`;

  for (const [category, works] of worksByCategory) {
    output += `  // === ${category} ===\n`;
    for (const work of works.slice(0, 20)) { // Limit per category
      output += `  {\n`;
      output += `    name: ${JSON.stringify(work.name)},\n`;
      output += `    variations: ${JSON.stringify(work.variations)},\n`;
      output += `    unit: ${JSON.stringify(work.unit)},\n`;
      output += `    priceGel: ${work.priceGel},\n`;
      output += `    priceRub: ${Math.round(work.priceGel * 34)},\n`;
      output += `    category: ${JSON.stringify(work.category)},\n`;
      output += `  },\n`;
    }
  }

  output += `];

/**
 * Material cost ratios by category (material_cost / labor_cost)
 */
export const MATERIAL_RATIOS: Record<string, number> = ${JSON.stringify(data.materialRatios, null, 2)};

/**
 * Get price for a work item by name (fuzzy match)
 */
export function findPriceByName(workName: string): ExtractedPrice | null {
  const lower = workName.toLowerCase();

  // Exact match
  const exact = EXTRACTED_PRICES.find(p =>
    p.name.toLowerCase() === lower ||
    p.variations.some(v => v.toLowerCase() === lower)
  );
  if (exact) return exact;

  // Partial match
  const partial = EXTRACTED_PRICES.find(p =>
    lower.includes(p.name.toLowerCase()) ||
    p.name.toLowerCase().includes(lower) ||
    p.variations.some(v =>
      lower.includes(v.toLowerCase()) ||
      v.toLowerCase().includes(lower)
    )
  );
  if (partial) return partial;

  // Word overlap
  const words = lower.split(/\\s+/);
  let bestMatch: ExtractedPrice | null = null;
  let bestScore = 0;

  for (const price of EXTRACTED_PRICES) {
    const priceWords = price.name.toLowerCase().split(/\\s+/);
    const overlap = words.filter(w =>
      priceWords.some(pw => pw.includes(w) || w.includes(pw))
    ).length;
    const score = overlap / Math.max(words.length, priceWords.length);

    if (score > bestScore && score >= 0.4) {
      bestScore = score;
      bestMatch = price;
    }
  }

  return bestMatch;
}

/**
 * Get all work names for AI training
 */
export function getAllWorkNames(): string[] {
  return EXTRACTED_PRICES.map(p => p.name);
}

/**
 * Get work names by category
 */
export function getWorkNamesByCategory(category: string): string[] {
  return EXTRACTED_PRICES
    .filter(p => p.category === category)
    .map(p => p.name);
}
`;

  return output;
}

// Main execution
async function main() {
  const examplesDir = path.join(__dirname, "..", "Examples", "примеры смет");

  if (!fs.existsSync(examplesDir)) {
    console.error(`Examples directory not found: ${examplesDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(examplesDir).filter(f => f.endsWith(".xlsx"));
  console.log(`Found ${files.length} xlsx files`);

  const allItems: ExtractedWorkItem[] = [];

  for (const file of files) {
    const filePath = path.join(examplesDir, file);
    console.log(`Processing: ${file}`);

    try {
      const items = parseXlsxFile(filePath);
      console.log(`  Extracted ${items.length} items`);
      allItems.push(...items);
    } catch (err) {
      console.error(`  Error: ${err}`);
    }
  }

  console.log(`\nTotal extracted: ${allItems.length} items`);

  const aggregated = aggregateData(allItems);
  console.log(`Unique works: ${aggregated.works.length}`);

  const tsContent = generateTypeScriptFile(aggregated);
  const outputPath = path.join(__dirname, "..", "lib", "data", "extracted-prices.ts");

  fs.writeFileSync(outputPath, tsContent);
  console.log(`\nGenerated: ${outputPath}`);
}

main().catch(console.error);
