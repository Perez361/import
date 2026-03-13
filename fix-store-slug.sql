-- Fix Store Slug Issue - Run in Supabase SQL Editor
-- This script adds store_slug column and populates existing records

-- 1. Add store_slug column if not exists
ALTER TABLE public.importers ADD COLUMN IF NOT EXISTS store_slug text;

-- 2. Update existing importers with store_slug from username
UPDATE public.importers 
SET store_slug = LOWER(username)
WHERE store_slug IS NULL OR store_slug = '';

-- 3. Create case-insensitive index for store_slug lookups
DROP INDEX IF EXISTS importers_store_slug_idx;
CREATE INDEX importers_store_slug_idx ON public.importers (LOWER(store_slug));

-- 4. Ensure public can read importers (for storefront) - only create if doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view importers' AND tablename = 'importers') THEN
    CREATE POLICY "Public can view importers" ON public.importers FOR SELECT USING (true);
  END IF;
END $$;

-- 5. Verify the fix - should return importers with store_slug
SELECT id, username, business_name, store_slug FROM public.importers LIMIT 10;
