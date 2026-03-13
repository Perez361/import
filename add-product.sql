-- Test product - run in SQL Editor (replace YOUR_USER_ID from importers.id)

INSERT INTO public.products (importer_id, name, slug, price, description, image_url)
VALUES (
  (SELECT id FROM public.importers WHERE username = 'albydocile'),
  'Test Pre-Order Product',
  'test-product',
  650.00,
  'iPhone case, pre-order available',
  'https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=Product'
);

-- Verify
SELECT * FROM public.products ORDER BY created_at DESC LIMIT 3;

