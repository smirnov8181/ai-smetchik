-- ============================================
-- VERIFICATIONS (проверка смет заказчиками)
-- ============================================
create table public.verifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'processing', 'ready', 'error')),
  input_type text not null default 'text' check (input_type in ('text', 'pdf', 'photo', 'mixed')),
  input_text text,
  parsed_items jsonb,
  result jsonb,
  total_contractor numeric(12,2),
  total_market numeric(12,2),
  overpay_amount numeric(12,2),
  overpay_percent numeric(5,2),
  is_paid boolean not null default false,
  payment_intent_id text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.verifications enable row level security;

create policy "Users can view own verifications"
  on public.verifications for select
  using (auth.uid() = user_id);

create policy "Users can insert own verifications"
  on public.verifications for insert
  with check (auth.uid() = user_id);

create policy "Users can update own verifications"
  on public.verifications for update
  using (auth.uid() = user_id);

create policy "Users can delete own verifications"
  on public.verifications for delete
  using (auth.uid() = user_id);

-- ============================================
-- VERIFICATION FILES
-- ============================================
create table public.verification_files (
  id uuid primary key default uuid_generate_v4(),
  verification_id uuid not null references public.verifications(id) on delete cascade,
  file_url text not null,
  file_type text not null check (file_type in ('pdf', 'image')),
  original_name text not null,
  created_at timestamptz not null default now()
);

alter table public.verification_files enable row level security;

create policy "Users can view own verification files"
  on public.verification_files for select
  using (
    exists (
      select 1 from public.verifications
      where verifications.id = verification_files.verification_id
      and verifications.user_id = auth.uid()
    )
  );

create policy "Users can insert own verification files"
  on public.verification_files for insert
  with check (
    exists (
      select 1 from public.verifications
      where verifications.id = verification_files.verification_id
      and verifications.user_id = auth.uid()
    )
  );

-- Updated_at trigger
create trigger verifications_updated_at
  before update on public.verifications
  for each row execute procedure public.update_updated_at();
