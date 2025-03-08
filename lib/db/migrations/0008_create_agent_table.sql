CREATE TABLE IF NOT EXISTS "Agent" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "instructions" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "searchType" text DEFAULT 'web-search' NOT NULL,
    "userId" uuid NOT NULL,
    "createdAt" timestamp NOT NULL DEFAULT now(),
    "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "Agent_userId_idx" ON "Agent" ("userId");

DO $$ BEGIN
    ALTER TABLE "Agent" ADD CONSTRAINT "Agent_userId_User_id_fk" 
    FOREIGN KEY ("userId") REFERENCES "public"."User"("id") 
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$; 