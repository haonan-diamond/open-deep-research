import 'server-only';

import { genSaltSync, hashSync } from 'bcrypt-ts';
import { and, asc, desc, eq, gt, gte, ilike } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  user,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  type Message,
  message,
  vote,
  company,
  type Company,
  agents,
  accounts,
  companyInfo,
  agentRuns
} from './schema';
import { BlockKind } from '@/components/block';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error('Failed to get user from database');
    throw error;
  }
}

export async function createUser(email: string, password: string) {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);

  try {
    return await db.insert(user).values({ email, password: hash });
  } catch (error) {
    console.error('Failed to create user in database');
    throw error;
  }
}

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
    });
  } catch (error) {
    console.error('Failed to save chat in database');
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));

    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error('Failed to delete chat by id from database');
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(chat)
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    console.error('Failed to get chats by user from database');
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

export async function saveMessages({ messages }: { messages: Array<Message> }) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error);
    throw error;
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    console.error('Failed to upvote message in database', error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    console.error('Failed to get votes by chat id from database', error);
    throw error;
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: BlockKind;
  content: string;
  userId: string;
}) {
  try {
    return await db.insert(document).values({
      id,
      title,
      kind,
      content,
      userId,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to save document in database');
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)));
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database',
    );
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    console.error('Failed to save suggestions in database');
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    console.error(
      'Failed to get suggestions by document version from database',
    );
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    console.error('Failed to get message by id from database');
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    return await db
      .delete(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );
  } catch (error) {
    console.error(
      'Failed to delete messages by id after timestamp from database',
    );
    throw error;
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    console.error('Failed to update chat visibility in database');
    throw error;
  }
}

export async function saveCompany({
  name,
  description,
  useCase,
  userId,
}: {
  name: string;
  description: string;
  useCase: string;
  userId: string;
}) {
  try {
    const now = new Date();
    return await db.insert(company).values({
      name,
      description,
      useCase,
      userId,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    console.error('Failed to save company in database');
    throw error;
  }
}

export async function getCompanyByUserId(userId: string): Promise<Company | undefined> {
  try {
    const [existingCompany] = await db
      .select()
      .from(company)
      .where(eq(company.userId, userId))
      .orderBy(desc(company.updatedAt))
      .limit(1);
    
    return existingCompany;
  } catch (error) {
    console.error('Failed to get company by user ID from database');
    throw error;
  }
}

export async function updateCompany({
  id,
  name,
  description,
  useCase,
}: {
  id: string;
  name: string;
  description: string;
  useCase: string;
}) {
  try {
    return await db
      .update(company)
      .set({
        name,
        description,
        useCase,
        updatedAt: new Date(),
      })
      .where(eq(company.id, id));
  } catch (error) {
    console.error('Failed to update company in database');
    throw error;
  }
}

// Agent queries
export async function createAgent({
  name,
  description,
  instructions,
  isActive,
  searchType,
  userId,
}: {
  name: string;
  description?: string;
  instructions: string;
  isActive: boolean;
  searchType: string;
  userId: string;
}) {
  try {
    const [agent] = await db
      .insert(agents)
      .values({
        name,
        description,
        instructions,
        isActive,
        searchType,
        userId,
      })
      .returning();
    
    return agent;
  } catch (error) {
    console.error('Error creating agent:', error);
    throw error;
  }
}

export async function getAgentsByUserId(userId: string) {
  try {
    return await db
      .select()
      .from(agents)
      .where(eq(agents.userId, userId))
      .orderBy(desc(agents.createdAt));
  } catch (error) {
    console.error('Error getting agents by user ID:', error);
    throw error;
  }
}

export async function getAgentById(id: string) {
  try {
    const [agent] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, id));
    
    return agent;
  } catch (error) {
    console.error('Error getting agent by ID:', error);
    throw error;
  }
}

export async function updateAgent({
  id,
  name,
  description,
  instructions,
  isActive,
  searchType,
}: {
  id: string;
  name?: string;
  description?: string;
  instructions?: string;
  isActive?: boolean;
  searchType?: string;
}) {
  try {
    const [agent] = await db
      .update(agents)
      .set({
        name,
        description,
        instructions,
        isActive,
        searchType,
        updatedAt: new Date(),
      })
      .where(eq(agents.id, id))
      .returning();
    
    return agent;
  } catch (error) {
    console.error('Error updating agent:', error);
    throw error;
  }
}

export async function deleteAgent(id: string) {
  try {
    const [agent] = await db
      .delete(agents)
      .where(eq(agents.id, id))
      .returning();
    
    return agent;
  } catch (error) {
    console.error('Error deleting agent:', error);
    throw error;
  }
}

