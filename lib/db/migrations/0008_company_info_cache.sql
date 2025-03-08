-- Create CompanyInfo table
CREATE TABLE IF NOT EXISTS "CompanyInfo" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "website" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "industry" TEXT NOT NULL,
  "products" TEXT NOT NULL,
  "uniqueFeatures" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT now() NOT NULL
);

-- Create index on website
CREATE INDEX IF NOT EXISTS "CompanyInfo_website_idx" ON "CompanyInfo" ("website");

-- Update Account table to make website required
-- First, set any NULL website values to a placeholder
UPDATE "Account" SET "website" = 'https://placeholder.com' WHERE "website" IS NULL;

-- Then alter the column to be NOT NULL
ALTER TABLE "Account" ALTER COLUMN "website" SET NOT NULL;

-- Create index on website in Account table
CREATE INDEX IF NOT EXISTS "Account_website_idx" ON "Account" ("website"); 