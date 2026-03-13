-- Add store_slug column to importers table
ALTER TABLE public.importers ADD COLUMN IF NOT EXISTS store_slug text UNIQUE;

-- Create index for store_slug lookups (case-insensitive)
CREATE INDEX IF NOT EXISTS importers_store_slug_idx ON public.importers (LOWER(store_slug));

-- Update existing importers with store_slug from username
UPDATE public.importers 
SET store_slug = LOWER(username)
WHERE store_slug IS NULL OR store_slug = '';

-- Allow public read access to importers for storefront
-- Only create if doesn't exist (skip if already exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view importers' AND tablename = 'importers') THEN
    CREATE POLICY "Public can view importers" ON public.importers FOR SELECT USING (true);
  END IF;
END $$;
