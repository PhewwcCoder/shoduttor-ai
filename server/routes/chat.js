// chat.js — POST /api/chat : the main NLU + resolution + routing endpoint.
//
// Flow:
//   1. Layer 1 (NLU): parse the Banglish message into structured fields.
//   2. Layer 2 (FAQ):  try to answer from the business's knowledge base.
//   3. Layer 3 (Route): if unresolved, create a ticket for the right department.
//
// Every message is logged as a ticket so the admin dashboard sees all traffic;
// resolved ones are flagged resolved=true.
const express = require("express");
const router = express.Router();

const { parseMessage } = require("../services/nlu");
const { resolveWithFAQ } = require("../services/retrieval");
const { supabase } = require("../lib/supabase");

// Abuse / cost limits (overridable via env).
const DAILY_LIMIT = Number(process.env.DAILY_BUSINESS_LIMIT) || 60; // messages/business/day
const MAX_LEN = Number(process.env.MAX_MESSAGE_LEN) || 500; // chars per message

// Consume 1 unit of a business's daily quota — durable + atomic in Supabase.
// Returns { allowed, count }. Fails OPEN (allows) if the RPC/table isn't set up
// yet, so the demo never breaks; the per-IP rate limit still applies.
async function consumeQuota(businessId) {
  try {
    const day = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase.rpc("consume_quota", {
      p_business_id: businessId,
      p_day: day,
      p_limit: DAILY_LIMIT,
    });
    if (error) {
      console.warn("[shoduttor] consume_quota skipped:", error.message);
      return { allowed: true, count: 0 };
    }
    const row = Array.isArray(data) ? data[0] : data;
    return { allowed: row ? row.allowed : true, count: row ? row.count : 0 };
  } catch (e) {
    console.warn("[shoduttor] consume_quota threw:", e.message);
    return { allowed: true, count: 0 };
  }
}

// Map an extracted intent to the human department that handles it.
// Generic, business-agnostic department names that fit any industry.
const DEPARTMENT_BY_INTENT = {
  billing: "Billing Team",
  technical: "Technical Support",
  subscription: "Subscriptions Team",
  product: "Product Support",
  delivery: "Logistics Team",
  account: "Account Team",
  complaint: "Customer Relations",
  general: "General Support",
};

// Insert a ticket row. Returns the inserted row, or null if storage failed
// (we don't want a Supabase outage to break the live chat reply).
async function saveTicket(ticket) {
  try {
    const { data, error } = await supabase
      .from("tickets")
      .insert(ticket)
      .select()
      .single();
    if (error) {
      console.error("[shoduttor] saveTicket error:", error.message);
      return null;
    }
    return data;
  } catch (e) {
    console.error("[shoduttor] saveTicket threw:", e.message);
    return null;
  }
}

router.post("/", async (req, res) => {
  const { message, business_id } = req.body || {};

  if (!message || !business_id) {
    return res
      .status(400)
      .json({ error: "Both 'message' and 'business_id' are required." });
  }
  if (String(message).length > MAX_LEN) {
    return res
      .status(400)
      .json({ error: `Message is too long (max ${MAX_LEN} characters).` });
  }

  // Per-business daily budget — before any OpenAI call, so an over-quota
  // business spends nothing.
  const quota = await consumeQuota(business_id);
  if (!quota.allowed) {
    return res.status(429).json({
      error: "This business has reached today's message limit. Please try again tomorrow.",
      limit_reached: true,
    });
  }

  try {
    // Layer 1 — NLU
    const nlu = await parseMessage(message);

    // Layer 2 — FAQ resolution
    const { resolved, reply } = await resolveWithFAQ(
      nlu.english_translation,
      business_id,
      nlu.location
    );

    if (resolved) {
      // Log a resolved ticket (for dashboard stats) but don't route to a human.
      await saveTicket({
        business_id,
        original_message: message,
        intent: nlu.intent,
        location: nlu.location,
        sentiment: nlu.sentiment,
        english_translation: nlu.english_translation,
        resolution: reply,
        resolved: true,
        department: DEPARTMENT_BY_INTENT[nlu.intent],
      });

      return res.json({
        status: "resolved",
        reply,
        intent: nlu.intent,
        sentiment: nlu.sentiment,
        translation: nlu.english_translation,
      });
    }

    // Layer 3 — Smart routing (escalate)
    const department = DEPARTMENT_BY_INTENT[nlu.intent] || "General Support";
    const ticket = await saveTicket({
      business_id,
      original_message: message,
      intent: nlu.intent,
      location: nlu.location,
      sentiment: nlu.sentiment,
      english_translation: nlu.english_translation,
      resolution: null,
      resolved: false,
      department,
    });

    return res.json({
      status: "escalated",
      reply: `I've logged your issue and passed it to our ${department.toLowerCase()}. They will contact you shortly.`,
      ticket_id: ticket ? ticket.id : null,
      department,
      intent: nlu.intent,
      sentiment: nlu.sentiment,
      translation: nlu.english_translation,
    });
  } catch (err) {
    console.error("[shoduttor] /api/chat error:", err);
    return res
      .status(500)
      .json({ error: "Something went wrong processing your message." });
  }
});

module.exports = router;
