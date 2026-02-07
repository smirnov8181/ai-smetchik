/**
 * Scrape real prices from HomeAdvisor using Firecrawl
 *
 * Setup:
 * 1. Get API key from https://firecrawl.dev
 * 2. Add FIRECRAWL_API_KEY to .env.local
 *
 * Usage: npx ts-node scripts/scrape-firecrawl.ts
 */

import * as fs from "fs";

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const FIRECRAWL_URL = "https://api.firecrawl.dev/v1/scrape";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// HomeAdvisor cost guide URLs
const HOMEADVISOR_PAGES = [
  // Bathroom
  { category: "Bathroom", work: "Bathroom remodel", url: "https://www.homeadvisor.com/cost/bathrooms/remodel-a-bathroom/" },
  { category: "Bathroom", work: "Tile installation", url: "https://www.homeadvisor.com/cost/flooring/install-tile/" },
  { category: "Bathroom", work: "Shower installation", url: "https://www.homeadvisor.com/cost/bathrooms/install-a-shower/" },

  // Kitchen
  { category: "Kitchen", work: "Kitchen remodel", url: "https://www.homeadvisor.com/cost/kitchens/remodel-a-kitchen/" },
  { category: "Kitchen", work: "Cabinet installation", url: "https://www.homeadvisor.com/cost/kitchens/install-kitchen-cabinets/" },
  { category: "Kitchen", work: "Countertop installation", url: "https://www.homeadvisor.com/cost/countertops/install-a-countertop/" },

  // Flooring
  { category: "Flooring", work: "Hardwood floor installation", url: "https://www.homeadvisor.com/cost/flooring/install-hardwood-flooring/" },
  { category: "Flooring", work: "Laminate floor installation", url: "https://www.homeadvisor.com/cost/flooring/install-laminate-flooring/" },
  { category: "Flooring", work: "Carpet installation", url: "https://www.homeadvisor.com/cost/flooring/install-carpet/" },

  // Painting
  { category: "Painting", work: "Interior painting", url: "https://www.homeadvisor.com/cost/painting/paint-the-interior-of-a-home/" },
  { category: "Painting", work: "Exterior painting", url: "https://www.homeadvisor.com/cost/painting/paint-a-home-exterior/" },

  // Electrical
  { category: "Electrical", work: "Electrical panel upgrade", url: "https://www.homeadvisor.com/cost/electrical/upgrade-an-electrical-panel/" },
  { category: "Electrical", work: "Outlet installation", url: "https://www.homeadvisor.com/cost/electrical/install-an-electrical-outlet/" },

  // Plumbing
  { category: "Plumbing", work: "Water heater installation", url: "https://www.homeadvisor.com/cost/plumbing/install-a-water-heater/" },

  // HVAC
  { category: "HVAC", work: "AC installation", url: "https://www.homeadvisor.com/cost/heating-and-cooling/install-an-air-conditioning-unit/" },
  { category: "HVAC", work: "Furnace installation", url: "https://www.homeadvisor.com/cost/heating-and-cooling/install-a-furnace/" },

  // Roofing
  { category: "Roofing", work: "Roof replacement", url: "https://www.homeadvisor.com/cost/roofing/install-a-roof/" },
  { category: "Roofing", work: "Gutter installation", url: "https://www.homeadvisor.com/cost/roofing/install-gutters/" },

  // Windows & Doors
  { category: "Windows & Doors", work: "Window replacement", url: "https://www.homeadvisor.com/cost/doors-and-windows/install-windows/" },
  { category: "Windows & Doors", work: "Door installation", url: "https://www.homeadvisor.com/cost/doors-and-windows/install-a-door/" },
];

interface ScrapedPrice {
  category: string;
  work: string;
  url: string;
  price_min: number | null;
  price_avg: number | null;
  price_max: number | null;
  unit: string | null;
  raw_text: string;
  scraped_at: string;
}

async function scrapeWithFirecrawl(url: string): Promise<string> {
  if (!FIRECRAWL_API_KEY) {
    throw new Error("FIRECRAWL_API_KEY not set");
  }

  const response = await fetch(FIRECRAWL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
    },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
      onlyMainContent: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Firecrawl error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.data?.markdown || "";
}

