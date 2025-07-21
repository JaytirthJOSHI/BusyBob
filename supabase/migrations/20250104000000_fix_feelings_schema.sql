-- Migration: Fix feelings table schema to match code expectations
-- Generated on 2025-01-04

-- Add missing rating column to feelings table
ALTER TABLE "public"."feelings" 
ADD COLUMN IF NOT EXISTS "rating" smallint CHECK ("rating" >= 1 AND "rating" <= 5);

-- Make mood field nullable since we can generate it from rating
ALTER TABLE "public"."feelings" 
ALTER COLUMN "mood" DROP NOT NULL;

-- Add helpful comment
COMMENT ON TABLE "public"."feelings" IS 'User mood tracking with rating (1-5) and optional mood text';
COMMENT ON COLUMN "public"."feelings"."rating" IS 'Mood rating from 1 (very bad) to 5 (excellent)';
COMMENT ON COLUMN "public"."feelings"."mood" IS 'Textual description of mood (optional, can be generated from rating)';
COMMENT ON COLUMN "public"."feelings"."intensity" IS 'Mood intensity as percentage or scale';
COMMENT ON COLUMN "public"."feelings"."notes" IS 'Optional notes about the mood entry'; 