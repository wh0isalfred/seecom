-- Multi-currency, multi-provider payment support.
--
-- Orders previously assumed Paystack + NGN only (see `paystack_reference`).
-- These new columns generalize that without touching existing data —
-- `paystack_reference` stays as-is for old rows; new checkout code writes
-- both the new generic columns AND paystack_reference (when applicable)
-- for backward compatibility with anything still reading the old column.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS currency VARCHAR NOT NULL DEFAULT 'NGN',
  ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(12, 4) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS payment_provider VARCHAR NOT NULL DEFAULT 'paystack',
  ADD COLUMN IF NOT EXISTS payment_reference VARCHAR;

-- Backfill payment_reference from the existing paystack_reference column
-- so historical orders read correctly through the new generic field too.
UPDATE orders SET payment_reference = paystack_reference
  WHERE payment_reference IS NULL AND paystack_reference IS NOT NULL;

-- Cached exchange rates — NGN is the site's native pricing currency, so rate
-- is stored as "NGN per 1 unit of target_currency" (e.g. USD row: rate=1500
-- means 1 USD = ₦1,500). Convert: foreign_amount = ngn_amount / rate.
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_currency VARCHAR NOT NULL UNIQUE,
  rate DECIMAL(12, 4) NOT NULL,
  is_manual_override BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO exchange_rates (target_currency, rate) VALUES
  ('USD', 1339),
  ('GBP', 1814)
ON CONFLICT (target_currency) DO NOTHING;

ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Public read (customer-facing price conversion needs this) — no client writes.
CREATE POLICY "Public can read exchange rates" ON exchange_rates FOR SELECT
  USING (true);

-- Admin can update rates manually (e.g. to set an override)
CREATE POLICY "Admin can update exchange rates" ON exchange_rates FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
