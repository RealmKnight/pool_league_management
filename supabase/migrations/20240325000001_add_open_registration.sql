-- Add open_registration column to leagues table
ALTER TABLE "public"."leagues" 
ADD COLUMN "open_registration" BOOLEAN NOT NULL DEFAULT false;

-- Update existing rows to have a default value
UPDATE "public"."leagues" 
SET "open_registration" = false 
WHERE "open_registration" IS NULL; 