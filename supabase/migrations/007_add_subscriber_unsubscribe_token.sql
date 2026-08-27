-- Add a per-subscriber unsubscribe token so email footer "Unsubscribe" links
-- don't need to expose (or trust) the raw email address, and can't be used
-- to unsubscribe someone else's address by guessing it.
ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS unsubscribe_token UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE;
