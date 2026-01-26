-- Add is_printed column to supplier_order_items for tracking printing status
-- This is separate from is_validated which tracks stock validation

ALTER TABLE supplier_order_items
ADD COLUMN IF NOT EXISTS is_printed BOOLEAN DEFAULT FALSE;

ALTER TABLE supplier_order_items
ADD COLUMN IF NOT EXISTS printed_at TIMESTAMPTZ;
