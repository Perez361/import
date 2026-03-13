-- Add store_slug to importers (if not exists, since code assumes it)
ALTER TABLE public.importers 
ADD COLUMN IF NOT EXISTS store_slug text UNIQUE;

-- Create index
CREATE INDEX IF NOT EXISTS importers_store_slug_idx ON public.importers (store_slug);

-- Create products table
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

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users access own importer's products
CREATE POLICY \"Users can view own products\" ON public.products FOR SELECT 
  USING (importer_id = auth.uid());

CREATE POLICY \"Users can insert own products\" ON public.products FOR INSERT 
  WITH CHECK (importer_id = auth.uid());

CREATE POLICY \"Users can update own products\" ON public.products FOR UPDATE 
  USING (importer_id = auth.uid()) WITH CHECK (importer_id = auth.uid());

CREATE POLICY \"Users can delete own products\" ON public.products FOR DELETE 
  USING (importer_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS products_importer_id_idx ON public.products (importer_id);
CREATE INDEX IF NOT EXISTS products_slug_idx ON public.products (slug);

