-- ============================================
-- Migration 005: Price Data Architecture for RU version
-- Adds: price_history, scrape_cache, price_sources tables
-- Updates: price_catalog with confidence & sample_count
-- ============================================

-- ============================================
-- 1. Extend price_catalog with metadata fields
-- ============================================

ALTER TABLE public.price_catalog
  ADD COLUMN IF NOT EXISTS subcategory text,
  ADD COLUMN IF NOT EXISTS sample_count integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS confidence text NOT NULL DEFAULT 'low'
    CHECK (confidence IN ('low', 'medium', 'high')),
  ADD COLUMN IF NOT EXISTS last_sources jsonb DEFAULT '[]'::jsonb;

-- Create unique index for upsert operations
CREATE UNIQUE INDEX IF NOT EXISTS idx_price_catalog_work_unit_region
  ON public.price_catalog (work_name, unit, region);

-- Index for fast lookup by category + region
CREATE INDEX IF NOT EXISTS idx_price_catalog_category_region
  ON public.price_catalog (category, region);

-- ============================================
-- 2. Price History — track price changes over time
-- ============================================

CREATE TABLE IF NOT EXISTS public.price_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  catalog_id uuid NOT NULL REFERENCES public.price_catalog(id) ON DELETE CASCADE,
  price_min numeric(10,2) NOT NULL,
  price_avg numeric(10,2) NOT NULL,
  price_max numeric(10,2) NOT NULL,
  sample_count integer NOT NULL DEFAULT 1,
  sources jsonb DEFAULT '[]'::jsonb,
  scraped_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_history_catalog_id
  ON public.price_history (catalog_id);

CREATE INDEX IF NOT EXISTS idx_price_history_scraped_at
  ON public.price_history (scraped_at DESC);

-- RLS: read-only for authenticated users
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read price history"
  ON public.price_history FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- 3. Scrape Cache — avoid re-scraping unchanged pages
-- ============================================

CREATE TABLE IF NOT EXISTS public.scrape_cache (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  url text NOT NULL,
  url_hash text NOT NULL, -- MD5 of URL for fast lookup
  raw_markdown text,
  markdown_hash text, -- MD5 of markdown for change detection
  extracted_prices jsonb DEFAULT '[]'::jsonb,
  prices_count integer NOT NULL DEFAULT 0,
  scraped_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_scrape_cache_url_hash
  ON public.scrape_cache (url_hash);

CREATE INDEX IF NOT EXISTS idx_scrape_cache_expires_at
  ON public.scrape_cache (expires_at);

-- No RLS needed — only accessed by service role
ALTER TABLE public.scrape_cache ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. Price Sources — monitor source health
-- ============================================

CREATE TABLE IF NOT EXISTS public.price_sources (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  url text NOT NULL UNIQUE,
  category text NOT NULL DEFAULT 'contractor'
    CHECK (category IN ('contractor', 'marketplace', 'aggregator', 'materials')),
  region text NOT NULL DEFAULT 'moscow',
  is_active boolean NOT NULL DEFAULT true,
  is_verified boolean NOT NULL DEFAULT false,
  last_scraped_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  total_scrapes integer NOT NULL DEFAULT 0,
  successful_scrapes integer NOT NULL DEFAULT 0,
  avg_prices_extracted numeric(5,1) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_sources_active
  ON public.price_sources (is_active, region);

-- RLS: read-only for authenticated users
ALTER TABLE public.price_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read price sources"
  ON public.price_sources FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- 5. Function: Update source stats after scrape
-- ============================================

CREATE OR REPLACE FUNCTION public.update_source_stats(
  p_url text,
  p_success boolean,
  p_prices_count integer DEFAULT 0,
  p_error text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE public.price_sources
  SET
    last_scraped_at = now(),
    last_success_at = CASE WHEN p_success THEN now() ELSE last_success_at END,
    last_error = CASE WHEN p_success THEN NULL ELSE p_error END,
    total_scrapes = total_scrapes + 1,
    successful_scrapes = successful_scrapes + CASE WHEN p_success THEN 1 ELSE 0 END,
    avg_prices_extracted = CASE
      WHEN p_success AND successful_scrapes > 0
      THEN (avg_prices_extracted * successful_scrapes + p_prices_count) / (successful_scrapes + 1)
      WHEN p_success
      THEN p_prices_count
      ELSE avg_prices_extracted
    END,
    updated_at = now()
  WHERE url = p_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. Function: Save price snapshot to history
-- ============================================

CREATE OR REPLACE FUNCTION public.save_price_history()
RETURNS trigger AS $$
BEGIN
  -- Only save history when prices actually change
  IF OLD.price_avg IS DISTINCT FROM NEW.price_avg
     OR OLD.price_min IS DISTINCT FROM NEW.price_min
     OR OLD.price_max IS DISTINCT FROM NEW.price_max THEN
    INSERT INTO public.price_history (
      catalog_id, price_min, price_avg, price_max,
      sample_count, sources
    ) VALUES (
      NEW.id, NEW.price_min, NEW.price_avg, NEW.price_max,
      NEW.sample_count, NEW.last_sources
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER price_catalog_history
  AFTER UPDATE ON public.price_catalog
  FOR EACH ROW EXECUTE FUNCTION public.save_price_history();

-- ============================================
-- 7. Seed initial sources
-- ============================================

INSERT INTO public.price_sources (name, url, category, region, is_verified) VALUES
  ('Век Ремонта', 'https://remontcena.ru/tseny/', 'contractor', 'moscow', true),
  ('ГК Фундамент', 'https://remont-f.ru/remont-kvartir-pod-kluch/price.php', 'contractor', 'moscow', true),
  ('Profi.ru', 'https://profi.ru/remont/', 'marketplace', 'moscow', true),
  ('Петрович', 'https://petrovich.ru/catalog/', 'materials', 'moscow', true),
  ('IVD.ru', 'https://www.ivd.ru/stroitelstvo-i-remont/otdelocnye-materialy/skolko-stoit-remont-kvartiry-81672', 'aggregator', 'moscow', true),
  ('СК Просто', 'https://www.sk-prosto.ru/ceny-na-remont-kvartiry/', 'contractor', 'moscow', false),
  ('SDM Climate', 'https://www.sdmclimate.ru/ceny/', 'contractor', 'moscow', false)
ON CONFLICT (url) DO NOTHING;
