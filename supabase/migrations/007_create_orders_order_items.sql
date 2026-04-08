-- ============================================================
-- Migration 007: Create orders and order_items tables
-- ============================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id                          uuid           NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id                 uuid           REFERENCES public.customers(id) ON DELETE SET NULL,
  store_id                    uuid           NOT NULL REFERENCES public.importers(id) ON DELETE SET NULL,
  total                       decimal(10,2)  NOT NULL DEFAULT 0,
  shipping_fee                decimal(10,2),
  status                      text           NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending',
      'product_paid',
      'processing',
      'arrived',
      'shipping_billed',
      'shipping_paid',
      'delivered',
      'cancelled'
    )),
  -- Payment tracking
  product_paid                boolean        NOT NULL DEFAULT false,
  product_payment_reference   text,
  payment_reference           text,
  momo_number                 text,
  -- Shipping tracking
  shipping_note               text,
  shipping_billed_at          timestamptz,
  shipping_paid_at            timestamptz,
  -- Timestamps
  created_at                  timestamptz    NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at                  timestamptz    NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id         uuid          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id   uuid          NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid          REFERENCES public.products(id) ON DELETE SET NULL,
  quantity   integer       NOT NULL CHECK (quantity > 0),
  price      decimal(10,2) NOT NULL,
  created_at timestamptz   NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Customers see and manage own orders
CREATE POLICY "Customers can view own orders" ON public.orders FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM public.customers WHERE id = customer_id));

CREATE POLICY "Customers can insert own orders" ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.customers WHERE id = customer_id));

CREATE POLICY "Customers can update own orders" ON public.orders FOR UPDATE
  USING (auth.uid() = (SELECT user_id FROM public.customers WHERE id = customer_id));

-- Store owners manage all orders in their store
CREATE POLICY "Store owners can manage orders" ON public.orders FOR ALL
  USING (EXISTS (SELECT 1 FROM public.importers WHERE id = store_id AND auth.uid() = public.importers.id));

-- Order items: customers see items in their orders
CREATE POLICY "Customers can view own order items" ON public.order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.customers c ON o.customer_id = c.id
    WHERE o.id = order_id AND auth.uid() = c.user_id
  ));

CREATE POLICY "Customers can insert own order items" ON public.order_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.customers c ON o.customer_id = c.id
    WHERE o.id = order_id AND auth.uid() = c.user_id
  ));

-- Store owners manage all order items in their store
CREATE POLICY "Store owners can manage order items" ON public.order_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.importers i ON o.store_id = i.id
    WHERE o.id = order_id AND auth.uid() = i.id
  ));

-- Indexes
CREATE INDEX IF NOT EXISTS orders_customer_id_idx  ON public.orders (customer_id);
CREATE INDEX IF NOT EXISTS orders_store_id_idx     ON public.orders (store_id);
CREATE INDEX IF NOT EXISTS orders_status_idx       ON public.orders (status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx   ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx   ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS order_items_product_id_idx ON public.order_items (product_id);
