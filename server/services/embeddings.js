// embeddings.js — turns an uploaded FAQ document into searchable vectors.
// We "chunk" the FAQ (split into small pieces), create an embedding (a numeric
// fingerprint of the meaning) for each chunk, and store it in Supabase so we can
// later find the chunk closest in meaning to a customer's question.
const { openai } = require("../lib/openai");
const { supabase } = require("../lib/supabase");

const EMBEDDING_MODEL = "text-embedding-3-small"; // 1536-dim, matches the DB schema

// Create one embedding vector for a single piece of text.
async function embedText(text) {
  const res = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return res.data[0].embedding;
}

// Chunk a raw FAQ document into meaningful pieces (split on blank lines).
function chunkFAQ(faqText) {
  return faqText
    .split(/\n{2,}/)
    .map((c) => c.trim())
    .filter((c) => c.length > 20);
}

// Chunk + embed + store an entire FAQ document for one business.
// Returns the number of chunks embedded.
async function embedFAQChunks(faqText, businessId) {
  const chunks = chunkFAQ(faqText);

  for (const chunk of chunks) {
    const embedding = await embedText(chunk);
    const { error } = await supabase.from("faq_chunks").insert({
      business_id: businessId,
      content: chunk,
      embedding,
    });
    if (error) throw new Error(`Supabase insert failed: ${error.message}`);
  }

  return chunks.length;
}

module.exports = { embedText, chunkFAQ, embedFAQChunks, EMBEDDING_MODEL };
