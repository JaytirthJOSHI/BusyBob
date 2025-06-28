ALTER TABLE "public"."profiles"
ADD COLUMN "lifetime_points" integer DEFAULT 0,
ADD COLUMN "level" integer DEFAULT 1,
ADD COLUMN "unlocked_rewards" jsonb DEFAULT '[]'::jsonb;