import "dotenv/config";
import * as Sentry from "@sentry/node";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers/index";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import streamingRoutes from "../streamingRoutes";
import { apiLimiter, streamingLimiter, authLimiter } from "../middleware/rateLimit";
import { getDb } from "../db";

// Log startup environment for debugging
console.log("[Startup] NODE_ENV:", process.env.NODE_ENV);
console.log("[Startup] PORT:", process.env.PORT);
console.log("[Startup] CWD:", process.cwd());
console.log("[Startup] DATABASE_URL:", process.env.DATABASE_URL ? "***SET***" : "NOT SET");
console.log("[Startup] SUPABASE_URL:", process.env.SUPABASE_URL ? "***SET***" : "NOT SET");

// Initialize Sentry error tracking
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    integrations: [
      Sentry.expressIntegration(),
    ],
  });
  console.log("[Sentry] Error tracking initialized");
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Sentry request handler (must be first middleware)
  if (process.env.SENTRY_DSN) {
    Sentry.setupExpressErrorHandler(app);
  }
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Serve local uploads directory in dev mode
  if (process.env.DEV_MODE === "true") {
    const uploadsDir = path.join(process.cwd(), "uploads");
    app.use("/uploads", express.static(uploadsDir));
    console.log("[Dev Mode] Serving local uploads from:", uploadsDir);
  }
  
  // Health check endpoint (no rate limiting)
  app.get("/api/health", async (_req, res) => {
    try {
      const db = await getDb();
      const dbStatus = db ? "connected" : "not_configured";
      
      res.json({
        status: db ? "healthy" : "degraded",
        database: dbStatus,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
      });
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  });
  
  // Apply rate limiting to API routes
  app.use("/api/oauth", authLimiter);
  app.use("/api/stream", streamingLimiter);
  app.use("/api/trpc", apiLimiter);
  
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Streaming API routes
  app.use(streamingRoutes);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
