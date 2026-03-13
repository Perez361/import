-- PUBLIC RLS for storefront (run in Supabase SQL Editor)
-- Allows anonymous /store/[slug] view

ALTER TABLE public.importers DISABLE ROW LEVEL SECURITY; -- Or add public SELECT policy
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY; -- Public read products

-- Alternative policies (safer)
-- CREATE POLICY "Public importers select" ON public.importers FOR SELECT USING (true);
-- CREATE POLICY "Public products select" ON public.products FOR SELECT USING (true);

-- Verify data
SELECT store_slug, business_name FROM public.importers WHERE store_slug = 'albyimports';

-- Test importer_id matches test product
SELECT p.* FROM public.products p JOIN public.importers i ON p.importer_id = i.id WHERE i.store_slug = 'albyimports';

-- Bucket public if needed
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true) ON CONFLICT DO NOTHING;

-- Success! http://localhost:3000/store/albyimports

