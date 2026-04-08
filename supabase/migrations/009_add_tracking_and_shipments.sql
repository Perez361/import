-- ============================================================
-- Migration 009: Add tracking/supplier fields to products +
--                Create shipment_batches and shipment_items
-- ============================================================

-- Add extra product fields
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS supplier_name   text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS supplier_url    text;

-- Shipment batches (one per overseas freight shipment)
CREATE TABLE IF NOT EXISTS public.shipment_batches (
  id               uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  importer_id      uuid        NOT NULL REFERENCES public.importers(id) ON DELETE CASCADE,
  name             text        NOT NULL,
  shipping_company text,
  status           text        NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'received', 'reconciled')),
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at       timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.shipment_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Importers manage own batches" ON public.shipment_batches FOR ALL
  USING (importer_id = auth.uid()) WITH CHECK (importer_id = auth.uid());

CREATE INDEX IF NOT EXISTS shipment_batches_importer_id_idx ON public.shipment_batches (importer_id);
CREATE INDEX IF NOT EXISTS shipment_batches_status_idx      ON public.shipment_batches (status);

-- Shipment items (individual parcels in a batch)
CREATE TABLE IF NOT EXISTS public.shipment_items (
  id              uuid          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id        uuid          NOT NULL REFERENCES public.shipment_batches(id) ON DELETE CASCADE,
  tracking_number text          NOT NULL,
  product_id      uuid          REFERENCES public.products(id) ON DELETE SET NULL,
  status          text          NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'received', 'missing', 'extra')),
  freight_cost    decimal(10,2),
  weight_kg       decimal(8,3),
  notes           text,
  created_at      timestamptz   NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.shipment_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Importers manage own shipment items" ON public.shipment_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.shipment_batches b
    WHERE b.id = shipment_items.batch_id AND b.importer_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS shipment_items_batch_id_idx   ON public.shipment_items (batch_id);
CREATE INDEX IF NOT EXISTS shipment_items_product_id_idx ON public.shipment_items (product_id);
