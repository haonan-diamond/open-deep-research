CREATE TABLE IF NOT EXISTS "Account" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "website" text,
    "industry" text,
    "description" text,
    "logo" text,
    "userId" uuid NOT NULL,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account" ("userId");
CREATE INDEX IF NOT EXISTS "Account_name_idx" ON "Account" ("name");

DO $$ BEGIN
    ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_User_id_fk" 
    FOREIGN KEY ("userId") REFERENCES "public"."User"("id") 
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$; 