// Account queries
export async function createAccount({
  name,
  website,
  industry,
  description,
  logo,
  userId,
}: {
  name: string;
  website: string;
  industry?: string;
  description?: string;
  logo?: string;
  userId: string;
}) {
  try {
    const now = new Date();
    const [account] = await db
      .insert(accounts)
      .values({
        name,
        website,
        industry,
        description,
        logo,
        userId,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return account;
  } catch (error) {
    console.error('Error creating account:', error);
    throw error;
  }
}

export async function getAccountsByUserId(userId: string) {
  try {
    return await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .orderBy(desc(accounts.createdAt));
  } catch (error) {
    console.error('Error getting accounts by user ID:', error);
    throw error;
  }
}

export async function getAccountById(id: string) {
  try {
    const [account] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, id));
    
    return account;
  } catch (error) {
    console.error('Error getting account by ID:', error);
    throw error;
  }
}

export async function updateAccount({
  id,
  name,
  website,
  industry,
  description,
  logo,
}: {
  id: string;
  name?: string;
  website?: string;
  industry?: string;
  description?: string;
  logo?: string;
}) {
  try {
    // First, check if the account exists and get current data
    const existingAccount = await getAccountById(id);
    
    if (!existingAccount) {
      throw new Error(`Account with ID ${id} not found`);
    }
    
    // Prepare update data, ensuring website is never set to null/undefined
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (name !== undefined) updateData.name = name;
    if (website !== undefined) updateData.website = website;
    if (industry !== undefined) updateData.industry = industry;
    if (description !== undefined) updateData.description = description;
    if (logo !== undefined) updateData.logo = logo;
    
    // Ensure website is never empty after update
    if (!updateData.website && !existingAccount.website) {
      throw new Error('Website URL is required');
    }
    
    const [account] = await db
      .update(accounts)
      .set(updateData)
      .where(eq(accounts.id, id))
      .returning();
    
    return account;
  } catch (error) {
    console.error('Error updating account:', error);
    throw error;
  }
}

export async function deleteAccount(id: string) {
  try {
    const [account] = await db
      .delete(accounts)
      .where(eq(accounts.id, id))
      .returning();
    
    return account;
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
}

export async function searchAccounts(query: string, userId: string) {
  try {
    return await db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.userId, userId),
          ilike(accounts.name, `%${query}%`)
        )
      )
      .orderBy(desc(accounts.createdAt))
      .limit(10);
  } catch (error) {
    console.error('Error searching accounts:', error);
    throw error;
  }
}

export async function getCompanyInfoByWebsite(website: string) {
  try {
    const [info] = await db
      .select()
      .from(companyInfo)
      .where(eq(companyInfo.website, website));
    
    return info || null;
  } catch (error) {
    console.error('Error getting company info by website:', error);
    throw error;
  }
}

export async function saveCompanyInfo({
  website,
  name,
  description,
  industry,
  products,
  uniqueFeatures,
}: {
  website: string;
  name: string;
  description: string;
  industry: string;
  products: string;
  uniqueFeatures: string;
}) {
  try {
    // Check if company info already exists
    const existingInfo = await getCompanyInfoByWebsite(website);
    
    if (existingInfo) {
      // Update existing record
      const [updated] = await db
        .update(companyInfo)
        .set({
          name,
          description,
          industry,
          products,
          uniqueFeatures,
          updatedAt: new Date(),
        })
        .where(eq(companyInfo.id, existingInfo.id))
        .returning();
      
      return updated;
    } else {
      // Create new record
      const [created] = await db
        .insert(companyInfo)
        .values({
          website,
          name,
          description,
          industry,
          products,
          uniqueFeatures,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      return created;
    }
  } catch (error) {
    console.error('Error saving company info:', error);
    throw error;
  }
}

export async function createAgentRun({
  agentId,
  accountId,
  chatId,
  userId,
  searchType,
}: {
  agentId: string;
  accountId: string;
  chatId: string;
  userId: string;
  searchType: string;
}) {
  try {
    const [agentRun] = await db
      .insert(agentRuns)
      .values({
        agentId,
        accountId,
        chatId,
        userId,
        searchType,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    return agentRun;
  } catch (error) {
    console.error('Error creating agent run:', error);
    throw error;
  }
}

export async function getAgentRunsByChatId(chatId: string) {
  try {
    return await db
      .select()
      .from(agentRuns)
      .where(eq(agentRuns.chatId, chatId));
  } catch (error) {
    console.error('Error getting agent run by chat ID:', error);
    throw error;
  }
}

export async function getAgentRunsByAccountId(accountId: string) {
  try {
    return await db
      .select()
      .from(agentRuns)
      .where(eq(agentRuns.accountId, accountId))
      .orderBy(desc(agentRuns.createdAt));
  } catch (error) {
    console.error('Error getting agent runs by account ID:', error);
    throw error;
  }
}

export async function getAgentRunsByAgentId(agentId: string) {
  try {
    return await db
      .select()
      .from(agentRuns)
      .where(eq(agentRuns.agentId, agentId))
      .orderBy(desc(agentRuns.createdAt));
  } catch (error) {
    console.error('Error getting agent runs by agent ID:', error);
    throw error;
  }
}

export async function updateAgentRunStatus({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  try {
    const [updated] = await db
      .update(agentRuns)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(agentRuns.id, id))
      .returning();
    
    return updated;
  } catch (error) {
    console.error('Error updating agent run status:', error);
    throw error;
  }
}
