-- ============================================
-- Add paywall fields to estimates table
-- Estimate paywall: 50% of sections shown free, full report for 490 RUB
-- ============================================

ALTER TABLE public.estimates
  ADD COLUMN IF NOT EXISTS is_paid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_intent_id text;

-- Index for payment lookups
CREATE INDEX IF NOT EXISTS idx_estimates_payment_intent
  ON public.estimates(payment_intent_id)
  WHERE payment_intent_id IS NOT NULL;
