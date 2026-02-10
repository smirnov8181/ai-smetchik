import { WorkItem, PricedWorkItem } from "@/lib/supabase/types";
import { createServiceClient } from "@/lib/supabase/server";
import { findCatalogMatch } from "./catalog-match";

function isUSRegion(region: string): boolean {
  return region === "us_national" || region.startsWith("US-");
}

export async function calculatePrices(
  workItems: WorkItem[],
  region: string = "moscow"
): Promise<PricedWorkItem[]> {
  const supabase = createServiceClient();

  const table = isUSRegion(region) ? "price_catalog_us" : "price_catalog";
  const queryRegion = region === "us_national" ? "us_national" : region;

  const { data: catalog, error } = await supabase
    .from(table)
    .select("*")
    .eq("region", queryRegion);

  if (error) {
    throw new Error(`Failed to fetch price catalog: ${error.message}`);
  }

  return workItems.map((item) => {
    const catalogItem = findCatalogMatch(item.work, catalog || []);

    const pricePerUnit = catalogItem?.price_avg ?? estimateDefaultPrice(item);
    const laborCost = Math.round(pricePerUnit * item.quantity);
    // Material cost based on work type (0 for labor-only, higher for material-heavy)
    const materialCost = Math.round(laborCost * getMaterialRatio(item.category, item.work));
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

function getMaterialRatio(category: string, workName: string): number {
  const workLower = workName.toLowerCase();

  // Работы БЕЗ материалов (только труд)
  const noMaterialWorks = [
    "вынос", "мусор", "демонтаж", "снятие", "удаление", "разборка",
    "уборка", "очистка", "подметание", "мытьё", "мытье",
    "защита", "укрытие", "заклейка",
    "перенос", "переноска", "погрузка", "разгрузка",
    "штробление", "долбление",
  ];

  if (noMaterialWorks.some(w => workLower.includes(w))) {
    return 0;
  }

  // Работы с МИНИМАЛЬНЫМИ материалами (расходники)
  const minimalMaterialWorks = [
    "грунтовка", "грунтование", // грунт дешёвый
    "шпаклевка черновая", "штукатурка",
  ];

  if (minimalMaterialWorks.some(w => workLower.includes(w))) {
    return 0.15;
  }

  // Работы с ВЫСОКИМИ затратами на материалы
  const highMaterialWorks = [
    "плитка", "кафель", // плитка дорогая
    "ламинат", "паркет", // покрытие дорогое
    "обои", // обои дорогие
    "натяжной потолок", // полотно дорогое
    "сантехприбор", "унитаз", "раковина", "ванна", "смеситель", // приборы дорогие
  ];

  if (highMaterialWorks.some(w => workLower.includes(w))) {
    return 0.7;
  }

  // По категориям (fallback)
  const ratios: Record<string, number> = {
    "Демонтаж": 0,
    "Подготовительные работы": 0.1,
    "Стены": 0.4,
    "Потолок": 0.35,
    "Пол": 0.5,
    "Электрика": 0.6,
    "Сантехника": 0.5,
    "Двери": 0.1,
    "Окна": 0.2,
    "Черновые работы": 0.3,
    "Уборка": 0,
  };

  return ratios[category] ?? 0.3;
}
