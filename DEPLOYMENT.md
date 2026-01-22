# Deployment Guide: Supabase + Firebase + Cloud Run

This guide describes how to deploy the AI DebateLab application using Supabase (PostgreSQL Database), Google Cloud Run (Hosting), and Firebase (Auth, Storage).

## Prerequisites

1.  **Supabase Account**: Create a project at [supabase.com](https://supabase.com).
2.  **Google Cloud Project**: With billing enabled.
3.  **Firebase Project**: Linked to your GCP project.
4.  **CLI Tools**: `gcloud`, `firebase`, and `pnpm` installed.

## 1. Firebase Configuration (Auth & Storage)

### 1.1. Setup
1.  Go to [Firebase Console](https://console.firebase.google.com/).
2.  **Authentication**: Enable **Email/Password** and **Google** in Sign-in methods.
3.  **Storage**: Create a default bucket.
4.  **Service Account**:
    *   Go to **Project Settings** > **Service accounts**.
    *   Click **Generate new private key**.
    *   Save the JSON file. You will need the `private_key`, `project_id`, and `client_email`.

## 2. Supabase Configuration (Database)

1.  Create a new project on [Supabase](https://supabase.com).
2.  Go to **Project Settings** > **Database**.
3.  Under **Connection Pooling**, note the connection string.
    *   **Mode**: Transaction (Port 6543) - Recommended for Cloud Run (serverless).
    *   **Mode**: Session (Port 5432) - Required for running migrations.
4.  **Get the Connection Strings**:
    *   **Runtime Connection String** (for Cloud Run):
        `postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true`
    *   **Migration Connection String** (for running `db:push`):
        `postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres`

*Note: Replace `[password]` with your database password.*

## 3. Environment Variables

### 3.1. Frontend (Build Args)
These are baked into the frontend build.

*   `VITE_FIREBASE_API_KEY`
*   `VITE_FIREBASE_AUTH_DOMAIN`
*   `VITE_FIREBASE_PROJECT_ID`
*   `VITE_FIREBASE_STORAGE_BUCKET`
*   `VITE_FIREBASE_MESSAGING_SENDER_ID`
*   `VITE_FIREBASE_APP_ID`
*   `VITE_APP_ID`: `ai-debatelab`

### 3.2. Backend (Runtime Env)
These are set in Cloud Run.

*   `NODE_ENV`: `production`
*   `DATABASE_URL`: Your Supabase **Transaction** connection string (Port 6543).
*   `FIREBASE_PROJECT_ID`: From service account JSON.
*   `FIREBASE_CLIENT_EMAIL`: From service account JSON.
*   `FIREBASE_PRIVATE_KEY`: From service account JSON (replace `\n` with real newlines if pasting in GUI, or use flags in CLI).
*   `JWT_SECRET`: A 32-char random string.
*   `OPENROUTER_API_KEY`: Your OpenRouter key.
*   `ENCRYPTION_KEY`: A 32-char random string.

## 4. Deploying to Cloud Run

### 4.1. Build and Submit Container
Replace values with your Firebase Web Config.

```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/ai-debatelab \
  --build-arg VITE_FIREBASE_API_KEY="your-key" \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com" \
  --build-arg VITE_FIREBASE_PROJECT_ID="your-project-id" \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET="your-bucket.appspot.com" \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id" \
  --build-arg VITE_FIREBASE_APP_ID="your-app-id"
```

### 4.2. Deploy Service
Deploy to Cloud Run connecting to Supabase.

```bash
gcloud run deploy ai-debatelab \
  --image gcr.io/YOUR_PROJECT_ID/ai-debatelab \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "DATABASE_URL=postgres://..." \
  --set-env-vars "FIREBASE_PROJECT_ID=..." \
  --set-env-vars "FIREBASE_CLIENT_EMAIL=..." \
  --set-env-vars "FIREBASE_PRIVATE_KEY=..." \
  --set-env-vars "JWT_SECRET=..." \
  --set-env-vars "OPENROUTER_API_KEY=..." \
  --set-env-vars "ENCRYPTION_KEY=..."
```

## 5. Database Migrations

You must run migrations to set up the database schema.
**Important**: Use the **Session** connection string (Port 5432) for migrations.

1.  Set `DATABASE_URL` locally to the Supabase Session connection string.
2.  Run:
    ```bash
    pnpm db:push
    ```