-- ============================================================
-- Migration 004: Ensure store_slug is populated
-- (Column + index created in migration 001; this seeds slugs
--  for any importers whose store_slug is still NULL)
-- ============================================================

-- Default to lowercase username when store_slug is missing
UPDATE public.importers
SET store_slug = LOWER(username)
WHERE store_slug IS NULL AND username IS NOT NULL;
