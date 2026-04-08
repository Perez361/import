-- ============================================================
-- Migration 006: Create carts and cart_items tables
-- ============================================================

CREATE TABLE IF NOT EXISTS public.carts (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid        UNIQUE REFERENCES public.customers(id) ON DELETE CASCADE,
  store_id    uuid        NOT NULL REFERENCES public.importers(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at  timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.cart_items (
  id         uuid    NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cart_id    uuid    NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id uuid    NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity   integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (cart_id, product_id)
);

-- Enable RLS
ALTER TABLE public.carts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Customers manage own cart
CREATE POLICY "Customers can view own cart" ON public.carts FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM public.customers WHERE id = carts.customer_id));

CREATE POLICY "Customers can manage own cart" ON public.carts FOR ALL
  USING (auth.uid() = (SELECT user_id FROM public.customers WHERE id = carts.customer_id));

-- Store owners can view carts in their store
CREATE POLICY "Store owners can view store carts" ON public.carts FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.importers WHERE id = carts.store_id AND auth.uid() = public.importers.id));

-- Cart items: customers manage items in their own cart
CREATE POLICY "Customers can manage own cart items" ON public.cart_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.carts c
    JOIN public.customers cu ON c.customer_id = cu.id
    WHERE c.id = cart_items.cart_id AND auth.uid() = cu.user_id
  ));

-- Indexes
CREATE INDEX IF NOT EXISTS carts_customer_id_idx      ON public.carts (customer_id);
CREATE INDEX IF NOT EXISTS carts_store_id_idx         ON public.carts (store_id);
CREATE INDEX IF NOT EXISTS cart_items_cart_id_idx     ON public.cart_items (cart_id);
CREATE INDEX IF NOT EXISTS cart_items_product_id_idx  ON public.cart_items (product_id);
