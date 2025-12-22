# AI DebateLab - Product Requirements Document (PRD)

**Version:** 1.1  
**Last Updated:** December 17, 2024  
**Status:** Production Ready

---

## Executive Summary

### Product Vision
AI DebateLab is a web application that orchestrates multi-AI debates where different language models (Claude, GPT, Gemini, Grok, and 300+ others) discuss questions and respond to each other's arguments in real-time. The platform enables users to get diverse AI perspectives on any topic, with built-in moderation, voting, and scoring systems to identify the strongest arguments.

### Target Users
- **Decision Makers** seeking multiple perspectives before making important choices
- **Researchers** comparing AI model capabilities and reasoning approaches
- **Educators** demonstrating different viewpoints on complex topics
- **Curious Minds** wanting to explore ideas through AI-powered discourse

### Value Proposition
> "Get practical answers from multiple AI perspectives. Ask a question, pick your AI panel, and get actionable insights."

---

## Product Concept

### Core Idea
Transform the traditional single-AI interaction into a dynamic roundtable discussion where multiple AI models debate, challenge, and build upon each other's arguments—providing users with richer, more nuanced insights than any single model could offer.

### Key Differentiators
1. **Multi-Model Orchestration** - Sequential responses where each AI sees and responds to previous arguments
2. **Devil's Advocate Mode** - Assign one AI to challenge consensus and argue contrarian positions
3. **Peer Voting System** - AIs vote on the strongest arguments from their peers
4. **Moderator Synthesis** - A designated AI evaluates all perspectives and provides actionable recommendations
5. **Competitive Scoring** - Point system and leaderboard tracking model performance over time

---

## Technical Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19 | UI framework with latest features |
| TypeScript | Type-safe development |
| Tailwind CSS 4 | Utility-first styling |
| shadcn/ui | Pre-built accessible components |
| Wouter | Lightweight routing |
| TanStack Query | Server state management |
| Framer Motion | Animations |
| Streamdown | Markdown rendering with streaming support |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime environment |
| Express 4 | HTTP server |
| tRPC 11 | End-to-end typesafe APIs |
| Drizzle ORM | Database queries and migrations |
| MySQL/TiDB | Relational database |
| Server-Sent Events (SSE) | Real-time response streaming |

### External Services
| Service | Purpose |
|---------|---------|
| OpenRouter API | Unified access to 300+ AI models |
| Anthropic API | Direct Claude model access |
| OpenAI API | Direct GPT model access |
| Google AI API | Direct Gemini model access |
| AWS S3 | File storage (images, audio, PDFs) |
| Whisper API | Voice-to-text transcription |
| Manus OAuth | User authentication |

### Development Tools
| Tool | Purpose |
|------|---------|
| Vite 7 | Build tool and dev server |
| Vitest | Unit testing framework |
| ESBuild | Production bundling |
| Drizzle Kit | Database migrations |

---

## Features & Functionality

### 1. Debate Setup

#### 1.1 Question Input
- **Text Input**: Large textarea for typing debate questions
- **Voice Input**: Microphone button for speech-to-text transcription
- **Image Upload**: Attach images for visual context in debates
- **Camera Capture**: Take photos directly for image-based discussions
- **PDF Upload**: Attach PDF documents (up to 20MB) for document-based discussions
- **Keyboard Shortcut**: Ctrl+Enter to start debate immediately
- **Auto-Start**: Debates begin immediately on submit (no confirmation needed)

#### 1.2 Model Selection
- **Quick Select Bubbles**: Top 6 leader models for fast selection
- **Browse All Models**: Modal with 312+ OpenRouter models
- **Provider Filtering**: Filter by Anthropic, OpenAI, Google, Meta, Mistral, xAI, etc.
- **Search**: Find models by name
- **Favorites System**: Heart models to add to quick select
- **Selection Limit**: 2-6 models per debate

#### 1.3 Moderator Selection
- Choose any leader model as debate moderator
- Moderator provides synthesis and actionable recommendations

#### 1.4 Optional Features
- **Devil's Advocate Mode**: Toggle to assign one AI as contrarian
- **AI Voting System**: Toggle to enable peer voting after each round

### 2. Debate Execution

#### 2.1 Response Generation
- **Sequential Processing**: Each AI responds in order, seeing previous responses
- **Real-time Streaming**: Responses appear word-by-word via SSE
- **Context Management**: Full conversation history passed to each model
- **Usage Tracking**: Token counts and cost estimates displayed

#### 2.2 Response Cards
- Model name with color-coded indicator
- Timestamp
- Devil's Advocate badge (🎭) when applicable
- Vote count display (🗳️)
- Collapsible content for long responses
- Markdown rendering

#### 2.3 Voting System
- Each AI votes for the strongest peer argument
- Vote reasoning captured and displayed
- Fallback retry if vote parsing fails
- Vote logging for debugging

#### 2.4 Moderator Analysis
- Summarizes key arguments from all participants
- Identifies strongest reasoning
- Provides actionable "What You Should Do" recommendations
- Suggests follow-up questions

