import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Debates table - stores the main debate configuration and metadata
 */
export const debates = mysqlTable("debates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  question: text("question").notNull(),
  participantModels: json("participantModels").$type<string[]>().notNull(),
  moderatorModel: varchar("moderatorModel", { length: 64 }).notNull(),
  devilsAdvocateEnabled: boolean("devilsAdvocateEnabled").default(false).notNull(),
  devilsAdvocateModel: varchar("devilsAdvocateModel", { length: 64 }),
  votingEnabled: boolean("votingEnabled").default(false).notNull(),
  status: mysqlEnum("status", ["active", "completed", "archived"]).default("active").notNull(),
  title: varchar("title", { length: 255 }),
  tags: json("tags").$type<string[]>().default([]),
  imageUrl: text("imageUrl"),
  pdfUrl: text("pdfUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Debate = typeof debates.$inferSelect;
export type InsertDebate = typeof debates.$inferInsert;

/**
 * Rounds table - stores each round of the debate
 */
export const rounds = mysqlTable("rounds", {
  id: int("id").autoincrement().primaryKey(),
  debateId: int("debateId").notNull(),
  roundNumber: int("roundNumber").notNull(),
  followUpQuestion: text("followUpQuestion"),
  moderatorSynthesis: text("moderatorSynthesis"),
  suggestedFollowUp: text("suggestedFollowUp"),
  status: mysqlEnum("status", ["in_progress", "awaiting_moderator", "completed"]).default("in_progress").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Round = typeof rounds.$inferSelect;
export type InsertRound = typeof rounds.$inferInsert;

/**
 * Responses table - stores individual AI responses
 */
export const responses = mysqlTable("responses", {
  id: int("id").autoincrement().primaryKey(),
  roundId: int("roundId").notNull(),
  debateId: int("debateId").notNull(),
  modelId: varchar("modelId", { length: 64 }).notNull(),
  modelName: varchar("modelName", { length: 128 }).notNull(),
  content: text("content").notNull(),
  isDevilsAdvocate: boolean("isDevilsAdvocate").default(false).notNull(),
  responseOrder: int("responseOrder").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Response = typeof responses.$inferSelect;
export type InsertResponse = typeof responses.$inferInsert;

/**
 * Votes table - stores voting results when voting is enabled
 */
export const votes = mysqlTable("votes", {
  id: int("id").autoincrement().primaryKey(),
  roundId: int("roundId").notNull(),
  voterModelId: varchar("voterModelId", { length: 64 }).notNull(),
  votedForModelId: varchar("votedForModelId", { length: 64 }).notNull(),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Vote = typeof votes.$inferSelect;
export type InsertVote = typeof votes.$inferInsert;

/**
 * User API Keys table - stores user-provided API keys for different providers
 */
export const userApiKeys = mysqlTable("userApiKeys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  provider: mysqlEnum("provider", ["openrouter", "anthropic", "openai", "google"]).notNull(),
  apiKey: text("apiKey").notNull(), // Encrypted in application layer
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserApiKey = typeof userApiKeys.$inferSelect;
export type InsertUserApiKey = typeof userApiKeys.$inferInsert;

/**
 * Debate Results table - stores final results and points after debate ends
 */
export const debateResults = mysqlTable("debateResults", {
  id: int("id").autoincrement().primaryKey(),
  debateId: int("debateId").notNull().unique(),
  userId: int("userId").notNull(),
  
  // Final assessment from moderator
  finalAssessment: text("finalAssessment"),
  synthesis: text("synthesis"),
  
  // Winner information
  moderatorTopPick: varchar("moderatorTopPick", { length: 64 }),
  moderatorReasoning: text("moderatorReasoning"),
  
  // Voting results: { modelId: voteCount }
  peerVotes: json("peerVotes").$type<Record<string, number>>().default({}),
  
  // Models mentioned in strongest arguments
  strongestArguments: json("strongestArguments").$type<string[]>().default([]),
  
  // Devil's advocate success (if applicable)
  devilsAdvocateSuccess: boolean("devilsAdvocateSuccess").default(false),
  
  // Points awarded: { modelId: { total, breakdown } }
  pointsAwarded: json("pointsAwarded").$type<Record<string, {
    total: number;
    moderatorPick: number;
    peerVotes: number;
    strongArguments: number;
    devilsAdvocateBonus: number;
  }>>().default({}),
  
  // Metadata
  roundCount: int("roundCount").default(1).notNull(),
  topicTags: json("topicTags").$type<string[]>().default([]),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DebateResult = typeof debateResults.$inferSelect;
export type InsertDebateResult = typeof debateResults.$inferInsert;

/**
 * Model Stats table - aggregated stats for leaderboard
 */
export const modelStats = mysqlTable("modelStats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  modelId: varchar("modelId", { length: 64 }).notNull(),
  
  // Aggregate stats
  totalPoints: int("totalPoints").default(0).notNull(),
  totalDebates: int("totalDebates").default(0).notNull(),
  moderatorPicks: int("moderatorPicks").default(0).notNull(),
  totalPeerVotes: int("totalPeerVotes").default(0).notNull(),
  strongArgumentMentions: int("strongArgumentMentions").default(0).notNull(),
  devilsAdvocateWins: int("devilsAdvocateWins").default(0).notNull(),
  
  // Recent form (points in last 3 debates)
  recentPoints: int("recentPoints").default(0).notNull(),
  
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ModelStat = typeof modelStats.$inferSelect;
export type InsertModelStat = typeof modelStats.$inferInsert;

/**
 * User Favorite Models table - stores user's favorite models for quick selection
 */
export const userFavoriteModels = mysqlTable("userFavoriteModels", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  openRouterId: varchar("openRouterId", { length: 128 }).notNull(),
  modelName: varchar("modelName", { length: 256 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserFavoriteModel = typeof userFavoriteModels.$inferSelect;
export type InsertUserFavoriteModel = typeof userFavoriteModels.$inferInsert;
