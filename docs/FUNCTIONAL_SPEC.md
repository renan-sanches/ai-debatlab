# AI DebateLab - Functional Specification

**Version:** 1.0
**Generated:** February 2025
**Purpose:** Detailed functional breakdown of the AI DebateLab application, capturing current implementation state and intended user experience.

---

## 1. Introduction

AI DebateLab is a multi-model orchestration platform designed to facilitate structured debates between various Large Language Models (LLMs). It allows users to pose complex questions and observe how different AI personas (Claude, GPT, Gemini, etc.) reason, challenge each other, and build consensus.

The core value proposition is **comparative reasoning**: instead of relying on a single AI's output, users can triangulate the truth by watching multiple top-tier models debate a topic in real-time, moderated by a synthesizer AI.

---

## 2. Application Navigation & Structure

The application follows a dashboard layout with a persistent sidebar (or top navigation on mobile) providing access to key functional areas:

*   **Dashboard (Home)**: The starting point for creating new debates.
*   **Library (History)**: Archive of past debate sessions.
*   **Leaderboard**: Global rankings and performance metrics of AI models.
*   **Settings**: API key management and configuration.
*   **Account**: User profile and personal usage statistics.

---

## 3. Feature Breakdown by Page

### 3.1. Dashboard (Home) - Debate Creation

The Dashboard is the primary interface for initiating new debate sessions.

**Key Functionalities:**

1.  **Topic Input**:
    *   **Text Area**: A large input field for the debate question or topic.
    *   **Keyboard Shortcut**: `Ctrl+Enter` (or `Cmd+Enter`) triggers the debate start immediately.
    *   **Placeholder Prompts**: Dynamic suggestions to guide users (e.g., "The impact of AI on creative industries").

2.  **Model Selection Panel**:
    *   **Quick Select**: Bubbles for popular "Leader" models (e.g., GPT-4o, Claude 3.5 Sonnet) for one-click addition.
    *   **Full Browser**: A modal or dropdown to access the full OpenRouter catalog (300+ models).
    *   **Selection Logic**: Users must select between 2 and 6 participants.
    *   **Filtering**: Models can be filtered by provider (Anthropic, OpenAI, Google, etc.).

3.  **Context Uploads (Multimodal Input)**:
    *   **Image Upload**: Users can upload an image file (JPG, PNG) to ground the debate in visual context.
    *   **PDF Upload**: Users can upload a PDF document (e.g., a research paper or contract) for the AI panel to analyze and discuss.

4.  **Advanced Settings (Collapsible)**:
    *   **Moderator Selection (Required)**: A specific dropdown to choose the AI model that will oversee the debate, synthesize arguments, and keep the discussion on track. *Note: The system enforces a moderator selection before starting.*
    *   **Devil's Advocate Mode**:
        *   **Toggle**: Enable/Disable.
        *   **Model Selection**: Assign a specific model to aggressively challenge the consensus or popular opinion.
    *   **Voting System**:
        *   **Toggle**: Enable/Disable peer voting.
        *   **Function**: When enabled, models will cast votes for the strongest argument in each round.
    *   **Blind Mode**:
        *   **Toggle**: Enable/Disable.
        *   **Function**: When enabled, participants in the same round cannot see each other's responses until the round is complete, preventing "groupthink" or anchoring bias.

5.  **Action Bar**:
    *   **Start Debate**: Commits the configuration and redirects the user to the Debate Workspace.

---

### 3.2. Debate Workspace (The Arena)

This is the core interactive view where the debate unfolds.

**Key Functionalities:**

1.  **Real-Time Execution**:
    *   **Sequential Processing**: The backend orchestrates calls to each selected model in turn.
    *   **Streaming Responses**: Text appears token-by-token (via Server-Sent Events) to reduce perceived latency.
    *   **Status Indicators**: Visual cues for which model is "Thinking", "Speaking", or "Waiting".

2.  **Response Cards**:
    *   **Identity**: Displays the model's name and avatar.
    *   **Content**: Markdown-rendered text of the argument.
    *   **Metadata**: Timestamps, token usage (internal tracking), and special badges (e.g., "Devil's Advocate 🎭").
    *   **Voting Results**: If voting is enabled, badges show how many peers voted for this specific argument (e.g., "🗳️ 2 votes").
    *   **Scoring**: A numerical score (1-10) assigned by the Moderator (implied feature, visualized in UI).

3.  **Moderator Synthesis**:
    *   **Summary Block**: A distinct section at the end of each round where the Moderator model summarizes the key points, conflicts, and consensus.
    *   **Strategic Direction**: The Moderator suggests a follow-up question or direction for the next round.

