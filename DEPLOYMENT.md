# AI DebateLab - Deployment Guide

This document provides instructions for deploying AI DebateLab to Google Cloud Run.

## Prerequisites

- Node.js 22+
- pnpm 10.4.1+
- Google Cloud account with billing enabled
- PostgreSQL database (Supabase recommended)
- Supabase account for authentication

## Local Development Setup

### 1. Install Dependencies

```bash
pnpm install --frozen-lockfile
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:

**Server Configuration:**
- `NODE_ENV` - Set to "development" for local, "production" for prod
- `PORT` - Server port (default: 3000)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing (min 32 characters)

**Supabase:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

**AI Model API:**
- `OPENROUTER_API_KEY` - OpenRouter API key for LLM access

**Security:**
- `ENCRYPTION_KEY` - Encryption key for sensitive data

**Vite Build-time Variables (must match Supabase values):**
- `VITE_SUPABASE_URL` - Same as SUPABASE_URL
- `VITE_SUPABASE_ANON_KEY` - Same as SUPABASE_ANON_KEY
- `VITE_APP_ID` - Application identifier

### 3. Database Setup

Run migrations to set up the database schema:

```bash
pnpm db:push
```

### 4. Run Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

## Building for Production

### Build the Application

```bash
pnpm build
```

This will:
1. Build the client with Vite → `dist/public/`
2. Bundle the server with esbuild → `dist/index.js`

### Run Production Build Locally

```bash
pnpm start
```

## Google Cloud Run Deployment

### Prerequisites

1. **Google Cloud Project**: Create or select a project
2. **Enable APIs**:
   - Cloud Build API
   - Cloud Run API
   - Container Registry API

3. **Install Google Cloud SDK**: [Installation Guide](https://cloud.google.com/sdk/docs/install)

### Manual Deployment

#### 1. Authenticate with Google Cloud

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

#### 2. Configure Cloud Build Substitutions

The `cloudbuild.yaml` file requires these substitution variables. Set them in your Cloud Build trigger or pass them via command line:

- `_DATABASE_URL` - PostgreSQL connection string
- `_SUPABASE_URL` - Supabase project URL
- `_SUPABASE_ANON_KEY` - Supabase anonymous key
- `_SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `_OPENROUTER_API_KEY` - OpenRouter API key
- `_ENCRYPTION_KEY` - Encryption key
- `_JWT_SECRET` - JWT signing secret

#### 3. Deploy with Cloud Build

```bash
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_DATABASE_URL="YOUR_DATABASE_URL",_SUPABASE_URL="YOUR_SUPABASE_URL",_SUPABASE_ANON_KEY="YOUR_ANON_KEY",_SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY",_OPENROUTER_API_KEY="YOUR_API_KEY",_ENCRYPTION_KEY="YOUR_ENCRYPTION_KEY",_JWT_SECRET="YOUR_JWT_SECRET"
```

### Automated Deployment (GitHub Actions)

The repository is configured with GitHub Actions for automated deployment on pushes to the `main` branch.

#### Required GitHub Secrets

Configure these secrets in your GitHub repository settings (`Settings` → `Secrets and variables` → `Actions`):

1. **`GCP_SA_KEY`** - Google Cloud service account JSON key
   - Create a service account with Cloud Build Editor and Cloud Run Admin roles
   - Download the JSON key
   - Add the entire JSON content as a secret

2. **Environment Variables:**
   - `DATABASE_URL`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENROUTER_API_KEY`
   - `ENCRYPTION_KEY`
   - `JWT_SECRET`

#### Workflow

The GitHub Actions workflow (`.github/workflows/deploy.yml`) will:

1. **Check Job**: Type check and build verification
2. **Test Job**: Run tests
3. **Deploy Job**: Trigger Cloud Build on successful tests (main branch only)

## Cloud Build Configuration

The `cloudbuild.yaml` file defines a multi-stage build process:

1. **Build Docker Image**: Creates optimized production image with all dependencies
2. **Push to Container Registry**: Stores image in Google Container Registry
3. **Deploy to Cloud Run**:
   - Service name: `api`
   - Region: `us-central1`
   - Memory: 512Mi
   - CPU: 1
   - Timeout: 300s
   - Concurrency: 80
   - Auto-scaling: 0-2 instances

## Dockerfile

The application uses a multi-stage Dockerfile:

### Build Stage
- Base: Node 22 Alpine
- Installs pnpm 10.4.1
- Installs all dependencies
- Builds client (Vite) and server (esbuild)
- Requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as build args

### Production Stage
- Base: Node 22 Alpine
- Installs production dependencies only
- Copies built assets from build stage
- Exposes port 8080 (Cloud Run default)
- Runs `node dist/index.js`

## Environment Variables in Production

Runtime environment variables are set via Cloud Run (in `cloudbuild.yaml`):

```yaml
--set-env-vars NODE_ENV=production,DATABASE_URL=...,SUPABASE_URL=...
```

Build-time environment variables are passed as Docker build args:

```yaml
--build-arg VITE_SUPABASE_URL=...
--build-arg VITE_SUPABASE_ANON_KEY=...
```

## Health Check Endpoint

The application provides a health check endpoint at `/api/health` that returns:

```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-01-17T...",
  "environment": "production"
}
```

Use this endpoint for Cloud Run health checks and monitoring.

## Troubleshooting

### Build Fails

1. **Missing environment variables**: Ensure all required env vars are set in Cloud Build substitutions
2. **TypeScript errors**: Run `pnpm check` locally to verify types
3. **Build timeout**: Increase timeout in `cloudbuild.yaml` (currently 1200s)

### App Won't Start

1. **Check logs**: `gcloud run logs read --service api --limit 50`
2. **Database connection**: Verify `DATABASE_URL` is correct and accessible
3. **Missing dependencies**: Verify `pnpm install --frozen-lockfile --prod` succeeds
4. **Port binding**: Cloud Run expects port 8080 (set in Dockerfile)

### Database Issues

1. **Connection errors**: Check if Cloud Run can reach your database
   - If using Supabase: Should work out of the box (public endpoint)
   - If using private database: Configure VPC connector
2. **Migration errors**: Run `pnpm db:push` manually if migrations fail

### Authentication Issues

1. **Supabase errors**: Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
2. **JWT errors**: Ensure `JWT_SECRET` is set and matches across deployments
3. **CORS errors**: Check Supabase dashboard for allowed origins

## Monitoring

1. **Cloud Run Metrics**: View in Google Cloud Console
2. **Logs**: `gcloud run logs tail --service api`
3. **Sentry** (optional): Set `SENTRY_DSN` for error tracking

## Costs

Approximate Google Cloud Run costs:
- **Free tier**: 2M requests/month, 360k GB-seconds memory
- **Beyond free tier**: ~$0.40 per million requests
- **Memory**: ~$0.0000025 per GB-second

Most small to medium applications stay within free tier limits.

## Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **Secrets**: Use Google Secret Manager for sensitive values (future improvement)
3. **Database**: Use connection pooling and read replicas for high traffic
4. **Rate Limiting**: Configured in `server/middleware/rateLimit.ts`
5. **HTTPS**: Automatically provided by Cloud Run
6. **Authentication**: Uses Supabase Auth with JWT tokens

## Support

For issues or questions:
1. Check application logs
2. Review this documentation
3. Consult Google Cloud Run documentation
4. Check Supabase documentation for auth issues
