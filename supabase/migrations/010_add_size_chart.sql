-- Per-product size guide data, replacing the one-size-fits-all hardcoded
-- table that used to live directly in ProductDetailPage.jsx. Defaults to
-- null — the product page falls back to the old hardcoded values for any
-- product created before this existed, so nothing breaks.
--
-- Shape (set by the admin form, see AdminProductForm.jsx SIZE_CHART_DEFAULTS):
--   {
--     "type": "table",
--     "columns": ["Chest","Length",...],          -- which columns are shown, in order
--     "rows": { "XS": { "Chest": "86-91", ... } } -- keyed by column name, not
--                                                     position, so toggling a
--                                                     column on/off never
--                                                     shifts or loses other data
--   }
--   { "type": "note", "text": "All SEE.COM chains are one size..." }
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS size_chart JSONB;
