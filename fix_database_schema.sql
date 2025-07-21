-- Manual Database Fix Script
-- Run this script in your Supabase SQL Editor to fix the schema issues

-- 1. Add missing rating column to feelings table
ALTER TABLE "public"."feelings" 
ADD COLUMN IF NOT EXISTS "rating" smallint CHECK ("rating" >= 1 AND "rating" <= 5);

-- 2. Make mood field nullable since we can generate it from rating
ALTER TABLE "public"."feelings" 
ALTER COLUMN "mood" DROP NOT NULL;

-- 3. Update existing records without rating to have a default rating
UPDATE "public"."feelings" 
SET "rating" = 3 
WHERE "rating" IS NULL;

-- 4. Update existing records without mood to have generated mood text
UPDATE "public"."feelings" 
SET "mood" = CASE 
    WHEN "rating" = 1 THEN 'Very Bad'
    WHEN "rating" = 2 THEN 'Bad' 
    WHEN "rating" = 3 THEN 'Okay'
    WHEN "rating" = 4 THEN 'Good'
    WHEN "rating" = 5 THEN 'Excellent'
    ELSE 'Neutral'
END
WHERE "mood" IS NULL OR "mood" = '';

-- 5. Add helpful comments
COMMENT ON TABLE "public"."feelings" IS 'User mood tracking with rating (1-5) and optional mood text';
COMMENT ON COLUMN "public"."feelings"."rating" IS 'Mood rating from 1 (very bad) to 5 (excellent)';
COMMENT ON COLUMN "public"."feelings"."mood" IS 'Textual description of mood (optional, can be generated from rating)';
COMMENT ON COLUMN "public"."feelings"."intensity" IS 'Mood intensity as percentage or scale';
COMMENT ON COLUMN "public"."feelings"."notes" IS 'Optional notes about the mood entry';

-- 6. Ensure all profiles have the required basic fields
ALTER TABLE "public"."profiles" 
ADD COLUMN IF NOT EXISTS "points" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "lifetime_points" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "level" integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS "unlocked_rewards" jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS "settings" jsonb DEFAULT '{}'::jsonb;

-- 7. Create missing profiles for authenticated users (if any)
-- This will be handled by the application code automatically

-- Verification queries (uncomment to check the results):
-- SELECT COUNT(*) as total_feelings, COUNT(rating) as with_rating, COUNT(mood) as with_mood FROM feelings;
-- SELECT * FROM feelings WHERE rating IS NULL OR mood IS NULL LIMIT 5;
-- SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'feelings' AND table_schema = 'public'; 