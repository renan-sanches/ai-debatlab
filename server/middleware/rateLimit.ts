/**
 * Rate Limiting Middleware
 * Protects the API from abuse and controls costs by limiting request rates.
 */
import rateLimit from "express-rate-limit";

/**
 * General API rate limiter
 * Applies to all API endpoints
 * 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Debate/LLM rate limiter
 * More restrictive limit for expensive operations (creating debates, generating responses)
 * 10 debates per 15 minutes per IP
 */
export const debateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 debate creations per windowMs
  message: {
    error: "Too many debates created, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Streaming endpoint rate limiter
 * Controls access to the SSE streaming endpoints
 * 50 streaming requests per 15 minutes
 */
export const streamingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit streaming requests
  message: {
    error: "Too many streaming requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth rate limiter
 * Protects authentication endpoints from brute force attacks
 * 20 attempts per 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit auth attempts
  message: {
    error: "Too many authentication attempts, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

