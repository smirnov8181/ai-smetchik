import { ExtractedPrice } from "./price-extractor";

export interface AggregatedPrice {
  category: string;
  work_name: string;
  unit: string;
  price_min: number;
  price_avg: number;
  price_max: number;
  sample_count: number;
  sources: string[];
  region: string;
}

// Remove statistical outliers using IQR method
function removeOutliers(prices: number[]): number[] {
  if (prices.length < 4) return prices;

  const sorted = [...prices].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;

  return sorted.filter((p) => p >= lower && p <= upper);
}

// Normalize work names to group similar items
function normalizeWorkName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/штукатурка стен.*маяк/i, "штукатурка стен по маякам")
    .replace(/шпакл[её]вка стен.*обо/i, "шпаклёвка стен под обои")
    .replace(/шпакл[её]вка стен.*покраск/i, "шпаклёвка стен под покраску")
    .replace(/поклейка.*обо/i, "поклейка обоев")
    .replace(/покраска.*стен/i, "покраска стен")
    .replace(/укладка.*плитк.*стен/i, "укладка плитки на стены")
    .replace(/укладка.*плитк.*пол/i, "укладка плитки на пол")
    .replace(/укладка.*ламинат/i, "укладка ламината")
    .replace(/натяжн.*потол/i, "натяжной потолок")
    .replace(/стяжк.*пол/i, "стяжка пола")
    .replace(/наливн.*пол/i, "наливной пол")
    .replace(/демонтаж.*обо/i, "демонтаж обоев")
    .replace(/демонтаж.*плитк/i, "демонтаж плитки")
    .replace(/гидроизол/i, "гидроизоляция пола")
    .replace(/установк.*розетк/i, "установка розетки")
    .replace(/установк.*выключател/i, "установка выключателя")
    .replace(/установк.*унитаз/i, "установка унитаза")
    .replace(/установк.*ванн/i, "установка ванны")
    .replace(/установк.*раковин/i, "установка раковины")
    .replace(/установк.*смесител/i, "установка смесителя")
    .replace(/монтаж.*плинтус/i, "монтаж плинтусов")
    .trim();
}

export function aggregatePrices(
  allPrices: ExtractedPrice[],
  region = "moscow"
): AggregatedPrice[] {
  // Group by normalized work name + unit
  const groups = new Map<
    string,
    {
      category: string;
      work_name: string;
      unit: string;
      prices: number[];
      sources: Set<string>;
    }
  >();

  for (const price of allPrices) {
    // Skip prices that include materials — we want labor-only for comparison
    if (price.includes_materials) continue;

    const normalized = normalizeWorkName(price.work_name);
    const key = `${normalized}|${price.unit}`;

    if (!groups.has(key)) {
      groups.set(key, {
        category: price.category,
        work_name: normalized.charAt(0).toUpperCase() + normalized.slice(1),
        unit: price.unit,
        prices: [],
        sources: new Set(),
      });
    }

    const group = groups.get(key)!;
    group.prices.push(price.price);
    group.sources.add(price.source_name);
  }

  // Aggregate each group
  const results: AggregatedPrice[] = [];

  for (const group of groups.values()) {
    if (group.prices.length < 1) continue;

    const cleaned = removeOutliers(group.prices);
    if (cleaned.length === 0) continue;

    const sorted = [...cleaned].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    results.push({
      category: group.category,
      work_name: group.work_name,
      unit: group.unit,
      price_min: sorted[0],
      price_avg: Math.round(sum / sorted.length),
      price_max: sorted[sorted.length - 1],
      sample_count: sorted.length,
      sources: Array.from(group.sources),
      region,
    });
  }

  // Sort by category then work name
  return results.sort((a, b) =>
    a.category === b.category
      ? a.work_name.localeCompare(b.work_name)
      : a.category.localeCompare(b.category)
  );
}
