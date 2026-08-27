-- Create subscribers table (email capture for "First to know" / new drop alerts)
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscribers_active ON subscribers(is_active);

-- Enable RLS
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (public insert) — no read/update/delete from the client.
-- The notify-new-arrival edge function reads this table using the service role key,
-- which bypasses RLS entirely, so no SELECT policy is needed for it to work.
CREATE POLICY "Public can subscribe" ON subscribers FOR INSERT
  WITH CHECK (true);

-- Admin can view the subscriber list (e.g. for a future "subscribers" admin tab)
CREATE POLICY "Admin read subscribers" ON subscribers FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
