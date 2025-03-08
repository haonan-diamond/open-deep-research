CREATE TABLE IF NOT EXISTS "Company" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "description" text NOT NULL,
    "useCase" text NOT NULL,
    "userId" uuid NOT NULL,
    "createdAt" timestamp NOT NULL,
    "updatedAt" timestamp NOT NULL
);

DO $$ BEGIN
    ALTER TABLE "Company" ADD CONSTRAINT "Company_userId_User_id_fk" 
    FOREIGN KEY ("userId") REFERENCES "public"."User"("id") 
    ON DELETE no action ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$; 