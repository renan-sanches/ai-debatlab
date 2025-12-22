-- Performance Indexes Migration
-- Adds indexes for frequently queried columns

-- Index for debates by user and creation date (for library view)
CREATE INDEX IF NOT EXISTS idx_debates_user_created ON debates(userId, createdAt DESC);

-- Index for responses by round (for fetching round responses)
CREATE INDEX IF NOT EXISTS idx_responses_round ON responses(roundId);

-- Index for responses by debate (for batch fetching)
CREATE INDEX IF NOT EXISTS idx_responses_debate ON responses(debateId);

-- Index for votes by round (for fetching round votes)
CREATE INDEX IF NOT EXISTS idx_votes_round ON votes(roundId);

-- Index for model stats by user and model (for leaderboard lookups)
CREATE INDEX IF NOT EXISTS idx_model_stats_user_model ON modelStats(userId, modelId);

-- Index for debate results by user (for time-filtered leaderboards)
CREATE INDEX IF NOT EXISTS idx_debate_results_user_created ON debateResults(userId, createdAt DESC);

-- Index for user API keys lookup
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_provider ON userApiKeys(userId, provider);

-- Index for user favorite models
CREATE INDEX IF NOT EXISTS idx_user_favorite_models_user ON userFavoriteModels(userId);

-- Index for rounds by debate
CREATE INDEX IF NOT EXISTS idx_rounds_debate ON rounds(debateId);

