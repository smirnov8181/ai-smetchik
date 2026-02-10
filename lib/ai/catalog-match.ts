import { PriceCatalogItem } from "@/lib/supabase/types";

// Common short words to ignore when matching (they add noise)
const STOP_WORDS = new Set([
  "в", "на", "из", "с", "по", "для", "от", "до", "и", "или",
  "м2", "м²", "шт", "мп", "п.м", "кв.м", "куб.м",
]);

/**
 * Fuzzy match a work name against a price catalog.
 * Tries exact match, then partial/substring match, then word-overlap scoring.
 * Returns null if no confident match found (better to fallback than mismatch).
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
  // Require the shorter string to be at least 5 chars to avoid false matches
  const partial = catalog.find((item) => {
    const catalogName = item.work_name.toLowerCase();
    const shorter = normalized.length < catalogName.length ? normalized : catalogName;
    if (shorter.length < 5) return false;
    return normalized.includes(catalogName) || catalogName.includes(normalized);
  });
  if (partial) return partial;

  // Word overlap match — with improved scoring
  const workWords = normalized
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  if (workWords.length === 0) return null;

  let bestMatch: PriceCatalogItem | null = null;
  let bestScore = 0;

  for (const item of catalog) {
    const catalogWords = item.work_name
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

    if (catalogWords.length === 0) continue;

    const overlap = workWords.filter((w) =>
      catalogWords.some((cw) => cw === w || (cw.length > 4 && w.length > 4 && (cw.includes(w) || w.includes(cw))))
    ).length;

    // Score based on overlap relative to BOTH strings (Jaccard-like)
    const score = overlap / Math.max(workWords.length, catalogWords.length);

    // Require at least 2 overlapping meaningful words, or 1 if strings are short
    const minOverlap = workWords.length <= 2 ? 1 : 2;

    if (overlap >= minOverlap && score > bestScore && score >= 0.5) {
      bestScore = score;
      bestMatch = item;
    }
  }

  return bestMatch;
}
