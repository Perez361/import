-- Run this in Supabase Dashboard > SQL Editor (all at once)

-- 1. Add store_slug if missing
ALTER TABLE public.importers ADD COLUMN IF NOT EXISTS store_slug text UNIQUE;
CREATE INDEX IF NOT EXISTS importers_store_slug_idx ON public.importers (store_slug);

-- 2. Assign slugs to existing users (username → lower/username)
UPDATE public.importers 
SET store_slug = LOWER(username) 
WHERE store_slug IS NULL;

-- 3. Products table + RLS
CREATE TABLE IF NOT EXISTS public.products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  importer_id uuid NOT NULL REFERENCES public.importers(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  price numeric(10,2) NOT NULL,
  description text,
  image_url text,
  shipping_tag text DEFAULT 'without shipping fee',
  created_at timestamptz DEFAULT timezone('utc' ::text, now()) NOT NULL
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own products" ON public.products FOR SELECT USING (importer_id = auth.uid());
CREATE POLICY "Users insert own products" ON public.products FOR INSERT WITH CHECK (importer_id = auth.uid());
CREATE POLICY "Users update own products" ON public.products FOR UPDATE USING (importer_id = auth.uid());
CREATE POLICY "Users delete own products" ON public.products FOR DELETE USING (importer_id = auth.uid());

CREATE INDEX IF NOT EXISTS products_importer_id_idx ON public.products (importer_id);

-- Ready! Test /dashboard/products, /store/{username}

