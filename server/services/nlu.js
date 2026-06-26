// nlu.js — Banglish NLU parser.
// Sends each incoming message to GPT-4o and extracts structured fields:
// intent, location, sentiment, english_translation, confidence.
const { openai } = require("../lib/openai");

const NLU_SYSTEM_PROMPT = `You are an NLU engine for a customer support system that works for ANY business —
telecom, e-commerce / retail, banking, food delivery, ISPs, SaaS, and more.

Your job is to understand the customer's message no matter how it is written:
- Banglish: Bengali words romanized into English letters, mixed with English (this is the common, hardest case)
- Bengali script
- Plain English
- Any mix of the above (handle other languages gracefully too)

Banglish examples (romanized Bengali — learn these patterns):
- "amar mb kete nise keno" = why was my internet data deducted? (billing)
- "net cholche na ekdom" = internet is not working at all (technical)
- "Dhanmondi te 4g nai" = there is no 4G signal in Dhanmondi (technical)
- "package activate hoy nai" = my package/plan was not activated (subscription)
- "order ta kobe ashbe" = when will my order arrive? (delivery)
- "ei shirt ta ki medium size e ache" = is this shirt available in medium size? (product)
- "refund kobe pabo" = when will I get my refund? (billing)
- "login korte parchi na" = I can't log in to my account (account)

Intent definitions (pick the single best fit):
- "billing": payments, charges, refunds, deductions, balance, invoices, pricing
- "technical": something is not working — service, app, website, network, connection, errors
- "subscription": plans, packages, memberships, recurring services, activation, renewal, upgrades
- "product": a specific product or item — defects, sizing, availability, features, how-to
- "delivery": shipping, order arrival, logistics, pickup, tracking, delays
- "account": login, profile, password, number/email change, blocked or locked account, verification
- "complaint": general dissatisfaction, poor service, staff behavior, demanding escalation
- "general": greetings, info requests, or anything that does not fit the above

You must return ONLY a valid JSON object with exactly these keys:
{
  "intent": one of ["billing", "technical", "subscription", "product", "delivery", "account", "complaint", "general"],
  "location": the location mentioned as a string, or null if none mentioned,
  "sentiment": one of ["frustrated", "urgent", "neutral", "confused", "angry"],
  "english_translation": a clean English translation of the message,
  "confidence": a float between 0 and 1 representing your confidence in the intent extraction
}

Return ONLY the JSON. No explanation, no markdown, no extra text.`;

// Allowed values used to sanitize the model output so downstream code is safe.
const INTENTS = ["billing", "technical", "subscription", "product", "delivery", "account", "complaint", "general"];
const SENTIMENTS = ["frustrated", "urgent", "neutral", "confused", "angry"];

async function parseMessage(message) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: NLU_SYSTEM_PROMPT },
      { role: "user", content: message },
    ],
    temperature: 0.1,
    response_format: { type: "json_object" },
  });

  const parsed = JSON.parse(response.choices[0].message.content);

  // Normalize / guard against unexpected values.
  return {
    intent: INTENTS.includes(parsed.intent) ? parsed.intent : "general",
    location: parsed.location || null,
    sentiment: SENTIMENTS.includes(parsed.sentiment) ? parsed.sentiment : "neutral",
    english_translation: parsed.english_translation || message,
    confidence:
      typeof parsed.confidence === "number"
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.5,
  };
}

module.exports = { parseMessage, NLU_SYSTEM_PROMPT };
