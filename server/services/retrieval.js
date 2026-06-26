// retrieval.js — Layer 2: find relevant FAQ chunks and generate an answer.
// 1. Embed the (translated) question.
// 2. Vector-search the business's FAQ chunks in Supabase (match_faq function).
// 3. Ask GPT-4o to answer using ONLY those chunks, or reply "ESCALATE".
const { openai } = require("../lib/openai");
const { supabase } = require("../lib/supabase");
const { embedText } = require("./embeddings");

const MATCH_THRESHOLD = 0.3; // cosine similarity floor for a chunk to count
const MATCH_COUNT = 4; // how many top chunks to feed the answer model

const FAQ_SYSTEM_PROMPT = `You are a helpful customer support agent for a Bangladeshi business.
You will be given a customer's question (already translated to English) and relevant FAQ content from the business's knowledge base.

Rules:
- Answer in simple, friendly English
- Keep the answer under 3 sentences
- If the FAQ content does not contain a relevant answer, respond with exactly: "ESCALATE"
- Never make up information that is not in the FAQ content
- If the customer mentioned a location, acknowledge it in your response`;

// Vector-search the business's FAQ chunks for the given text.
async function searchFAQ(translatedMessage, businessId) {
  const queryEmbedding = await embedText(translatedMessage);

  const { data, error } = await supabase.rpc("match_faq", {
    query_embedding: queryEmbedding,
    match_threshold: MATCH_THRESHOLD,
    match_count: MATCH_COUNT,
    p_business_id: businessId,
  });

  if (error) throw new Error(`match_faq failed: ${error.message}`);
  return data || [];
}

// Generate an answer from FAQ context, or return the literal string "ESCALATE".
async function generateAnswer(translatedMessage, faqContext, location) {
  const userPrompt = `Customer question: ${translatedMessage}
${location ? `Customer location: ${location}` : ""}

Relevant FAQ content:
${faqContext}

Answer the customer's question using only the FAQ content above.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: FAQ_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.2,
    max_tokens: 150,
  });

  return response.choices[0].message.content.trim();
}

// Full Layer-2 flow: returns { resolved, reply, matches }.
async function resolveWithFAQ(translatedMessage, businessId, location) {
  const matches = await searchFAQ(translatedMessage, businessId);

  // No FAQ chunks at all -> escalate immediately, skip the answer model.
  if (matches.length === 0) {
    return { resolved: false, reply: null, matches };
  }

  const faqContext = matches.map((m) => m.content).join("\n\n");
  const answer = await generateAnswer(translatedMessage, faqContext, location);

  if (answer.toUpperCase().includes("ESCALATE")) {
    return { resolved: false, reply: null, matches };
  }

  return { resolved: true, reply: answer, matches };
}

module.exports = { resolveWithFAQ, searchFAQ, generateAnswer, FAQ_SYSTEM_PROMPT };
