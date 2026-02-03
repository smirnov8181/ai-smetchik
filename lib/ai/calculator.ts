import { WorkItem, PricedWorkItem, PriceCatalogItem } from "@/lib/supabase/types";
import { createServiceClient } from "@/lib/supabase/server";

// Fuzzy match work name to catalog
function findBestMatch(
  workName: string,
  catalog: PriceCatalogItem[]
): PriceCatalogItem | null {
  const normalized = workName.toLowerCase().trim();

  // Exact match
  const exact = catalog.find(
    (item) => item.work_name.toLowerCase() === normalized
  );
  if (exact) return exact;

  // Partial match — check if catalog name is contained in work name or vice versa
  const partial = catalog.find(
    (item) =>
      normalized.includes(item.work_name.toLowerCase()) ||
      item.work_name.toLowerCase().includes(normalized)
  );
  if (partial) return partial;

  // Word overlap match
  const workWords = normalized.split(/\s+/);
  let bestMatch: PriceCatalogItem | null = null;
  let bestScore = 0;

  for (const item of catalog) {
    const catalogWords = item.work_name.toLowerCase().split(/\s+/);
    const overlap = workWords.filter((w) =>
      catalogWords.some((cw) => cw.includes(w) || w.includes(cw))
    ).length;
    const score = overlap / Math.max(workWords.length, catalogWords.length);
    if (score > bestScore && score >= 0.4) {
      bestScore = score;
      bestMatch = item;
    }
  }

  return bestMatch;
}

export async function calculatePrices(
  workItems: WorkItem[]
): Promise<PricedWorkItem[]> {
  const supabase = createServiceClient();

  const { data: catalog, error } = await supabase
    .from("price_catalog")
    .select("*")
    .eq("region", "moscow");

  if (error) {
    throw new Error(`Failed to fetch price catalog: ${error.message}`);
  }

  return workItems.map((item) => {
    const catalogItem = findBestMatch(item.work, catalog || []);

    const pricePerUnit = catalogItem?.price_avg ?? estimateDefaultPrice(item);
    const laborCost = Math.round(pricePerUnit * item.quantity);
    // Rough material estimate: ~40% of labor for most work types
    const materialCost = Math.round(laborCost * getMaterialRatio(item.category));
    const total = laborCost + materialCost;

    return {
      ...item,
      price_per_unit: pricePerUnit,
      material_cost: materialCost,
      labor_cost: laborCost,
      total,
    };
  });
}

function estimateDefaultPrice(item: WorkItem): number {
  // Fallback prices by category when no catalog match
  const defaults: Record<string, number> = {
    "Демонтаж": 200,
    "Стены": 400,
    "Потолок": 500,
    "Пол": 500,
    "Электрика": 1000,
    "Сантехника": 3000,
    "Двери": 3500,
    "Окна": 1000,
    "Черновые работы": 600,
    "Уборка": 200,
  };
  return defaults[item.category] ?? 500;
}

function getMaterialRatio(category: string): number {
  // Material cost as ratio of labor cost
  const ratios: Record<string, number> = {
    "Демонтаж": 0.05,
    "Стены": 0.5,
    "Потолок": 0.4,
    "Пол": 0.6,
    "Электрика": 0.7,
    "Сантехника": 0.3,
    "Двери": 0.1,
    "Окна": 0.2,
    "Черновые работы": 0.5,
    "Уборка": 0.1,
  };
  return ratios[category] ?? 0.4;
}
