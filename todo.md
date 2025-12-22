# AI DebateLab - Project TODO

## Core Features
- [x] Database schema for debates, rounds, and responses
- [x] Multi-AI debate orchestration with sequential API calls
- [x] Model selection UI (Claude, GPT-4, Gemini via OpenRouter)
- [x] Moderator AI selection dropdown
- [x] Devil's Advocate Mode toggle with model selector
- [x] AI Voting System toggle
- [x] Response cards with model name/icon, timestamp, indicators
- [x] Moderator synthesis section with distinct styling
- [x] Multi-round debate support with follow-up questions
- [x] Context management across rounds
- [x] Export debate as Markdown
- [ ] Export debate as PDF

## UI Components
- [x] Clean debate setup interface
- [x] Question input field
- [x] Model selection checkboxes with logos
- [x] Settings toggles (Devil's Advocate, Voting)
- [x] Start Debate button
- [x] Vertical conversation flow layout
- [x] AI response cards with collapsible content
- [x] Devil's advocate indicator (🎭)
- [x] Vote count display (🗳️)
- [x] Show Moderator Analysis button
- [x] Ask Follow-up Question button
- [x] Round indicator

## API Integration
- [x] OpenRouter API integration for multi-model support
- [x] Sequential API call orchestration
- [x] Context building for each AI response
- [x] Voting prompt implementation
- [x] Moderator prompt implementation
- [x] Standard participant prompt
- [x] Devil's advocate participant prompt

## State Management
- [x] Current question state
- [x] Round number tracking
- [x] Selected participant models
- [x] Selected moderator model
- [x] Devil's advocate settings
- [x] Voting enabled state
- [x] All responses in conversation
- [x] Moderator synthesis storage
- [x] Voting results tracking

## Voice-to-Text Feature
- [x] Audio recording component with microphone button
- [x] Speech-to-text transcription integration
- [x] Voice input for debate questions
- [x] Voice input for follow-up questions

## Debate Library Feature
- [x] Save debates to database with timestamps
- [x] Tag debates by topic/category
- [x] Library view to browse past debates
- [x] Load saved debate to continue in new rounds
- [x] Delete/archive debates

## Model Updates & OpenRouter Integration
- [x] Update to latest models: GPT-5.2, Claude Sonnet 4.5, Claude Opus 4.5, Gemini 3 Pro
- [x] Add OpenRouter API key input for user-provided billing
- [x] Support direct API keys for Anthropic, OpenAI, Google
- [x] Allow users to select API provider (OpenRouter vs direct)

## Advanced Features
- [x] Wire user API keys to LLM calls for user billing
- [x] Filter models by configured API provider keys
- [x] Add usage tracking with token counts and cost estimates
- [x] Complete voice-to-text with audio upload and transcription

## Response Streaming Feature
- [x] Implement streaming LLM API calls with SSE support
- [x] Create streaming endpoint for debate responses
- [x] Update frontend to consume SSE stream
- [x] Display responses word-by-word as they arrive
- [x] Handle streaming errors gracefully
- [x] Maintain usage tracking with streaming responses

## Bug Fixes & Improvements (User Feedback)
- [x] Fix Gemini voting issue - ensure all models can vote properly
- [x] Add more OpenRouter models: Grok, Minimax, DeepSeek, Qwen, etc.
- [x] Auto-start debate on question submit (no confirmation needed)
- [x] Add ability to edit question and resubmit
- [x] Update moderator prompts to provide actionable guidance, not just summaries
- [x] Make AI responses more practical and informal (plain language, actionable advice)
- [x] Add image upload support for visual debates
- [x] Add camera/picture capture support

## Voting Improvements
- [x] Add fallback voting - retry with stricter format if parsing fails
- [x] Add vote logging - log raw vote responses for debugging
- [x] Show vote reasoning in UI - display each model's voting rationale

## End Debate Feature
- [x] Add "End Debate" button
- [x] Generate final assessment summarizing all moderator responses
- [x] Determine winner(s) based on votes and moderator assessment
- [x] Display debate results with:
  - Voting results breakdown
  - Moderator's assessment
  - Strongest reasoning winner
  - Peer recognition winners
  - Synthesis of key takeaways

## Point System
- [x] Moderator's Top Pick: 3 points
- [x] Each Peer Vote: 1 point
- [x] Mentioned in Strongest Arguments: 1 point
- [x] Devil's Advocate Bonus: +1 point if successfully challenged groupthink
- [x] Store points breakdown per debate

## Leaderboard Feature
- [x] Create debateResults table for storing results and points
- [x] Main leaderboard view with Rank, Model, Points, Debates, Avg/PPD
- [x] Time-based filters: All-time, Last 30 days, Last 10 debates, This week
- [x] Performance breakdown per model (moderator picks %, peer votes, strong arguments, DA wins)
- [x] Head-to-head records between models
- [x] Recent form indicator (+X points in last 3 debates)

## UI Updates
- [x] Points Awarded card after debate ends
- [x] Add Leaderboard to main navigation
- [x] Update nav: Start New Debate, Leaderboard, Past Debates

## Model Selection Improvements (COMPLETED)
- [x] Fetch full OpenRouter model list (160+ models with text/image support)
- [x] Deduplicate models to show one per model family (e.g., gpt-5.2, gpt-4o, not all variants)
- [x] Create "leader" models as quick-select suggestion bubbles
- [x] Add full model dropdown/modal for selecting additional models
- [x] Implement favorites system - heart/unheart models
- [x] Store user favorites in database
- [x] Show favorited models in quick-select bubbles alongside leaders
- [x] Filter models by capability (text, image, etc.)

## Bug Fixes
- [x] Fix SSE streaming errors on debate page (fixed getModelById for dynamic models)
- [x] Fix model ID to OpenRouter ID conversion (now handles both internal ID and OpenRouter ID formats)
- [x] Fix Devil's Advocate dropdown selection not working (fixed ID format mismatch)
- [x] Add PDF input support for debate questions (upload PDF for AI panel to discuss)
- [x] Fix PDF content not being passed to AI models (PDF now included as multimodal file_url content)
- [x] Extract PDF text content and include directly in prompts (file_url not supported by all providers)
- [x] Set voting enabled to YES by default
