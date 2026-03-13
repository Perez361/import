-- Migration: Create product-images storage bucket + policies
-- Run: npx supabase db push

-- Create bucket (idempotent)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true) 
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Public read access
CREATE POLICY "Public product images read" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- Dashboard upload policy (logged-in importers)
CREATE POLICY "Importer upload products" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Optional: Importer update/delete own images
CREATE POLICY "Importer manage own product images" ON storage.objects
FOR ALL USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Verify
SELECT * FROM storage.buckets WHERE id = 'product-images';

