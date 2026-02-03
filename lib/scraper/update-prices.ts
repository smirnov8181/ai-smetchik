import { scrapePage } from "./firecrawl";
import { extractPricesFromMarkdown, ExtractedPrice } from "./price-extractor";
import { aggregatePrices, AggregatedPrice } from "./aggregator";
import { PRICE_SOURCES } from "./sources";
import { createServiceClient } from "@/lib/supabase/server";

export interface UpdateResult {
  sources_scraped: number;
  sources_failed: number;
  raw_prices_found: number;
  aggregated_items: number;
  updated_at: string;
  errors: string[];
}

export async function updatePricesFromSources(): Promise<UpdateResult> {
  const allPrices: ExtractedPrice[] = [];
  const errors: string[] = [];
  let sourcesFailed = 0;

  console.log(`Starting price update from ${PRICE_SOURCES.length} sources...`);

  // Scrape each source sequentially to respect rate limits
  for (const source of PRICE_SOURCES) {
    console.log(`Scraping: ${source.name} (${source.url})`);

    try {
      const result = await scrapePage(source.url);

      if (!result.success || !result.data?.markdown) {
        console.warn(`Failed to scrape ${source.name}: ${result.error}`);
        errors.push(`${source.name}: ${result.error || "no data"}`);
        sourcesFailed++;
        continue;
      }

      const prices = await extractPricesFromMarkdown(
        result.data.markdown,
        source.name,
        source.url
      );

      console.log(`  Found ${prices.length} prices from ${source.name}`);
      allPrices.push(...prices);

      // Rate limit delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`Error scraping ${source.name}:`, msg);
      errors.push(`${source.name}: ${msg}`);
      sourcesFailed++;
    }
  }

  console.log(
    `Scraping complete. ${allPrices.length} raw prices from ${PRICE_SOURCES.length - sourcesFailed} sources.`
  );

  // Aggregate
  const aggregated = aggregatePrices(allPrices, "moscow");
  console.log(`Aggregated into ${aggregated.length} price items.`);

  // Save to database
  if (aggregated.length > 0) {
    await savePricesToDatabase(aggregated);
  }

  return {
    sources_scraped: PRICE_SOURCES.length - sourcesFailed,
    sources_failed: sourcesFailed,
    raw_prices_found: allPrices.length,
    aggregated_items: aggregated.length,
    updated_at: new Date().toISOString(),
    errors,
  };
}

async function savePricesToDatabase(
  prices: AggregatedPrice[]
): Promise<void> {
  const supabase = createServiceClient();

  // Upsert strategy: update existing items, insert new ones
  for (const price of prices) {
    // Check if work already exists in catalog
    const { data: existing } = await supabase
      .from("price_catalog")
      .select("id")
      .eq("work_name", price.work_name)
      .eq("unit", price.unit)
      .eq("region", price.region)
      .single();

    if (existing) {
      // Update existing
      await supabase
        .from("price_catalog")
        .update({
          category: price.category,
          price_min: price.price_min,
          price_avg: price.price_avg,
          price_max: price.price_max,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      // Insert new
      await supabase.from("price_catalog").insert({
        category: price.category,
        work_name: price.work_name,
        unit: price.unit,
        price_min: price.price_min,
        price_avg: price.price_avg,
        price_max: price.price_max,
        region: price.region,
      });
    }
  }

  console.log(`Saved ${prices.length} prices to database.`);
}
