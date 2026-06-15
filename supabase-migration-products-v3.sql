-- Migration: Products v3 — new fields (SKU, weight, notes)
-- Run in Supabase SQL Editor

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS weight_per_unit NUMERIC,
  ADD COLUMN IF NOT EXISTS weight_per_case NUMERIC,
  ADD COLUMN IF NOT EXISTS notes TEXT;
