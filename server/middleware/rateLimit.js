// rateLimit.js — per-IP rate limiters (first line of abuse defense).
// Stops one source from hammering the expensive AI endpoints. Keyed on the
// client IP (index.js sets `trust proxy` so this is the real IP on Render).
//
// NOTE: the default store is in-memory, which is correct for a single instance
// (Render free tier). If the backend is ever scaled to multiple instances, swap
// in a shared store (e.g. rate-limit-redis) so limits are counted globally.
const rateLimit = require("express-rate-limit");

// Chat / NLU — a human never needs more than a few messages a minute.
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many messages — please slow down and try again in a minute." },
});

// FAQ uploads — embeddings are pricier, so a tighter hourly cap per IP.
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15, // per IP per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many uploads — please try again later." },
});

module.exports = { chatLimiter, uploadLimiter };