// Extract prices from markdown using regex patterns
function extractPrices(markdown: string): { min: number | null; avg: number | null; max: number | null; unit: string | null } {
  // Common patterns:
  // "$5,000 - $15,000" or "$5,000 to $15,000"
  // "Average cost: $10,000"
  // "$7 to $15 per square foot"

  const result = { min: null as number | null, avg: null as number | null, max: null as number | null, unit: null as string | null };

  // Pattern: $X,XXX - $X,XXX or $X,XXX to $X,XXX
  const rangePattern = /\$([0-9,]+)\s*(?:-|to)\s*\$([0-9,]+)/gi;
  const matches = [...markdown.matchAll(rangePattern)];

  if (matches.length > 0) {
    // Take first match (usually the main price range)
    const min = parseInt(matches[0][1].replace(/,/g, ""));
    const max = parseInt(matches[0][2].replace(/,/g, ""));
    result.min = min;
    result.max = max;
    result.avg = Math.round((min + max) / 2);
  }

  // Check for per unit pricing
  if (markdown.toLowerCase().includes("per square foot") || markdown.toLowerCase().includes("per sq ft")) {
    result.unit = "sq ft";
  } else if (markdown.toLowerCase().includes("per linear foot")) {
    result.unit = "linear ft";
  } else if (markdown.toLowerCase().includes("per project") || result.min && result.min > 500) {
    result.unit = "project";
  }

  return result;
}

async function scrapeAllPrices(): Promise<ScrapedPrice[]> {
  const results: ScrapedPrice[] = [];

  for (const page of HOMEADVISOR_PAGES) {
    console.log(`Scraping: ${page.work}...`);

    try {
      const markdown = await scrapeWithFirecrawl(page.url);

      // Try regex first
      let prices = extractPrices(markdown);

      // If regex failed, use AI
      if (!prices.min || !prices.max) {
        console.log(`  Regex failed, trying AI...`);
        const aiPrices = await extractWithAI(markdown, page.work);
        if (aiPrices) {
          prices = aiPrices;
        }
      }

      results.push({
        category: page.category,
        work: page.work,
        url: page.url,
        price_min: prices.min,
        price_avg: prices.avg,
        price_max: prices.max,
        unit: prices.unit,
        raw_text: markdown.slice(0, 1000),
        scraped_at: new Date().toISOString(),
      });

      console.log(`  ✓ ${page.work}: $${prices.min} - $${prices.max} ${prices.unit || ""}`);

      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 1500));

    } catch (error) {
      console.error(`  ✗ Failed: ${error}`);
      results.push({
        category: page.category,
        work: page.work,
        url: page.url,
        price_min: null,
        price_avg: null,
        price_max: null,
        unit: null,
        raw_text: `ERROR: ${error}`,
        scraped_at: new Date().toISOString(),
      });
    }
  }

  return results;
}

// Use AI to extract structured data (better accuracy)
async function extractWithAI(markdown: string, workName: string): Promise<{ min: number; avg: number; max: number; unit: string } | null> {
  if (!OPENROUTER_API_KEY) {
    console.log("  No OPENROUTER_API_KEY, using regex only");
    return null;
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Extract price information from home improvement cost guides. Return only valid JSON."
          },
          {
            role: "user",
            content: `Extract the typical price range for "${workName}" from this text.

Return JSON format: {"min": number, "max": number, "unit": "sq ft" | "linear ft" | "project" | "unit"}

- min/max should be the main price range mentioned (national average)
- unit should be the pricing unit (per sq ft, per project, etc.)
- If prices are per square foot, use those numbers directly
- If it's a total project cost, use "project" as unit

Text:
${markdown.slice(0, 3000)}`
          }
        ],
        temperature: 0.1,
        max_tokens: 200,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        min: parsed.min || 0,
        max: parsed.max || 0,
        avg: Math.round((parsed.min + parsed.max) / 2),
        unit: parsed.unit || "project",
      };
    }
  } catch (error) {
    console.log(`  AI extraction failed: ${error}`);
  }

  return null;
}

async function main() {
  console.log("=== Firecrawl Price Scraper ===\n");

  if (!FIRECRAWL_API_KEY) {
    console.log("FIRECRAWL_API_KEY not set.");
    console.log("Get your key at: https://firecrawl.dev\n");
    console.log("Running in demo mode (showing URLs only)...\n");

    console.log("URLs to scrape:");
    HOMEADVISOR_PAGES.forEach(p => console.log(`  ${p.work}: ${p.url}`));

    console.log(`\nTotal: ${HOMEADVISOR_PAGES.length} pages`);
    console.log("Add FIRECRAWL_API_KEY to .env.local to run actual scraping.");
    return;
  }

  const results = await scrapeAllPrices();

  // Save results
  const outputPath = "./scripts/scraped-prices.json";
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nSaved to ${outputPath}`);

  // Summary
  const successful = results.filter(r => r.price_min !== null);
  console.log(`\nSuccess: ${successful.length}/${results.length} pages`);
}

main().catch(console.error);
