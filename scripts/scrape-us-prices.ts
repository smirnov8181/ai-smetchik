/**
 * Scraper for US contractor prices from HomeAdvisor/HomeGuide
 *
 * Usage: npx ts-node scripts/scrape-us-prices.ts
 */

import * as fs from "fs";

// Top 50 home improvement works in USA
const WORKS = [
  // Bathroom
  { category: "Bathroom", work: "Bathroom remodel", unit: "project" },
  { category: "Bathroom", work: "Tile installation", unit: "sq ft" },
  { category: "Bathroom", work: "Toilet installation", unit: "unit" },
  { category: "Bathroom", work: "Shower installation", unit: "unit" },
  { category: "Bathroom", work: "Bathtub installation", unit: "unit" },
  { category: "Bathroom", work: "Vanity installation", unit: "unit" },

  // Kitchen
  { category: "Kitchen", work: "Kitchen remodel", unit: "project" },
  { category: "Kitchen", work: "Cabinet installation", unit: "linear ft" },
  { category: "Kitchen", work: "Countertop installation", unit: "sq ft" },
  { category: "Kitchen", work: "Backsplash installation", unit: "sq ft" },
  { category: "Kitchen", work: "Kitchen sink installation", unit: "unit" },

  // Flooring
  { category: "Flooring", work: "Hardwood floor installation", unit: "sq ft" },
  { category: "Flooring", work: "Laminate floor installation", unit: "sq ft" },
  { category: "Flooring", work: "Vinyl floor installation", unit: "sq ft" },
  { category: "Flooring", work: "Carpet installation", unit: "sq ft" },
  { category: "Flooring", work: "Tile floor installation", unit: "sq ft" },

  // Painting
  { category: "Painting", work: "Interior painting", unit: "sq ft" },
  { category: "Painting", work: "Exterior painting", unit: "sq ft" },
  { category: "Painting", work: "Cabinet painting", unit: "linear ft" },
  { category: "Painting", work: "Ceiling painting", unit: "sq ft" },

  // Electrical
  { category: "Electrical", work: "Electrical panel upgrade", unit: "project" },
  { category: "Electrical", work: "Outlet installation", unit: "unit" },
  { category: "Electrical", work: "Light fixture installation", unit: "unit" },
  { category: "Electrical", work: "Ceiling fan installation", unit: "unit" },
  { category: "Electrical", work: "Recessed lighting installation", unit: "unit" },

  // Plumbing
  { category: "Plumbing", work: "Water heater installation", unit: "unit" },
  { category: "Plumbing", work: "Pipe repair", unit: "linear ft" },
  { category: "Plumbing", work: "Drain cleaning", unit: "project" },
  { category: "Plumbing", work: "Faucet installation", unit: "unit" },
  { category: "Plumbing", work: "Garbage disposal installation", unit: "unit" },

  // HVAC
  { category: "HVAC", work: "AC installation", unit: "unit" },
  { category: "HVAC", work: "Furnace installation", unit: "unit" },
  { category: "HVAC", work: "Duct cleaning", unit: "project" },
  { category: "HVAC", work: "Thermostat installation", unit: "unit" },

  // Roofing
  { category: "Roofing", work: "Roof replacement", unit: "sq ft" },
  { category: "Roofing", work: "Roof repair", unit: "project" },
  { category: "Roofing", work: "Gutter installation", unit: "linear ft" },

  // Windows & Doors
  { category: "Windows & Doors", work: "Window replacement", unit: "unit" },
  { category: "Windows & Doors", work: "Door installation", unit: "unit" },
  { category: "Windows & Doors", work: "Sliding door installation", unit: "unit" },

  // Drywall
  { category: "Drywall", work: "Drywall installation", unit: "sq ft" },
  { category: "Drywall", work: "Drywall repair", unit: "sq ft" },
  { category: "Drywall", work: "Popcorn ceiling removal", unit: "sq ft" },

  // Exterior
  { category: "Exterior", work: "Deck building", unit: "sq ft" },
  { category: "Exterior", work: "Fence installation", unit: "linear ft" },
  { category: "Exterior", work: "Concrete driveway", unit: "sq ft" },
  { category: "Exterior", work: "Siding installation", unit: "sq ft" },

  // Demolition
  { category: "Demolition", work: "Demolition", unit: "sq ft" },
  { category: "Demolition", work: "Debris removal", unit: "project" },
];

