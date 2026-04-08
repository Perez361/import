-- ============================================================
-- Migration 003: Create product-images storage bucket
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "Public product images read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

-- Importers upload to their own folder (folder name = their user id)
CREATE POLICY "Importers can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Importers manage (update/delete) their own images
CREATE POLICY "Importers can manage own product images" ON storage.objects
  FOR ALL USING (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