### 3. Multi-Round Debates

#### 3.1 Follow-up Questions
- Continue debates with additional questions
- Full context from previous rounds preserved
- Round indicator displayed
- Moderator synthesis included in context

#### 3.2 Question Editing
- Edit question before responses start
- Pencil icon to enter edit mode
- Resubmit to regenerate responses

### 4. End Debate & Results

#### 4.1 Final Assessment
- "End Debate" button triggers final evaluation
- Moderator generates comprehensive summary
- Identifies strongest reasoning (Moderator's Top Pick)
- Ranks peer recognition by votes
- Provides synthesis/takeaway

#### 4.2 Results Display
```
📊 DEBATE RESULTS
🎯 Strongest Reasoning: [Model] (Moderator's assessment)
🗳️ Peer Recognition: [Model] (X votes), [Model] (Y votes)
💡 Synthesis: [Key takeaway]
```

#### 4.3 Points Awarded
- Moderator's Top Pick: 3 points
- Each Peer Vote: 1 point
- Mentioned in Strongest Arguments: 1 point
- Devil's Advocate Bonus: +1 point (if successfully challenged groupthink)

### 5. Leaderboard

#### 5.1 Main View
| Column | Description |
|--------|-------------|
| Rank | Position by total points |
| Model | Model name with color indicator |
| Points | Total accumulated points |
| Debates | Number of debates participated |
| Avg/PPD | Average points per debate |

#### 5.2 Time Filters
- All-time
- Last 30 days
- This week
- Last 10 debates

#### 5.3 Performance Breakdown
- Moderator Picks count and percentage
- Total Peer Votes received
- Strong Arguments mentions
- Devil's Advocate Wins
- Recent Form (+X points in last 3 debates)

#### 5.4 Head-to-Head Comparison
- Select two models to compare
- Debates together count
- Moderator picks when both participate
- Peer votes when both participate
- Points when both participate

### 6. Debate Library

#### 6.1 Browse Past Debates
- List view with question preview
- Participant model icons
- Timestamp and round count
- Tags for categorization

#### 6.2 Debate Management
- Load saved debate to continue
- Delete debates
- Search and filter

### 7. Export

#### 7.1 Markdown Export
- Full debate transcript
- All responses with model attribution
- Voting results
- Moderator synthesis
- Timestamps

### 8. Settings

#### 8.1 API Key Management
- Add/remove API keys for:
  - OpenRouter (access to all models)
  - Anthropic (direct Claude access)
  - OpenAI (direct GPT access)
  - Google AI (direct Gemini access)
- Secure encrypted storage
- Provider status indicators

#### 8.2 Billing Options
- Use default platform billing
- Toggle to use personal API keys

---

## Data Model

### Core Entities

#### Users
```typescript
{
  id: number,
  openId: string,        // OAuth identifier
  name: string,
  email: string,
  role: 'user' | 'admin',
  createdAt: timestamp,
  lastSignedIn: timestamp
}
```

#### Debates
```typescript
{
  id: number,
  userId: number,
  question: string,
  title: string,
  imageUrl: string | null,
  pdfUrl: string | null,          // PDF document URL
  participantModels: string[],    // JSON array
  moderatorModel: string,
  devilsAdvocateModel: string | null,
  votingEnabled: boolean,
  status: 'active' | 'completed',
  tags: string | null,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### Debate Rounds
```typescript
{
  id: number,
  debateId: number,
  roundNumber: number,
  question: string,
  moderatorSynthesis: string | null,
  createdAt: timestamp
}
```

#### Debate Responses
```typescript
{
  id: number,
  roundId: number,
  modelId: string,
  content: string,
  isDevilsAdvocate: boolean,
  votesReceived: number,
  voteReason: string | null,
  tokenCount: number | null,
  createdAt: timestamp
}
```

#### Debate Results
```typescript
{
  id: number,
  debateId: number,
  moderatorTopPick: string,
  peerVotes: JSON,           // {modelId: voteCount}
  strongestArguments: JSON,  // [modelIds]
  devilsAdvocateSuccess: boolean,
  pointsAwarded: JSON,       // {modelId: {total, breakdown}}
  finalAssessment: string,
  createdAt: timestamp
}
```

#### Model Stats
```typescript
{
  id: number,
  modelId: string,
  totalPoints: number,
  debateCount: number,
  moderatorPicks: number,
  peerVotes: number,
  strongArguments: number,
  devilsAdvocateWins: number,
  updatedAt: timestamp
}
```

#### User API Keys
```typescript
{
  id: number,
  userId: number,
  provider: 'openrouter' | 'anthropic' | 'openai' | 'google',
  encryptedKey: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### User Favorite Models
```typescript
{
  id: number,
  userId: number,
  modelId: string,
  createdAt: timestamp
}
```

---

## API Endpoints

### Debates
| Endpoint | Method | Description |
|----------|--------|-------------|
| `debate.create` | Mutation | Create new debate |
| `debate.get` | Query | Get debate by ID |
| `debate.list` | Query | List user's debates |
| `debate.update` | Mutation | Update debate (question, title) |
| `debate.delete` | Mutation | Delete debate |
| `debate.generateResponses` | Mutation | Generate AI responses for round |
| `debate.generateVotes` | Mutation | Generate peer votes |
| `debate.generateModeratorAnalysis` | Mutation | Generate moderator synthesis |
| `debate.endDebate` | Mutation | End debate and calculate results |
| `debate.export` | Query | Export debate as markdown |

### Models
| Endpoint | Method | Description |
|----------|--------|-------------|
| `models.list` | Query | List all available models |
| `models.leaders` | Query | Get leader models for quick select |
| `models.available` | Query | Get models available to user |
| `models.openRouter` | Query | Fetch full OpenRouter model list |

### Favorites
| Endpoint | Method | Description |
|----------|--------|-------------|
| `models.favorites.list` | Query | Get user's favorite models |
| `models.favorites.add` | Mutation | Add model to favorites |
| `models.favorites.remove` | Mutation | Remove model from favorites |

### API Keys
| Endpoint | Method | Description |
|----------|--------|-------------|
| `apiKeys.list` | Query | List user's configured providers |
| `apiKeys.set` | Mutation | Add/update API key |
| `apiKeys.delete` | Mutation | Remove API key |

### Leaderboard
| Endpoint | Method | Description |
|----------|--------|-------------|
| `leaderboard.get` | Query | Get leaderboard with filters |
| `leaderboard.getModelStats` | Query | Get detailed stats for model |
| `leaderboard.headToHead` | Query | Compare two models |

### Voice
| Endpoint | Method | Description |
|----------|--------|-------------|
| `voice.transcribe` | Mutation | Transcribe audio to text |

### Streaming (REST)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stream/response` | POST | Stream AI response via SSE |

---

## User Flows

### Flow 1: Start a New Debate
1. User lands on home page
2. Types question (or uses voice input)
3. Optionally uploads image or PDF document
4. Selects 2-6 AI models from quick select or browser
5. Chooses moderator model
6. Optionally enables Devil's Advocate and/or Voting
7. Presses Ctrl+Enter or clicks Start (auto-starts immediately)
8. Redirected to debate page
9. Watches responses stream in real-time
10. Reviews moderator analysis
11. Optionally asks follow-up questions
12. Ends debate to see final results and points

### Flow 2: Browse Leaderboard
1. User clicks Leaderboard in nav
2. Views all-time rankings
3. Applies time filter (30 days, week, etc.)
4. Clicks model for performance breakdown
5. Selects two models for head-to-head comparison

### Flow 3: Continue Past Debate
1. User clicks Library in nav
2. Browses past debates
3. Clicks debate to view
4. Clicks "Continue Debate" to add follow-up
5. New round generated with full context

---

## Non-Functional Requirements

### Performance
- Response streaming latency < 500ms
- Page load time < 2 seconds
- Support 100+ concurrent debates

### Security
- API keys encrypted at rest
- OAuth-based authentication
- HTTPS only
- Input sanitization

### Accessibility
- Keyboard navigation support
- Screen reader compatible
- Color contrast compliance
- Focus indicators

### Responsiveness
- Desktop-first design (optimized for reading)
- Tablet support
- Mobile-friendly (limited features)

---

## Future Roadmap

### Phase 2 (Planned)
- [ ] PDF export with formatting
- [ ] Debate templates (preset questions by category)
- [ ] Model performance badges on selection cards
- [ ] Response regeneration (retry individual responses)
- [ ] Keyboard shortcuts guide
- [ ] Model comparison charts on leaderboard

### Phase 3 (Considered)
- [ ] Public debate sharing
- [ ] Debate embedding
- [ ] Team/organization accounts
- [ ] Custom model personas
- [ ] Debate tournaments

---

## Appendix

### Supported AI Models (Top Tier)
| Model | Provider | Strengths |
|-------|----------|-----------|
| Claude Sonnet 4.5 | Anthropic | Balanced reasoning |
| Claude Opus 4.5 | Anthropic | Deep analysis |
| GPT-5.2 | OpenAI | Broad knowledge |
| GPT-4o | OpenAI | Fast, multimodal |
| Gemini 3 Pro | Google | Technical depth |
| Grok 3 | xAI | Real-time knowledge |
| DeepSeek R1 | DeepSeek | Reasoning chains |
| Llama 4 Maverick | Meta | Open-source leader |
| Mistral Large | Mistral | European perspective |
| Qwen Max | Alibaba | Multilingual |

### Point System Summary
| Achievement | Points |
|-------------|--------|
| Moderator's Top Pick | 3 |
| Each Peer Vote | 1 |
| Mentioned in Strongest Arguments | 1 |
| Devil's Advocate Success | +1 |

---

*Document prepared for AI DebateLab v1.0*
