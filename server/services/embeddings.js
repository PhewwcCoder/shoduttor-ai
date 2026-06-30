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

const MAX_CHUNK = 1200; // chars — anything longer is sub-split (helps PDFs)

// Chunk a raw document into meaningful pieces. Split on blank lines first; then
// sub-split any over-long chunk (e.g. a PDF paragraph) on sentence/line breaks.
function chunkFAQ(faqText) {
  const blocks = faqText
    .split(/\n{2,}/)
    .map((c) => c.trim())
    .filter((c) => c.length > 20);

  const chunks = [];
  for (const block of blocks) {
    if (block.length <= MAX_CHUNK) {
      chunks.push(block);
      continue;
    }
    let buf = "";
    for (const part of block.split(/(?<=[.!?])\s+|\n/)) {
      if (buf && (buf + " " + part).length > 900) {
        chunks.push(buf.trim());
        buf = part;
      } else {
        buf += (buf ? " " : "") + part;
      }
    }
    if (buf.trim().length > 20) chunks.push(buf.trim());
  }
  return chunks;
}

// Chunk + embed + store an entire document for one business, tagged with its
// source filename. Returns the number of chunks embedded.
// Resilient: if the faq_chunks.source_file column doesn't exist yet, it falls
// back to inserting without it (so uploads keep working pre-migration).
async function embedFAQChunks(faqText, businessId, sourceFile = null) {
  const chunks = chunkFAQ(faqText);
  let includeSource = sourceFile != null;

  for (const chunk of chunks) {
    const embedding = await embedText(chunk);
    const row = { business_id: businessId, content: chunk, embedding };
    if (includeSource) row.source_file = sourceFile;

    let { error } = await supabase.from("faq_chunks").insert(row);
    if (error && includeSource && /source_file|column/i.test(error.message)) {
      // Column not migrated yet — drop it and retry, and stop tagging for the rest.
      includeSource = false;
      delete row.source_file;
      ({ error } = await supabase.from("faq_chunks").insert(row));
    }
    if (error) throw new Error(`Supabase insert failed: ${error.message}`);
  }

  return chunks.length;
}

// Delete the chunks for one source file of a business (needs the source_file
// column). Returns the number removed, or 0 if not possible. Non-fatal.
async function deleteFAQByFile(businessId, sourceFile) {
  try {
    const { error, count } = await supabase
      .from("faq_chunks")
      .delete({ count: "exact" })
      .eq("business_id", businessId)
      .eq("source_file", sourceFile);
    if (error) {
      console.warn("[shoduttor] deleteFAQByFile skipped:", error.message);
      return 0;
    }
    return count || 0;
  } catch (e) {
    console.warn("[shoduttor] deleteFAQByFile threw:", e.message);
    return 0;
  }
}

module.exports = { embedText, chunkFAQ, embedFAQChunks, deleteFAQByFile, EMBEDDING_MODEL };
