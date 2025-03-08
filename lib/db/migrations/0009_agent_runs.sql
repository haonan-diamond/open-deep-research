-- Create AgentRun table
CREATE TABLE IF NOT EXISTS "AgentRun" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "agentId" UUID NOT NULL REFERENCES "Agent"("id") ON DELETE CASCADE,
  "accountId" UUID NOT NULL REFERENCES "Account"("id") ON DELETE CASCADE,
  "chatId" UUID NOT NULL REFERENCES "Chat"("id") ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "searchType" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "AgentRun_agentId_idx" ON "AgentRun" ("agentId");
CREATE INDEX IF NOT EXISTS "AgentRun_accountId_idx" ON "AgentRun" ("accountId");
CREATE INDEX IF NOT EXISTS "AgentRun_chatId_idx" ON "AgentRun" ("chatId");
CREATE INDEX IF NOT EXISTS "AgentRun_userId_idx" ON "AgentRun" ("userId"); 