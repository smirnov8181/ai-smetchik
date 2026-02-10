import { scrapePage, checkUrlHealth, cleanExpiredCache } from "./firecrawl";
import { extractPricesFromMarkdown, ExtractedPrice } from "./price-extractor";
import { aggregatePrices, AggregatedPrice } from "./aggregator";
import { PRICE_SOURCES, PriceSource } from "./sources";
import { createServiceClient } from "@/lib/supabase/server";

export interface UpdateResult {
  sources_scraped: number;
  sources_failed: number;
  sources_cached: number;
  raw_prices_found: number;
  aggregated_items: number;
  updated_at: string;
  errors: string[];
  cache_cleaned: number;
}

export async function updatePricesFromSources(): Promise<UpdateResult> {
  const allPrices: ExtractedPrice[] = [];
  const errors: string[] = [];
  let sourcesFailed = 0;
  let sourcesCached = 0;

  const activeSources = PRICE_SOURCES.filter((s) => s.verified);
  console.log(`Starting price update from ${activeSources.length} verified sources...`);

  // Clean expired cache entries first
  const cacheCleaned = await cleanExpiredCache();
  if (cacheCleaned > 0) {
    console.log(`Cleaned ${cacheCleaned} expired cache entries.`);
  }

  // Scrape each source sequentially to respect rate limits
  for (const source of activeSources) {
    const urlsToScrape = [source.url, ...(source.additionalUrls || [])];

    for (const url of urlsToScrape) {
      console.log(`Scraping: ${source.name} (${url})`);

      try {
        // Quick health check first (no Firecrawl credits)
        const isHealthy = await checkUrlHealth(url);
        if (!isHealthy) {
          console.warn(`URL not accessible: ${url}`);
          errors.push(`${source.name}: URL not accessible (${url})`);
          await updateSourceStats(source, false, 0, "URL not accessible");
          sourcesFailed++;
          continue;
        }

        const result = await scrapePage(url);

        if (result.fromCache) {
          sourcesCached++;
        }

        if (!result.success || !result.data?.markdown) {
          console.warn(`Failed to scrape ${source.name}: ${result.error}`);
          errors.push(`${source.name}: ${result.error || "no data"}`);
          await updateSourceStats(source, false, 0, result.error || "no data");
          sourcesFailed++;
          continue;
        }

        const prices = await extractPricesFromMarkdown(
          result.data.markdown,
          source.name,
          url
        );

        console.log(`  Found ${prices.length} prices from ${source.name}`);
        allPrices.push(...prices);

        // Update source stats
        await updateSourceStats(source, true, prices.length);

        // Rate limit delay (skip for cached results)
        if (!result.fromCache) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        console.error(`Error scraping ${source.name}:`, msg);
        errors.push(`${source.name}: ${msg}`);
        await updateSourceStats(source, false, 0, msg);
        sourcesFailed++;
      }
    }
  }

  console.log(
    `Scraping complete. ${allPrices.length} raw prices from ${activeSources.length - sourcesFailed} sources (${sourcesCached} cached).`
  );

  // Aggregate for each region
  const regions = ["moscow"] as const;
  let totalAggregated = 0;

  for (const region of regions) {
    const regionPrices = allPrices; // For now, all sources are Moscow
    const aggregated = aggregatePrices(regionPrices, region);
    console.log(`Aggregated into ${aggregated.length} price items for region ${region}.`);

    if (aggregated.length > 0) {
      await savePricesToDatabase(aggregated);
      totalAggregated += aggregated.length;
    }
  }

  return {
    sources_scraped: activeSources.length - sourcesFailed,
    sources_failed: sourcesFailed,
    sources_cached: sourcesCached,
    raw_prices_found: allPrices.length,
    aggregated_items: totalAggregated,
    updated_at: new Date().toISOString(),
    errors,
    cache_cleaned: cacheCleaned,
  };
}

// ============================================
// Save prices with upsert and confidence scoring
// ============================================

async function savePricesToDatabase(prices: AggregatedPrice[]): Promise<void> {
  const supabase = createServiceClient();

  for (const price of prices) {
    // Determine confidence based on sample count
    const confidence =
      price.sample_count >= 5 ? "high" :
      price.sample_count >= 3 ? "medium" : "low";

    // Upsert using the unique index (work_name, unit, region)
    const { error } = await supabase
      .from("price_catalog")
      .upsert(
        {
          category: price.category,
          work_name: price.work_name,
          unit: price.unit,
          price_min: price.price_min,
          price_avg: price.price_avg,
          price_max: price.price_max,
          region: price.region,
          sample_count: price.sample_count,
          confidence,
          last_sources: price.sources,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "work_name,unit,region",
        }
      );

    if (error) {
      console.error(`Failed to upsert price for "${price.work_name}":`, error.message);
    }
  }

  console.log(`Saved ${prices.length} prices to database.`);
}

// ============================================
// Update source monitoring stats
// ============================================

async function updateSourceStats(
  source: PriceSource,
  success: boolean,
  pricesCount: number,
  error?: string
): Promise<void> {
  try {
    const supabase = createServiceClient();
    await supabase.rpc("update_source_stats", {
      p_url: source.url,
      p_success: success,
      p_prices_count: pricesCount,
      p_error: error || null,
    });
  } catch (err) {
    // Non-critical — log and continue
    console.warn("Failed to update source stats:", err);
  }
}
