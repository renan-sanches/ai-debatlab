# Deployment Guide: Google Cloud SQL + Firebase

This guide describes how to deploy the AI DebateLab application using Google Cloud Platform (Cloud SQL, Cloud Run) and Firebase (Auth, Storage).

## Prerequisites

1.  **Google Cloud Project**: You need a GCP project with billing enabled.
2.  **Firebase Project**: You need a Firebase project linked to your GCP project.
3.  **gcloud CLI**: Installed and authenticated.
4.  **Firebase CLI**: Installed and logged in.

## 1. Firebase Configuration

### 1.1. Authentication
1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Navigate to **Authentication** > **Sign-in method**.
3.  Enable **Email/Password**.
4.  Enable **Google** (and GitHub if desired).
5.  Go to **Project Settings** > **General**.
6.  Register a new **Web App** if one doesn't exist.
7.  Copy the firebase configuration values (`apiKey`, `authDomain`, etc.). You will need these for the client environment variables.

### 1.2. Storage
1.  Navigate to **Storage**.
2.  Click **Get Started** to create a default bucket.
3.  Set security rules (default is fine for testing, but lock it down for production).
    *   *Note*: The application code attempts to make uploaded files public. Ensure your bucket permissions allow this if you want avatars/images to be publicly viewable without signed URLs, or update the storage logic in `server/storage.ts`.

### 1.3. Service Account (Backend)
1.  In **Project Settings** > **Service accounts**.
2.  Click **Generate new private key**.
3.  Save the JSON file. You will need the `project_id`, `client_email`, and `private_key` for the backend environment variables.

## 2. Google Cloud SQL (PostgreSQL)

1.  Go to the [Cloud SQL Console](https://console.cloud.google.com/sql).
2.  Click **Create Instance** > **Choose PostgreSQL**.
3.  Configure the instance:
    *   **Instance ID**: `ai-debatelab-db` (or similar).
    *   **Password**: Generate a strong password.
    *   **Database version**: PostgreSQL 15 or higher.
    *   **Region**: Same as your Cloud Run service (e.g., `us-central1`).
4.  Once created, go to the **Databases** tab and create a new database named `ai_debatelab` (or your preferred name).
5.  Go to the **Users** tab and create a user (if you don't want to use the default `postgres` user).

## 3. Environment Variables

You need to set environment variables for both the **Build** (Frontend) and **Runtime** (Backend).

### 3.1. Frontend (Build Args)
These are needed when building the Docker image because Vite bundles them into the client code.

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
*   `DATABASE_URL`: Connection string to Cloud SQL (see "Connecting from Cloud Run" below).
*   `FIREBASE_PROJECT_ID`: From service account JSON.
*   `FIREBASE_CLIENT_EMAIL`: From service account JSON.
*   `FIREBASE_PRIVATE_KEY`: From service account JSON (include `\n` for newlines).
*   `JWT_SECRET`: A long random string.
*   `OPENROUTER_API_KEY`: Your OpenRouter key.
*   `ENCRYPTION_KEY`: A 32-character random string.

## 4. Deploying to Cloud Run

### 4.1. Build and Submit Container
Use Cloud Build to build the image. Replace the values with your actual Firebase config.

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
Deploy the container to Cloud Run, connecting it to Cloud SQL.

```bash
gcloud run deploy ai-debatelab \
  --image gcr.io/YOUR_PROJECT_ID/ai-debatelab \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --add-cloudsql-instances YOUR_PROJECT_ID:REGION:INSTANCE_ID \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "DATABASE_URL=postgresql://USER:PASSWORD@localhost/DB_NAME?host=/cloudsql/YOUR_PROJECT_ID:REGION:INSTANCE_ID" \
  --set-env-vars "FIREBASE_PROJECT_ID=..." \
  --set-env-vars "FIREBASE_CLIENT_EMAIL=..." \
  --set-env-vars "FIREBASE_PRIVATE_KEY=..." \
  --set-env-vars "JWT_SECRET=..." \
  --set-env-vars "OPENROUTER_API_KEY=..." \
  --set-env-vars "ENCRYPTION_KEY=..."
```

**Important Note on `DATABASE_URL`**:
When using Cloud Run with the `--add-cloudsql-instances` flag, the Unix socket is available at `/cloudsql/INSTANCE_CONNECTION_NAME`.
PostgreSQL connection string format: `postgresql://user:password@localhost/dbname?host=/cloudsql/INSTANCE_CONNECTION_NAME`

## 5. Database Migrations

After deploying, you need to apply the database migrations. The app currently does not auto-migrate on startup (it's safer to run manually).

### Option A: Run locally (easiest if you have network access)
1.  Install `cloud_sql_proxy`.
2.  Start proxy: `./cloud_sql_proxy -instances=INSTANCE_CONNECTION_NAME=tcp:5432`
3.  Set `DATABASE_URL=postgresql://user:pass@localhost:5432/dbname` locally.
4.  Run: `pnpm db:push`

### Option B: Run via a temporary job
Create a Cloud Run Job that runs the migration command.

```bash
gcloud run jobs create migrate-db \
  --image gcr.io/YOUR_PROJECT_ID/ai-debatelab \
  --command "pnpm" \
  --args "db:push" \
  --add-cloudsql-instances YOUR_PROJECT_ID:REGION:INSTANCE_ID \
  --set-env-vars "DATABASE_URL=postgresql://USER:PASSWORD@localhost/DB_NAME?host=/cloudsql/YOUR_PROJECT_ID:REGION:INSTANCE_ID" \
  --region us-central1

gcloud run jobs execute migrate-db --region us-central1
```

## 6. Verification

1.  Open the Cloud Run URL.
2.  Try to Sign Up / Login (this verifies Firebase Auth and DB connection).
3.  Start a debate (verifies OpenRouter/AI integration).
4.  Upload a custom avatar (verifies Firebase Storage).
