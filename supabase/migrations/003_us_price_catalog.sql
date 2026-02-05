-- ============================================
-- US PRICE CATALOG
-- ============================================
create table public.price_catalog_us (
  id uuid primary key default uuid_generate_v4(),
  category text not null,
  work_name text not null,
  unit text not null,
  price_min numeric(10,2) not null,
  price_avg numeric(10,2) not null,
  price_max numeric(10,2) not null,
  region text not null,              -- 'US-CA-LA', 'US-NY-NYC', 'US-TX-HOU'
  region_name text,                  -- 'Los Angeles, CA'
  zip_codes text[],                  -- array of zip codes for this region
  source text not null default 'manual',  -- 'homeadvisor', 'thumbtack', 'homeguide', 'user', 'manual'
  source_url text,                   -- URL where price was scraped from
  confidence numeric(3,2) default 0.8,  -- 0-1, how reliable is this price
  sample_count int default 1,        -- how many data points
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for fast lookups
create index idx_price_catalog_us_region on public.price_catalog_us(region);
create index idx_price_catalog_us_work on public.price_catalog_us(work_name);
create index idx_price_catalog_us_category on public.price_catalog_us(category);

alter table public.price_catalog_us enable row level security;

-- Anyone can read (for verification)
create policy "Anyone can read US price catalog"
  on public.price_catalog_us for select
  to authenticated
  using (true);

-- Only service role can modify (via API/scripts)
create policy "Service role can modify US price catalog"
  on public.price_catalog_us for all
  to service_role
  using (true);

-- Updated_at trigger
create trigger price_catalog_us_updated_at
  before update on public.price_catalog_us
  for each row execute procedure public.update_updated_at();

-- ============================================
-- US REGIONS reference table
-- ============================================
create table public.us_regions (
  code text primary key,             -- 'US-CA-LA'
  name text not null,                -- 'Los Angeles, CA'
  state text not null,               -- 'CA'
  city text not null,                -- 'Los Angeles'
  cost_index numeric(4,2) not null,  -- 1.0 = national average, 1.25 = 25% higher
  population int,
  created_at timestamptz not null default now()
);

alter table public.us_regions enable row level security;

create policy "Anyone can read US regions"
  on public.us_regions for select
  to authenticated
  using (true);

-- Insert top metro areas
INSERT INTO public.us_regions (code, name, state, city, cost_index, population) VALUES
  ('US-NY-NYC', 'New York City, NY', 'NY', 'New York City', 1.35, 8300000),
  ('US-CA-LA', 'Los Angeles, CA', 'CA', 'Los Angeles', 1.25, 3900000),
  ('US-IL-CHI', 'Chicago, IL', 'IL', 'Chicago', 1.10, 2700000),
  ('US-TX-HOU', 'Houston, TX', 'TX', 'Houston', 0.95, 2300000),
  ('US-AZ-PHX', 'Phoenix, AZ', 'AZ', 'Phoenix', 0.90, 1600000),
  ('US-PA-PHL', 'Philadelphia, PA', 'PA', 'Philadelphia', 1.15, 1600000),
  ('US-TX-SA', 'San Antonio, TX', 'TX', 'San Antonio', 0.85, 1500000),
  ('US-CA-SD', 'San Diego, CA', 'CA', 'San Diego', 1.20, 1400000),
  ('US-TX-DAL', 'Dallas, TX', 'TX', 'Dallas', 0.95, 1300000),
  ('US-FL-MIA', 'Miami, FL', 'FL', 'Miami', 1.10, 450000),
  ('US-CA-SF', 'San Francisco, CA', 'CA', 'San Francisco', 1.45, 870000),
  ('US-WA-SEA', 'Seattle, WA', 'WA', 'Seattle', 1.20, 750000),
  ('US-CO-DEN', 'Denver, CO', 'CO', 'Denver', 1.05, 715000),
  ('US-MA-BOS', 'Boston, MA', 'MA', 'Boston', 1.30, 675000),
  ('US-GA-ATL', 'Atlanta, GA', 'GA', 'Atlanta', 1.00, 500000),
  ('US-NV-LV', 'Las Vegas, NV', 'NV', 'Las Vegas', 0.95, 650000),
  ('US-OR-PDX', 'Portland, OR', 'OR', 'Portland', 1.10, 650000),
  ('US-MN-MSP', 'Minneapolis, MN', 'MN', 'Minneapolis', 1.00, 430000),
  ('US-FL-ORL', 'Orlando, FL', 'FL', 'Orlando', 0.95, 310000),
  ('US-NC-CLT', 'Charlotte, NC', 'NC', 'Charlotte', 0.95, 880000);
