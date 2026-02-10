import { PriceCatalogItem } from "@/lib/supabase/types";

/**
 * Fuzzy match a work name against a price catalog.
 * Tries exact match, then partial/substring match, then word-overlap scoring.
 */
export function findCatalogMatch(
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
