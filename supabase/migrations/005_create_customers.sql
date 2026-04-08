-- ============================================================
-- Migration 005: Create customers table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.customers (
  id               uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id         uuid        NOT NULL REFERENCES public.importers(id) ON DELETE CASCADE,
  user_id          uuid        UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name        text,
  username         text,
  contact          text,
  email            text,
  location         text,
  shipping_address text,
  avatar_url       text,
  created_at       timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at       timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Customers manage own profile
CREATE POLICY "Customers can view own profile"   ON public.customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Customers can insert own profile" ON public.customers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Customers can update own profile" ON public.customers FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Customers can delete own profile" ON public.customers FOR DELETE USING (auth.uid() = user_id);

-- Store owners can view customers in their store
CREATE POLICY "Store owners can view their customers" ON public.customers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.importers WHERE id = store_id AND auth.uid() = public.importers.id
  ));

-- Indexes
CREATE INDEX IF NOT EXISTS customers_store_id_idx ON public.customers (store_id);
CREATE INDEX IF NOT EXISTS customers_user_id_idx  ON public.customers (user_id);
