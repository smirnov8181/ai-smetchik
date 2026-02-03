-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- ESTIMATES
-- ============================================
create table public.estimates (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'processing', 'ready', 'error')),
  input_type text not null default 'text' check (input_type in ('text', 'pdf', 'photo', 'mixed')),
  input_text text,
  input_data jsonb,
  result jsonb,
  total_amount numeric(12,2),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.estimates enable row level security;

create policy "Users can view own estimates"
  on public.estimates for select
  using (auth.uid() = user_id);

create policy "Users can insert own estimates"
  on public.estimates for insert
  with check (auth.uid() = user_id);

create policy "Users can update own estimates"
  on public.estimates for update
  using (auth.uid() = user_id);

create policy "Users can delete own estimates"
  on public.estimates for delete
  using (auth.uid() = user_id);

-- ============================================
-- PRICE CATALOG
-- ============================================
create table public.price_catalog (
  id uuid primary key default uuid_generate_v4(),
  category text not null,
  work_name text not null,
  unit text not null,
  price_min numeric(10,2) not null,
  price_avg numeric(10,2) not null,
  price_max numeric(10,2) not null,
  region text not null default 'moscow',
  updated_at timestamptz not null default now()
);

alter table public.price_catalog enable row level security;

create policy "Anyone can read price catalog"
  on public.price_catalog for select
  to authenticated
  using (true);

-- ============================================
-- ESTIMATE FILES
-- ============================================
create table public.estimate_files (
  id uuid primary key default uuid_generate_v4(),
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  file_url text not null,
  file_type text not null check (file_type in ('pdf', 'image')),
  original_name text not null,
  created_at timestamptz not null default now()
);

alter table public.estimate_files enable row level security;

create policy "Users can view own estimate files"
  on public.estimate_files for select
  using (
    exists (
      select 1 from public.estimates
      where estimates.id = estimate_files.estimate_id
      and estimates.user_id = auth.uid()
    )
  );

create policy "Users can insert own estimate files"
  on public.estimate_files for insert
  with check (
    exists (
      select 1 from public.estimates
      where estimates.id = estimate_files.estimate_id
      and estimates.user_id = auth.uid()
    )
  );

-- ============================================
-- SUBSCRIPTIONS
-- ============================================
create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  plan text not null default 'free' check (plan in ('free', 'pro', 'business')),
  stripe_customer_id text,
  stripe_subscription_id text,
  estimates_used integer not null default 0,
  estimates_limit integer not null default 3,
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "Users can view own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can update own subscription"
  on public.subscriptions for update
  using (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-create subscription on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.subscriptions (user_id, plan, estimates_limit)
  values (new.id, 'free', 3);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated_at trigger
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger estimates_updated_at
  before update on public.estimates
  for each row execute procedure public.update_updated_at();

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute procedure public.update_updated_at();
