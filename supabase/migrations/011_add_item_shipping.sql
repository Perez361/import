-- ============================================================
-- Migration 011: Per-item shipping fee on order_items
--
-- Problem: orders.shipping_fee is a single value for the whole
-- order. When a customer orders multiple products, billing
-- one product's shipping overwrites or blocks billing for others.
--
-- Fix: track shipping_fee per order_item so each product in
-- an order can be billed independently. The order-level
-- shipping_fee becomes the sum of all item fees.
-- ============================================================

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS shipping_fee      decimal(10,2),
  ADD COLUMN IF NOT EXISTS shipping_billed_at timestamptz;

CREATE INDEX IF NOT EXISTS order_items_product_id_order_id_idx
  ON public.order_items (product_id, order_id);
