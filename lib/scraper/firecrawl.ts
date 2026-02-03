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
}

export async function scrapePage(url: string): Promise<ScrapeResult> {
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

  if (!response.ok) {
    return {
      success: false,
      error: `HTTP ${response.status}: ${response.statusText}`,
    };
  }

  return response.json();
}

export async function scrapeMultiplePages(
  urls: string[],
  concurrency = 3,
  delayMs = 1000
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

    // Delay between batches
    if (i + concurrency < urls.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
