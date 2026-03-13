-- Add store_slug column to importers table
ALTER TABLE public.importers ADD COLUMN IF NOT EXISTS store_slug text UNIQUE;

-- Create index for store_slug lookups (case-insensitive)
CREATE INDEX IF NOT EXISTS importers_store_slug_idx ON public.importers (LOWER(store_slug));

-- Update existing importers with store_slug from username
UPDATE public.importers 
SET store_slug = LOWER(username)
WHERE store_slug IS NULL OR store_slug = '';

-- Allow public read access to importers for storefront
DROP POLICY IF EXISTS "Public importers profile for authenticated users" ON public.importers;
DROP POLICY IF EXISTS "Anyone can view importers" ON public.importers;
CREATE POLICY "Public can view importers" ON public.importers FOR SELECT USING (true);

-- Update the trigger function to include store_slug
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  generated_slug text;
BEGIN
  -- Generate store_slug from username
  generated_slug := LOWER(TRIM(NEW.raw_user_meta_data ->> 'username'));
  generated_slug := REGEXP_REPLACE(generated_slug, '[^a-z0-9_]', '', 'g');
  
  INSERT INTO public.importers (id, business_name, full_name, username, phone, location, store_slug)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data ->> 'business_name')::text,
    (NEW.raw_user_meta_data ->> 'full_name')::text,
    (NEW.raw_user_meta_data ->> 'username')::text,
    (NEW.raw_user_meta_data ->> 'phone')::text,
    (NEW.raw_user_meta_data ->> 'location')::text,
    generated_slug
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
