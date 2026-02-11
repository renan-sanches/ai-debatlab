import { relations } from "drizzle-orm";
import { users, debates, rounds, responses, votes, userApiKeys, debateResults, modelStats, userFavoriteModels } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  debates: many(debates),
  apiKeys: many(userApiKeys),
  debateResults: many(debateResults),
  modelStats: many(modelStats),
  favoriteModels: many(userFavoriteModels),
}));

export const debatesRelations = relations(debates, ({ one, many }) => ({
  user: one(users, { fields: [debates.userId], references: [users.id] }),
  rounds: many(rounds),
  responses: many(responses),
  result: one(debateResults),
}));

export const roundsRelations = relations(rounds, ({ one, many }) => ({
  debate: one(debates, { fields: [rounds.debateId], references: [debates.id] }),
  responses: many(responses),
  votes: many(votes),
}));

export const responsesRelations = relations(responses, ({ one }) => ({
  round: one(rounds, { fields: [responses.roundId], references: [rounds.id] }),
  debate: one(debates, { fields: [responses.debateId], references: [debates.id] }),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  round: one(rounds, { fields: [votes.roundId], references: [rounds.id] }),
}));

export const userApiKeysRelations = relations(userApiKeys, ({ one }) => ({
  user: one(users, { fields: [userApiKeys.userId], references: [users.id] }),
}));

export const debateResultsRelations = relations(debateResults, ({ one }) => ({
  debate: one(debates, { fields: [debateResults.debateId], references: [debates.id] }),
  user: one(users, { fields: [debateResults.userId], references: [users.id] }),
}));

export const modelStatsRelations = relations(modelStats, ({ one }) => ({
  user: one(users, { fields: [modelStats.userId], references: [users.id] }),
}));

export const userFavoriteModelsRelations = relations(userFavoriteModels, ({ one }) => ({
  user: one(users, { fields: [userFavoriteModels.userId], references: [users.id] }),
}));
