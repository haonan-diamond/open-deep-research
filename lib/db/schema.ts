import { BLOCK_KINDS } from '@/components/block';
import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  primaryKey,
  foreignKey,
  boolean,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable('Chat', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title').notNull(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  visibility: varchar('visibility', { enum: ['public', 'private'] })
    .notNull()
    .default('private'),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable('Message', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  content: json('content').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type Message = InferSelectModel<typeof message>;

export const vote = pgTable(
  'Vote',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  'Document',
  {
    id: uuid('id').notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    kind: varchar('kind', { enum: ['text', 'code', 'spreadsheet'] })
      .notNull()
      .default('text'),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  },
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid('id').notNull().defaultRandom(),
    documentId: uuid('documentId').notNull(),
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  }),
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const company = pgTable('Company', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  useCase: text('useCase').notNull(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
});

export type Company = InferSelectModel<typeof company>;

export const agents = pgTable(
  'Agent',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    name: text('name').notNull(),
    description: text('description'),
    instructions: text('instructions').notNull(),
    isActive: boolean('isActive').default(true).notNull(),
    searchType: text('searchType').default('web-search').notNull(),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('Agent_userId_idx').on(table.userId),
  })
);

export const agentsRelations = relations(agents, ({ one }) => ({
  user: one(user, {
    fields: [agents.userId],
    references: [user.id],
  }),
}));

export type Agent = InferSelectModel<typeof agents>;

export const accounts = pgTable(
  'Account',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    name: text('name').notNull(),
    website: text('website').notNull(),
    industry: text('industry'),
    description: text('description'),
    logo: text('logo'),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('Account_userId_idx').on(table.userId),
    nameIdx: index('Account_name_idx').on(table.name),
    websiteIdx: index('Account_website_idx').on(table.website),
  })
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(user, {
    fields: [accounts.userId],
    references: [user.id],
  }),
}));

export type Account = InferSelectModel<typeof accounts>;

export const agentRuns = pgTable(
  'AgentRun',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    agentId: uuid('agentId')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    accountId: uuid('accountId')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id, { onDelete: 'cascade' }),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    searchType: text('searchType').notNull(),
    status: text('status').default('active').notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  },
  (table) => ({
    agentIdIdx: index('AgentRun_agentId_idx').on(table.agentId),
    accountIdIdx: index('AgentRun_accountId_idx').on(table.accountId),
    chatIdIdx: index('AgentRun_chatId_idx').on(table.chatId),
    userIdIdx: index('AgentRun_userId_idx').on(table.userId),
  })
);

export const agentRunsRelations = relations(agentRuns, ({ one }) => ({
  agent: one(agents, {
    fields: [agentRuns.agentId],
    references: [agents.id],
  }),
  account: one(accounts, {
    fields: [agentRuns.accountId],
    references: [accounts.id],
  }),
  chat: one(chat, {
    fields: [agentRuns.chatId],
    references: [chat.id],
  }),
  user: one(user, {
    fields: [agentRuns.userId],
    references: [user.id],
  }),
}));

export type AgentRun = InferSelectModel<typeof agentRuns>;

export const companyInfo = pgTable(
  'CompanyInfo',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    website: text('website').notNull().unique(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    industry: text('industry').notNull(),
    products: text('products').notNull(),
    uniqueFeatures: text('uniqueFeatures').notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  },
  (table) => ({
    websiteIdx: index('CompanyInfo_website_idx').on(table.website),
  })
);

export type CompanyInfo = InferSelectModel<typeof companyInfo>;
