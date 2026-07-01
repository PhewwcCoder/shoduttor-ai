// index.js — Shoduttor.ai Express backend entry point.
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const chatRoute = require("./routes/chat");
const nluRoute = require("./routes/nlu");
const faqRoute = require("./routes/faq");
const ticketsRoute = require("./routes/tickets");
const businessesRoute = require("./routes/businesses");
const { chatLimiter, uploadLimiter } = require("./middleware/rateLimit");

const app = express();

// Behind Render's proxy — trust the first hop so rate limiters key on the real
// client IP (X-Forwarded-For), not the shared proxy IP.
app.set("trust proxy", 1);

// The widget runs on other businesses' websites, so the API must accept
// cross-origin requests. For the prototype we allow all origins; in production
// this becomes a per-business domain allowlist.
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "1mb" }));

// Friendly root so the bare URL doesn't show Express's "Cannot GET /".
app.get("/", (req, res) => {
  res.json({
    service: "shoduttor.ai API",
    status: "ok",
    docs: "POST /api/chat · POST /api/faq/upload · GET /api/tickets · GET /health",
  });
});

// Health check — used to confirm the server is up (and to wake Render's free tier).
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "shoduttor.ai", time: new Date().toISOString() });
});

// Layer 1+2+3 main endpoint (per-IP rate limited).
app.use("/api/chat", chatLimiter, chatRoute);

// Layer 1 only — dev/debug endpoint for testing the Banglish parser in isolation.
app.use("/api/nlu", chatLimiter, nluRoute);

// FAQ routes. Rate-limit only the expensive upload path; the dashboard's
// frequent GET /sources and DELETE pass through freely.
app.use("/api/faq/upload", uploadLimiter);
app.use("/api/faq", faqRoute);
app.use("/api/tickets", ticketsRoute);
app.use("/api/businesses", businessesRoute);

// Catch-all error handler so a thrown error (e.g. multer file-size) returns
// JSON instead of crashing the process.
app.use((err, req, res, next) => {
  console.error("[shoduttor] unhandled route error:", err.message);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[shoduttor] API listening on http://localhost:${PORT}`);
});

module.exports = app;
