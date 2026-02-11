# Build stage
FROM node:22-alpine AS builder

# Note: Firebase client config is now hard-coded in client/src/lib/firebase.ts
# Firebase client config values are public (not secrets) - security is enforced
# by Firebase Security Rules, not by hiding the API key

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Debug: List dist contents
RUN ls -la dist/ && ls -la dist/public/ || echo "dist/public not found"

# Production stage
FROM node:22-alpine AS runner

# Install pnpm for production
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

WORKDIR /app

# Copy package files and install production dependencies only
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile --prod

# Copy built assets from builder (dist already includes dist/public from Vite)
COPY --from=builder /app/dist ./dist

# Copy necessary files for runtime
COPY drizzle ./drizzle
COPY shared ./shared
COPY drizzle.config.ts ./
COPY tsconfig.json ./

# Create uploads directory for local file storage
RUN mkdir -p uploads

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose the port Cloud Run expects
EXPOSE 8080

# Start the application
CMD ["node", "dist/index.js"]
