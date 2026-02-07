/**
 * Run SQL migration against Supabase
 * Usage: npx ts-node scripts/run-migration.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  console.log("Connecting to Supabase...");
  console.log("URL:", SUPABASE_URL);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
  });

  // Test connection
  const { data: test, error: testError } = await supabase
    .from("us_regions")
    .select("count")
    .limit(1);

  if (testError && testError.code === "42P01") {
    console.log("Table us_regions doesn't exist yet - need to run migration first");
    console.log("\nPlease run the migration SQL manually in Supabase Dashboard:");
    console.log("1. Go to https://supabase.com/dashboard/project/tfhgnkjvyebdkqgxhfcc/sql");
    console.log("2. Copy & paste contents of: supabase/migrations/003_us_price_catalog.sql");
    console.log("3. Then run this script again to load data");
    return;
  }

  console.log("Tables exist, loading price data...\n");

  // Read price data
  const pricesJson = fs.readFileSync("./scripts/us-prices.json", "utf-8");
  const prices = JSON.parse(pricesJson);

  console.log(`Loading ${prices.length} price records...`);

  // Clear existing data
  const { error: deleteError } = await supabase
    .from("price_catalog_us")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

  if (deleteError) {
    console.error("Delete error:", deleteError);
  }

  // Insert in batches of 100
  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < prices.length; i += batchSize) {
    const batch = prices.slice(i, i + batchSize).map((p: any) => ({
      category: p.category,
      work_name: p.work_name,
      unit: p.unit,
      price_min: p.price_min,
      price_avg: p.price_avg,
      price_max: p.price_max,
      region: p.region,
      region_name: p.region_name,
      source: p.source,
      confidence: 0.7,
    }));

    const { error } = await supabase.from("price_catalog_us").insert(batch);

    if (error) {
      console.error(`Batch ${i} error:`, error);
    } else {
      inserted += batch.length;
      console.log(`Inserted ${inserted}/${prices.length}`);
    }
  }

  console.log(`\nDone! Inserted ${inserted} records.`);

  // Verify
  const { count } = await supabase
    .from("price_catalog_us")
    .select("*", { count: "exact", head: true });

  console.log(`Total records in price_catalog_us: ${count}`);
}

main().catch(console.error);
