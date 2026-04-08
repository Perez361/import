-- ============================================================
-- Migration 002: Create products table
-- (store_slug already added to importers in migration 001)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.products (
  id           uuid           NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  importer_id  uuid           NOT NULL REFERENCES public.importers(id) ON DELETE CASCADE,
  name         text           NOT NULL,
  slug         text           NOT NULL,
  price        numeric(10,2)  NOT NULL,
  description  text,
  image_url    text,
  shipping_tag text           DEFAULT 'without shipping fee',
  created_at   timestamptz    NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Importers manage own products
CREATE POLICY "Importers can view own products"   ON public.products FOR SELECT USING (importer_id = auth.uid());
CREATE POLICY "Importers can insert own products" ON public.products FOR INSERT WITH CHECK (importer_id = auth.uid());
CREATE POLICY "Importers can update own products" ON public.products FOR UPDATE USING (importer_id = auth.uid()) WITH CHECK (importer_id = auth.uid());
CREATE POLICY "Importers can delete own products" ON public.products FOR DELETE USING (importer_id = auth.uid());

-- Public read — customers browse products in the storefront
CREATE POLICY "Public can view products" ON public.products FOR SELECT USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS products_importer_id_idx ON public.products (importer_id);
CREATE INDEX IF NOT EXISTS products_slug_idx        ON public.products (slug);
