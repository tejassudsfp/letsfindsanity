-- Migration: Add how_heard column to applications table
-- Date: 2025-11-17

ALTER TABLE applications
ADD COLUMN IF NOT EXISTS how_heard TEXT;

COMMENT ON COLUMN applications.how_heard IS 'Where the user heard about letsfindsanity';