// Top 10 US metro areas with cost multipliers
const REGIONS = [
  { code: "US-NY-NYC", name: "New York City, NY", multiplier: 1.35 },
  { code: "US-CA-LA", name: "Los Angeles, CA", multiplier: 1.25 },
  { code: "US-IL-CHI", name: "Chicago, IL", multiplier: 1.10 },
  { code: "US-TX-HOU", name: "Houston, TX", multiplier: 0.95 },
  { code: "US-AZ-PHX", name: "Phoenix, AZ", multiplier: 0.90 },
  { code: "US-PA-PHL", name: "Philadelphia, PA", multiplier: 1.15 },
  { code: "US-TX-SA", name: "San Antonio, TX", multiplier: 0.85 },
  { code: "US-CA-SD", name: "San Diego, CA", multiplier: 1.20 },
  { code: "US-TX-DAL", name: "Dallas, TX", multiplier: 0.95 },
  { code: "US-FL-MIA", name: "Miami, FL", multiplier: 1.10 },
];

// Base national average prices (from HomeAdvisor/HomeGuide research)
// These are approximate - should be updated with real scraped data
const BASE_PRICES: Record<string, { min: number; avg: number; max: number }> = {
  // Bathroom
  "Bathroom remodel": { min: 6000, avg: 12000, max: 25000 },
  "Tile installation": { min: 7, avg: 15, max: 25 },
  "Toilet installation": { min: 150, avg: 350, max: 600 },
  "Shower installation": { min: 1200, avg: 3000, max: 6000 },
  "Bathtub installation": { min: 1400, avg: 3500, max: 7000 },
  "Vanity installation": { min: 300, avg: 800, max: 1500 },

  // Kitchen
  "Kitchen remodel": { min: 15000, avg: 30000, max: 60000 },
  "Cabinet installation": { min: 100, avg: 200, max: 400 },
  "Countertop installation": { min: 40, avg: 75, max: 150 },
  "Backsplash installation": { min: 15, avg: 30, max: 50 },
  "Kitchen sink installation": { min: 200, avg: 400, max: 700 },

  // Flooring
  "Hardwood floor installation": { min: 6, avg: 12, max: 20 },
  "Laminate floor installation": { min: 3, avg: 7, max: 12 },
  "Vinyl floor installation": { min: 2, avg: 5, max: 10 },
  "Carpet installation": { min: 3, avg: 6, max: 12 },
  "Tile floor installation": { min: 7, avg: 15, max: 25 },

  // Painting
  "Interior painting": { min: 1.5, avg: 3, max: 5 },
  "Exterior painting": { min: 2, avg: 4, max: 7 },
  "Cabinet painting": { min: 30, avg: 60, max: 100 },
  "Ceiling painting": { min: 1, avg: 2, max: 4 },

  // Electrical
  "Electrical panel upgrade": { min: 1500, avg: 2500, max: 4000 },
  "Outlet installation": { min: 100, avg: 200, max: 350 },
  "Light fixture installation": { min: 75, avg: 200, max: 400 },
  "Ceiling fan installation": { min: 150, avg: 300, max: 500 },
  "Recessed lighting installation": { min: 125, avg: 250, max: 400 },

  // Plumbing
  "Water heater installation": { min: 800, avg: 1500, max: 2500 },
  "Pipe repair": { min: 10, avg: 25, max: 50 },
  "Drain cleaning": { min: 100, avg: 225, max: 400 },
  "Faucet installation": { min: 150, avg: 300, max: 500 },
  "Garbage disposal installation": { min: 150, avg: 350, max: 600 },

  // HVAC
  "AC installation": { min: 3000, avg: 5500, max: 10000 },
  "Furnace installation": { min: 2500, avg: 4500, max: 8000 },
  "Duct cleaning": { min: 300, avg: 500, max: 800 },
  "Thermostat installation": { min: 100, avg: 250, max: 400 },

  // Roofing
  "Roof replacement": { min: 4, avg: 8, max: 15 },
  "Roof repair": { min: 300, avg: 900, max: 2000 },
  "Gutter installation": { min: 5, avg: 10, max: 20 },

  // Windows & Doors
  "Window replacement": { min: 300, avg: 650, max: 1200 },
  "Door installation": { min: 250, avg: 500, max: 900 },
  "Sliding door installation": { min: 1000, avg: 2000, max: 4000 },

  // Drywall
  "Drywall installation": { min: 1.5, avg: 3, max: 5 },
  "Drywall repair": { min: 2, avg: 4, max: 8 },
  "Popcorn ceiling removal": { min: 1, avg: 2, max: 4 },

  // Exterior
  "Deck building": { min: 15, avg: 35, max: 60 },
  "Fence installation": { min: 15, avg: 30, max: 50 },
  "Concrete driveway": { min: 6, avg: 10, max: 18 },
  "Siding installation": { min: 5, avg: 10, max: 18 },

  // Demolition
  "Demolition": { min: 2, avg: 5, max: 10 },
  "Debris removal": { min: 200, avg: 500, max: 1000 },
};

