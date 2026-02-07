/**
 * Update price_catalog_us with real scraped prices
 */

import * as fs from "fs";

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = "tfhgnkjvyebdkqgxhfcc";

interface ScrapedPrice {
  category: string;
  work: string;
  price_min: number | null;
  price_max: number | null;
  unit: string | null;
  url: string;
}

// Regional multipliers
const REGIONS = [
  { code: "US-NY-NYC", multiplier: 1.35 },
  { code: "US-CA-LA", multiplier: 1.25 },
  { code: "US-IL-CHI", multiplier: 1.10 },
  { code: "US-TX-HOU", multiplier: 0.95 },
  { code: "US-AZ-PHX", multiplier: 0.90 },
  { code: "US-CA-SF", multiplier: 1.45 },
  { code: "US-FL-MIA", multiplier: 1.10 },
  { code: "US-WA-SEA", multiplier: 1.20 },
  { code: "US-MA-BOS", multiplier: 1.30 },
  { code: "US-CO-DEN", multiplier: 1.05 },
];

async function runQuery(query: string): Promise<any> {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );
  return response.json();
}

async function main() {
  console.log("Loading scraped prices...");

  const data = JSON.parse(fs.readFileSync("./scripts/scraped-prices.json", "utf-8"));
  const validPrices = data.filter((p: ScrapedPrice) => p.price_min && p.price_min > 0);

  console.log(`Found ${validPrices.length} valid prices\n`);

  for (const price of validPrices) {
    console.log(`Updating: ${price.work}...`);

    for (const region of REGIONS) {
      const min = Math.round(price.price_min * region.multiplier);
      const max = Math.round(price.price_max * region.multiplier);
      const avg = Math.round((min + max) / 2);

      const query = `
        UPDATE price_catalog_us
        SET price_min = ${min},
            price_avg = ${avg},
            price_max = ${max},
            source = 'homeadvisor',
            source_url = '${price.url}',
            confidence = 0.9,
            updated_at = NOW()
        WHERE work_name = '${price.work.replace(/'/g, "''")}'
          AND region = '${region.code}'
      `;

      await runQuery(query);
    }

    console.log(`  ✓ Updated ${REGIONS.length} regions`);
  }

  // Verify
  const result = await runQuery(`
    SELECT work_name, region, price_min, price_avg, price_max, source
    FROM price_catalog_us
    WHERE source = 'homeadvisor'
    LIMIT 5
  `);

  console.log("\nSample updated data:");
  console.table(result);

  const countResult = await runQuery(`
    SELECT source, COUNT(*) as count
    FROM price_catalog_us
    GROUP BY source
  `);

  console.log("\nPrices by source:");
  console.table(countResult);
}

main().catch(console.error);
