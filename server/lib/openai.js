// Shared OpenAI client. Single instance reused across all services.
const OpenAI = require("openai");

if (!process.env.OPENAI_API_KEY) {
  console.warn(
    "[shoduttor] WARNING: OPENAI_API_KEY is not set. AI calls will fail until you add it to server/.env"
  );
}

// Use a placeholder when missing so requiring this file never throws at import
// time; real API calls will fail with a clear auth error until a real key is set.
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-placeholder-missing-key",
});

module.exports = { openai };
