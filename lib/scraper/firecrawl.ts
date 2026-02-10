import { createServiceClient } from "@/lib/supabase/server";
import crypto from "crypto";

const FIRECRAWL_API = "https://api.firecrawl.dev/v1";

interface ScrapeResult {
  success: boolean;
  data?: {
    markdown: string;
    metadata?: {
      title?: string;
      sourceURL?: string;
    };
  };
  error?: string;
  fromCache?: boolean;
}

// ============================================
// Core scrape function with retry
// ============================================

async function scrapePageRaw(url: string, retries = 3): Promise<ScrapeResult> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${FIRECRAWL_API}/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        },
        body: JSON.stringify({
          url,
          formats: ["markdown"],
        }),
      });

      if (response.status === 429) {
        // Rate limited — wait and retry
        const waitMs = Math.pow(2, attempt) * 2000;
        console.warn(`Rate limited on ${url}, waiting ${waitMs}ms (attempt ${attempt}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }

      if (!response.ok) {
        if (attempt < retries) {
          const waitMs = Math.pow(2, attempt) * 1000;
          console.warn(`HTTP ${response.status} for ${url}, retrying in ${waitMs}ms (attempt ${attempt}/${retries})`);
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          continue;
        }
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return response.json();
    } catch (error) {
      if (attempt < retries) {
        const waitMs = Math.pow(2, attempt) * 1000;
        console.warn(`Network error for ${url}, retrying in ${waitMs}ms (attempt ${attempt}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  return { success: false, error: "Max retries exceeded" };
}

// ============================================
// URL health check (fast, no Firecrawl credits)
// ============================================

export async function checkUrlHealth(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(10000),
      redirect: "follow",
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ============================================
// Cache-aware scrape function
// ============================================

function md5(input: string): string {
  return crypto.createHash("md5").update(input).digest("hex");
}

export async function scrapePage(url: string): Promise<ScrapeResult> {
  const supabase = createServiceClient();
  const urlHash = md5(url);

  // 1. Check cache first
  const { data: cached } = await supabase
    .from("scrape_cache")
    .select("*")
    .eq("url_hash", urlHash)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (cached && cached.raw_markdown) {
    console.log(`Cache hit for ${url} (expires: ${cached.expires_at})`);
    return {
      success: true,
      data: {
        markdown: cached.raw_markdown,
        metadata: { sourceURL: url },
      },
      fromCache: true,
    };
  }

  // 2. Scrape with retry
  const result = await scrapePageRaw(url);

  // 3. Save to cache if successful
  if (result.success && result.data?.markdown) {
    const markdownHash = md5(result.data.markdown);

    // Check if content changed
    if (cached && cached.markdown_hash === markdownHash) {
      // Content didn't change — just extend cache expiry
      await supabase
        .from("scrape_cache")
        .update({
          expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          scraped_at: new Date().toISOString(),
        })
        .eq("url_hash", urlHash);
    } else {
      // New or changed content — save full cache
      await supabase
        .from("scrape_cache")
        .upsert(
          {
            url,
            url_hash: urlHash,
            raw_markdown: result.data.markdown,
            markdown_hash: markdownHash,
            prices_count: 0, // Will be updated after extraction
            scraped_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          },
          { onConflict: "url_hash" }
        );
    }
  }

  return result;
}

// ============================================
// Batch scrape with concurrency control
// ============================================

export async function scrapeMultiplePages(
  urls: string[],
  concurrency = 2,
  delayMs = 1500
): Promise<Map<string, ScrapeResult>> {
  const results = new Map<string, ScrapeResult>();

  // Process in batches to respect rate limits
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);

    const batchResults = await Promise.allSettled(
      batch.map(async (url) => {
        const result = await scrapePage(url);
        return { url, result };
      })
    );

    for (const settled of batchResults) {
      if (settled.status === "fulfilled") {
        results.set(settled.value.url, settled.value.result);
      } else {
        const url = batch[batchResults.indexOf(settled)];
        results.set(url, { success: false, error: settled.reason?.message });
      }
    }

    // Delay between batches (skip if all were cache hits)
    const allCached = batchResults.every(
      (r) => r.status === "fulfilled" && r.value.result.fromCache
    );
    if (i + concurrency < urls.length && !allCached) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

// ============================================
// Clean expired cache entries
// ============================================

export async function cleanExpiredCache(): Promise<number> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("scrape_cache")
    .delete()
    .lt("expires_at", new Date().toISOString())
    .select("id");

  if (error) {
    console.error("Failed to clean cache:", error);
    return 0;
  }

  return data?.length ?? 0;
}
