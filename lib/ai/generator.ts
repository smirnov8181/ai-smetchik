import {
  PricedWorkItem,
  EstimateResult,
  EstimateSection,
  NormalizedInput,
} from "@/lib/supabase/types";
import { SUMMARY_SYSTEM_PROMPT } from "./prompts";
import { ai, MODELS } from "./client";

export async function generateEstimate(
  pricedItems: PricedWorkItem[],
  normalizedInput: NormalizedInput
): Promise<EstimateResult> {
  // Group by category
  const grouped = new Map<string, PricedWorkItem[]>();
  for (const item of pricedItems) {
    const existing = grouped.get(item.category) || [];
    existing.push(item);
    grouped.set(item.category, existing);
  }

  const sections: EstimateSection[] = Array.from(grouped.entries()).map(
    ([category, items]) => ({
      category,
      items,
      subtotal: items.reduce((sum, item) => sum + item.total, 0),
    })
  );

  const subtotalLabor = pricedItems.reduce(
    (sum, item) => sum + item.labor_cost,
    0
  );
  const subtotalMaterials = pricedItems.reduce(
    (sum, item) => sum + item.material_cost,
    0
  );
  const overhead = Math.round((subtotalLabor + subtotalMaterials) * 0.1);
  const total = subtotalLabor + subtotalMaterials + overhead;

  // Determine confidence based on input completeness
  const hasAllAreas = normalizedInput.rooms.every((r) => r.area_sqm > 0);
  const hasDetailedWorks = normalizedInput.rooms.every(
    (r) => r.works.length >= 2
  );
  const confidence: "low" | "medium" | "high" = hasAllAreas && hasDetailedWorks
    ? "high"
    : hasAllAreas || hasDetailedWorks
      ? "medium"
      : "low";

  // Generate AI summary
  const summaryData = {
    project_type: normalizedInput.project_type,
    total_area: normalizedInput.total_area_sqm,
    sections: sections.map((s) => ({
      category: s.category,
      subtotal: s.subtotal,
    })),
    total,
    confidence,
  };

  let summary: string;
  let caveats: string[] = [];

  try {
    const response = await ai.chat.completions.create({
      model: MODELS.fast,
      messages: [
        { role: "system", content: SUMMARY_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Данные сметы:\n${JSON.stringify(summaryData, null, 2)}\n\nОсобые примечания: ${normalizedInput.special_notes}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 500,
    });

    summary =
      response.choices[0]?.message?.content ||
      `Смета на ${normalizedInput.project_type} квартиры ${normalizedInput.total_area_sqm} м². Итого: ${total.toLocaleString("ru-RU")} руб.`;
  } catch {
    summary = `Смета на ${normalizedInput.project_type} квартиры ${normalizedInput.total_area_sqm} м². Итого: ${total.toLocaleString("ru-RU")} руб.`;
  }

  // Auto-detect caveats
  const categorySet = new Set(pricedItems.map((i) => i.category));
  if (!categorySet.has("Электрика")) {
    caveats.push("Электромонтажные работы не включены в смету");
  }
  if (!categorySet.has("Сантехника")) {
    caveats.push("Сантехнические работы не включены в смету");
  }
  if (confidence !== "high") {
    caveats.push(
      "Точность сметы ограничена — рекомендуется выезд замерщика"
    );
  }

  return {
    sections,
    subtotal_labor: subtotalLabor,
    subtotal_materials: subtotalMaterials,
    overhead,
    total,
    summary,
    confidence,
    caveats,
  };
}