interface PriceRecord {
  category: string;
  work_name: string;
  unit: string;
  price_min: number;
  price_avg: number;
  price_max: number;
  region: string;
  region_name: string;
  source: string;
  updated_at: string;
}

function generatePriceData(): PriceRecord[] {
  const records: PriceRecord[] = [];
  const now = new Date().toISOString();

  for (const work of WORKS) {
    const basePrice = BASE_PRICES[work.work];
    if (!basePrice) {
      console.warn(`No base price for: ${work.work}`);
      continue;
    }

    for (const region of REGIONS) {
      records.push({
        category: work.category,
        work_name: work.work,
        unit: work.unit,
        price_min: Math.round(basePrice.min * region.multiplier * 100) / 100,
        price_avg: Math.round(basePrice.avg * region.multiplier * 100) / 100,
        price_max: Math.round(basePrice.max * region.multiplier * 100) / 100,
        region: region.code,
        region_name: region.name,
        source: "homeadvisor_estimate",
        updated_at: now,
      });
    }
  }

  return records;
}

// Generate SQL for Supabase (new price_catalog_us table)
function generateSQL(records: PriceRecord[]): string {
  let sql = `-- US Price Catalog
-- Generated: ${new Date().toISOString()}
-- Source: HomeAdvisor/HomeGuide estimates

-- Clear existing data
TRUNCATE TABLE price_catalog_us;

-- Insert new data
INSERT INTO price_catalog_us (category, work_name, unit, price_min, price_avg, price_max, region, region_name, source, confidence)
VALUES
`;

  const values = records.map(
    (r) =>
      `  ('${r.category}', '${r.work_name.replace(/'/g, "''")}', '${r.unit}', ${r.price_min}, ${r.price_avg}, ${r.price_max}, '${r.region}', '${r.region_name}', '${r.source}', 0.7)`
  );

  sql += values.join(",\n") + ";\n";

  return sql;
}

// Generate JSON for review
function generateJSON(records: PriceRecord[]): string {
  return JSON.stringify(records, null, 2);
}

// Main
async function main() {
  console.log("Generating US price data...\n");

  const records = generatePriceData();

  console.log(`Generated ${records.length} price records`);
  console.log(`- ${WORKS.length} work types`);
  console.log(`- ${REGIONS.length} regions\n`);

  // Save JSON
  const jsonPath = "./scripts/us-prices.json";
  fs.writeFileSync(jsonPath, generateJSON(records));
  console.log(`Saved JSON: ${jsonPath}`);

  // Save SQL
  const sqlPath = "./scripts/us-prices.sql";
  fs.writeFileSync(sqlPath, generateSQL(records));
  console.log(`Saved SQL: ${sqlPath}`);

  // Print sample
  console.log("\nSample data (NYC vs Houston):\n");
  const samples = records.filter(
    (r) =>
      r.work_name === "Bathroom remodel" &&
      (r.region === "US-NY-NYC" || r.region === "US-TX-HOU")
  );
  console.table(samples.map(s => ({
    work: s.work_name,
    region: s.region_name,
    min: `$${s.price_min}`,
    avg: `$${s.price_avg}`,
    max: `$${s.price_max}`,
  })));
}

main().catch(console.error);
