-- Update ALL slugs to business_name (run once - overrides username)

-- Clean & set store_slug from business_name
UPDATE public.importers 
SET store_slug = LOWER(REGEXP_REPLACE(business_name, '[^a-zA-Z0-9\\s-]', '', 'g')) 
WHERE business_name IS NOT NULL;

-- Verify (check alby docile → albydocile)
SELECT username, business_name, store_slug FROM public.importers WHERE LOWER(business_name) LIKE '%alby%' OR LOWER(username) LIKE '%alby%';

-- Fix duplicates (run if error)
-- UPDATE public.importers 
-- SET store_slug = store_slug || '-' || (SELECT COUNT(*) + 1 FROM public.importers WHERE store_slug = importers.store_slug AND id != importers.id)
-- WHERE id IN (
--   SELECT id FROM (
--     SELECT id, store_slug, ROW_NUMBER() OVER (PARTITION BY store_slug ORDER BY created_at) rn
--     FROM public.importers
--     WHERE store_slug IS NOT NULL
--   ) dup WHERE rn > 1
-- );

-- Test /store/albydocile works!


