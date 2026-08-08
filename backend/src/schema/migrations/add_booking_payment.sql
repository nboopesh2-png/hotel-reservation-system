-- Migration: add payment fields to bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_order_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_id TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
