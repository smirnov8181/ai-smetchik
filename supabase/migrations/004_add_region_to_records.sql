-- ============================================
-- Add region column to estimates and verifications
-- so records are separated by region (RU vs US)
-- ============================================

-- Add region to estimates (default 'moscow' for existing records)
ALTER TABLE public.estimates
  ADD COLUMN region text NOT NULL DEFAULT 'moscow';

-- Add region to verifications (default 'moscow' for existing records)
ALTER TABLE public.verifications
  ADD COLUMN region text NOT NULL DEFAULT 'moscow';

-- Index for fast queries filtered by user + region
CREATE INDEX idx_estimates_user_region ON public.estimates(user_id, region);
CREATE INDEX idx_verifications_user_region ON public.verifications(user_id, region);

-- Also allow 'xlsx' as input_type for verifications (already used in code)
ALTER TABLE public.verifications
  DROP CONSTRAINT IF EXISTS verifications_input_type_check;
ALTER TABLE public.verifications
  ADD CONSTRAINT verifications_input_type_check
  CHECK (input_type IN ('text', 'pdf', 'photo', 'mixed', 'xlsx'));
