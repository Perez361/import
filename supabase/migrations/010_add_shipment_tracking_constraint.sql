-- ============================================================
-- Migration 010: Add unique constraint for shipment tracking numbers
-- ============================================================

-- Add unique constraint to prevent duplicate tracking numbers within the same batch
ALTER TABLE public.shipment_items ADD CONSTRAINT shipment_items_batch_tracking_unique
  UNIQUE (batch_id, tracking_number);