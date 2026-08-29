-- Made-to-order products (e.g. chains): no stock tracking, ~3 week production
-- lead time before the item even ships. Products flagged true here skip the
-- stock/sold-out gating in ProductDetailPage entirely.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_made_to_order BOOLEAN NOT NULL DEFAULT false;

-- Carried onto cart items at add-to-bag time so the cart page can flag mixed
-- orders with a different delivery expectation, without an extra product
-- lookup per cart item.
ALTER TABLE cart_items
  ADD COLUMN IF NOT EXISTS made_to_order BOOLEAN NOT NULL DEFAULT false;
