import { serial, pgEnum, pgTable, text, timestamp, varchar, boolean, json, integer } from "drizzle-orm/pg-core";

/**
 * Enums for PostgreSQL
 */
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const debateStatusEnum = pgEnum("debate_status", ["active", "completed", "archived"]);
export const roundStatusEnum = pgEnum("round_status", ["in_progress", "awaiting_moderator", "completed"]);
export const providerEnum = pgEnum("provider", ["openrouter", "anthropic", "openai", "google"]);

/**
 * Core user table backing auth flow.
 * Note: Uses Supabase Auth user ID as the primary identifier
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  supabaseId: varchar("supabase_id", { length: 64 }).notNull().unique(), // Supabase Auth user ID
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("login_method", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Debates table - stores the main debate configuration and metadata
 */
export const debates = pgTable("debates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  question: text("question").notNull(),
  participantModels: json("participant_models").$type<string[]>().notNull(),
  moderatorModel: varchar("moderator_model", { length: 64 }).notNull(),
  devilsAdvocateEnabled: boolean("devils_advocate_enabled").default(false).notNull(),
  devilsAdvocateModel: varchar("devils_advocate_model", { length: 64 }),
  votingEnabled: boolean("voting_enabled").default(false).notNull(),
  status: debateStatusEnum("status").default("active").notNull(),
  title: varchar("title", { length: 255 }),
  tags: json("tags").$type<string[]>().default([]),
  imageUrl: text("image_url"),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Debate = typeof debates.$inferSelect;
export type InsertDebate = typeof debates.$inferInsert;

/**
 * Rounds table - stores each round of the debate
 */
export const rounds = pgTable("rounds", {
  id: serial("id").primaryKey(),
  debateId: integer("debate_id").notNull(),
  roundNumber: integer("round_number").notNull(),
  followUpQuestion: text("follow_up_question"),
  moderatorSynthesis: text("moderator_synthesis"),
  suggestedFollowUp: text("suggested_follow_up"),
  status: roundStatusEnum("status").default("in_progress").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Round = typeof rounds.$inferSelect;
export type InsertRound = typeof rounds.$inferInsert;

/**
 * Responses table - stores individual AI responses
 */
export const responses = pgTable("responses", {
  id: serial("id").primaryKey(),
  roundId: integer("round_id").notNull(),
  debateId: integer("debate_id").notNull(),
  modelId: varchar("model_id", { length: 64 }).notNull(),
  modelName: varchar("model_name", { length: 128 }).notNull(),
  content: text("content").notNull(),
  isDevilsAdvocate: boolean("is_devils_advocate").default(false).notNull(),
  responseOrder: integer("response_order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Response = typeof responses.$inferSelect;
export type InsertResponse = typeof responses.$inferInsert;

/**
 * Votes table - stores voting results when voting is enabled
 */
export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  roundId: integer("round_id").notNull(),
  voterModelId: varchar("voter_model_id", { length: 64 }).notNull(),
  votedForModelId: varchar("voted_for_model_id", { length: 64 }).notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Vote = typeof votes.$inferSelect;
export type InsertVote = typeof votes.$inferInsert;

/**
 * User API Keys table - stores user-provided API keys for different providers
 */
export const userApiKeys = pgTable("user_api_keys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  provider: providerEnum("provider").notNull(),
  apiKey: text("api_key").notNull(), // Encrypted in application layer
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UserApiKey = typeof userApiKeys.$inferSelect;
export type InsertUserApiKey = typeof userApiKeys.$inferInsert;

/**
 * Debate Results table - stores final results and points after debate ends
 */
export const debateResults = pgTable("debate_results", {
  id: serial("id").primaryKey(),
  debateId: integer("debate_id").notNull().unique(),
  userId: integer("user_id").notNull(),
  
  // Final assessment from moderator
  finalAssessment: text("final_assessment"),
  synthesis: text("synthesis"),
  
  // Winner information
  moderatorTopPick: varchar("moderator_top_pick", { length: 64 }),
  moderatorReasoning: text("moderator_reasoning"),
  
  // Voting results: { modelId: voteCount }
  peerVotes: json("peer_votes").$type<Record<string, number>>().default({}),
  
  // Models mentioned in strongest arguments
  strongestArguments: json("strongest_arguments").$type<string[]>().default([]),
  
  // Devil's advocate success (if applicable)
  devilsAdvocateSuccess: boolean("devils_advocate_success").default(false),
  
  // Points awarded: { modelId: { total, breakdown } }
  pointsAwarded: json("points_awarded").$type<Record<string, {
    total: number;
    moderatorPick: number;
    peerVotes: number;
    strongArguments: number;
    devilsAdvocateBonus: number;
  }>>().default({}),
  
  // Metadata
  roundCount: integer("round_count").default(1).notNull(),
  topicTags: json("topic_tags").$type<string[]>().default([]),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type DebateResult = typeof debateResults.$inferSelect;
export type InsertDebateResult = typeof debateResults.$inferInsert;

/**
 * Model Stats table - aggregated stats for leaderboard
 */
export const modelStats = pgTable("model_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  modelId: varchar("model_id", { length: 64 }).notNull(),
  
  // Aggregate stats
  totalPoints: integer("total_points").default(0).notNull(),
  totalDebates: integer("total_debates").default(0).notNull(),
  moderatorPicks: integer("moderator_picks").default(0).notNull(),
  totalPeerVotes: integer("total_peer_votes").default(0).notNull(),
  strongArgumentMentions: integer("strong_argument_mentions").default(0).notNull(),
  devilsAdvocateWins: integer("devils_advocate_wins").default(0).notNull(),
  
  // Recent form (points in last 3 debates)
  recentPoints: integer("recent_points").default(0).notNull(),
  
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ModelStat = typeof modelStats.$inferSelect;
export type InsertModelStat = typeof modelStats.$inferInsert;

/**
 * User Favorite Models table - stores user's favorite models for quick selection
 */
export const userFavoriteModels = pgTable("user_favorite_models", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  openRouterId: varchar("open_router_id", { length: 128 }).notNull(),
  modelName: varchar("model_name", { length: 256 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type UserFavoriteModel = typeof userFavoriteModels.$inferSelect;
export type InsertUserFavoriteModel = typeof userFavoriteModels.$inferInsert;
