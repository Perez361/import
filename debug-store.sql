-- Debug slugs - run in Supabase SQL Editor

-- Check all slugs
SELECT id, username, business_name, store_slug, LOWER(store_slug) as lower_slug 
FROM public.importers 
ORDER BY created_at DESC LIMIT 10;

-- Test specific lookup
SELECT * FROM public.importers WHERE LOWER(store_slug) = 'albydocile' OR store_slug = 'albydocile' OR LOWER(username) = 'albydocile';

-- Fix albydocile if needed (adjust username/business_name)
-- UPDATE public.importers SET store_slug = 'alby-docile' WHERE LOWER(username) LIKE '%alby%';

-- Make slug lookup case-insensitive index
CREATE INDEX IF NOT EXISTS importers_lower_slug_idx ON public.importers (LOWER(store_slug));

-- Update lib/store.ts query to LOWER() match if want case-insensitive