4.  **Visual Dialectic Map**:
    *   **Tree View**: A visualization (likely in the sidebar) showing the branching structure of the conversation—Rounds, Responses, and Synthesis nodes.
    *   **Navigation**: Clicking a node scrolls the main view to that specific response.

5.  **Discourse Analytics**:
    *   **Live Widget**: Displays real-time metrics for the current round (e.g., "Consensus Level", "Conflict Intensity", "Information Density").

6.  **User Interaction (Round Control)**:
    *   **Follow-Up Input**: A text field at the bottom allowing the user to:
        *   Ask a custom follow-up question.
        *   Accept the Moderator's suggested follow-up.
    *   **Start Next Round**: Triggers the next cycle of responses based on the new context.
    *   **End Debate**: Manually concludes the session, triggering the final assessment.

7.  **Export**:
    *   **PDF Export**: Generates a downloadable PDF transcript of the entire debate, including metadata and synthesis.

---

### 3.3. Library (History)

A repository of all past debate sessions.

**Key Functionalities:**

1.  **Debate List**:
    *   **Cards**: Display debate topic/question, date, participants (icons), and status (Active/Completed).
    *   **Outcome Indicators**: Visual cues for the "Winner" or "Consensus" if the debate concluded.
    *   **Executive Summary**: A brief snippet of the final result or consensus.

2.  **Management**:
    *   **Search**: Filter debates by keyword (topic, model name, tags).
    *   **Resume**: Quickly jump back into an "Active" debate.
    *   **Review**: Read the transcript of a "Completed" debate.
    *   **Delete**: Permanently remove a debate session.

---

### 3.4. Leaderboard (Stats)

A gamified view of AI model performance based on "Elo" ratings and aggregated stats.

**Key Functionalities:**

1.  **Rankings Table**:
    *   **Columns**: Rank, Model Name, Elo Points, Total Engagements (Debates), Efficiency (Points Per Debate).
    *   **Time Filters**: "All Time", "Last 30 Days", "This Week", "Last 10 Sessions".

2.  **Detailed Breakdown (Drill-Down)**:
    *   **Model Profile**: Select a specific model to see detailed stats.
    *   **Metrics**:
        *   **Moderator Pick Rate**: How often the moderator chose this model as the winner.
        *   **Peer Consensus**: Total votes received from other models.
        *   **Strong Argument Index**: Frequency of high-quality reasoning.

3.  **Head-to-Head Comparison**:
    *   **Selector**: Choose two models (e.g., GPT-4o vs. Claude 3.5).
    *   **Comparison**: Side-by-side stats on win rate, peer votes, and points when both participated in the same debate.

---

### 3.5. Settings & Account

Configuration for the application and user identity.

**Key Functionalities:**

1.  **API Key Management**:
    *   **Provider Support**: Explicit support for **OpenRouter**, **Anthropic**, **OpenAI**, and **Google**.
    *   **Security**: Keys are encrypted at rest.
    *   **Validation**: System verifies keys upon entry.
    *   **Billing Control**: Users can toggle between platform-provided billing (if applicable) and their own API keys.

2.  **Account Profile**:
    *   **Identity**: Name, Email, Member Since date.
    *   **Usage Stats**: Total sessions, active debates, archived debates.
    *   **Account Type**: (e.g., "User" or "Admin").

---

## 4. Technical Architecture Overview

*   **Frontend**: Built with **React 19**, **Vite**, and **Tailwind CSS**. It uses **Radix UI** primitives for accessibility and **Framer Motion** for animations.
*   **Backend**: A **Node.js** server running **Express** and **tRPC**. It handles the complex orchestration of sequential AI calls.
*   **Database**: **PostgreSQL** (accessed via **Drizzle ORM**) stores user data, debate history, and vector embeddings (implied for future search/RAG).
*   **AI Integration**: The system primarily uses **OpenRouter** as a unified gateway to access a wide variety of models, but also supports direct API connections.
*   **Streaming**: Responses are streamed to the client using **Server-Sent Events (SSE)** to ensure a responsive UI during long generation times.

---

## 5. Discrepancy Note: Voice Input

**Status**: *Implemented in Code, Hidden in UI*

The codebase contains a fully functional `VoiceInput` component (`client/src/components/VoiceInput.tsx`) and corresponding backend endpoints (`voice.router.ts`) for uploading audio and transcribing it via Whisper (or similar).

However, **this component is currently not rendered** in the main `Home.tsx` (Debate Creation) or `Debate.tsx` (Workspace) views. While the feature is technically "complete" in the backend and component library, it is not accessible to the end-user in the current UI deployment.
