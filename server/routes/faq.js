// faq.js — POST /api/faq/upload : business owner uploads their FAQ document.
// Accepts either a multipart file (field name "file") or a JSON body { text }.
// We chunk it, embed each chunk, and store the vectors in Supabase.
const express = require("express");
const multer = require("multer");
const router = express.Router();

const { embedFAQChunks, chunkFAQ } = require("../services/embeddings");
const { supabase } = require("../lib/supabase");

// Keep the uploaded file in memory (small .txt files) — no disk writes needed.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB cap
});

router.post("/upload", upload.single("file"), async (req, res) => {
  const businessId = req.body.business_id || req.query.business_id;
  // Text comes from the uploaded file buffer, or a raw "text" field in the body.
  // Coerce defensively — a non-string body field must never crash the process.
  const rawText = req.file ? req.file.buffer.toString("utf8") : req.body.text;
  const faqText = typeof rawText === "string" ? rawText : "";

  if (!businessId) {
    return res.status(400).json({ error: "'business_id' is required." });
  }
  if (!faqText || faqText.trim().length === 0) {
    return res.status(400).json({ error: "No FAQ text provided (upload a file or send 'text')." });
  }

  // Tell the caller how many chunks/embeddings this will cost before running.
  const previewChunks = chunkFAQ(faqText);
  if (previewChunks.length === 0) {
    return res.status(400).json({
      error: "FAQ produced 0 usable chunks. Separate entries with blank lines and keep each over 20 characters.",
    });
  }

  // The source filename: real name for file uploads, or an optional "filename"
  // field for pasted text, falling back to a neutral label.
  const sourceFile =
    (req.file && req.file.originalname) || req.body.filename || "Pasted text";

  try {
    const count = await embedFAQChunks(faqText, businessId);

    // Log the upload so the dashboard can show this business's knowledge base.
    // Non-fatal: if the faq_uploads table doesn't exist yet, just warn.
    try {
      const { error } = await supabase.from("faq_uploads").insert({
        business_id: businessId,
        source_file: sourceFile,
        chunk_count: count,
      });
      if (error) console.warn("[shoduttor] faq_uploads log skipped:", error.message);
    } catch (e) {
      console.warn("[shoduttor] faq_uploads log threw:", e.message);
    }

    res.json({
      status: "ok",
      business_id: businessId,
      source_file: sourceFile,
      chunks_embedded: count,
      message: `${count} chunks embedded successfully`,
    });
  } catch (err) {
    console.error("[shoduttor] /api/faq/upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/faq/sources?business_id=X — list the FAQ files in a business's
// knowledge base (one entry per filename, with total chunks + last upload time).
router.get("/sources", async (req, res) => {
  const businessId = req.query.business_id;
  if (!businessId) {
    return res.status(400).json({ error: "'business_id' query param is required." });
  }
  try {
    const { data, error } = await supabase
      .from("faq_uploads")
      .select("source_file, chunk_count, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    // Table missing or other error -> return empty list, don't break the UI.
    if (error) {
      console.warn("[shoduttor] /api/faq/sources:", error.message);
      return res.json({ sources: [] });
    }

    // Collapse to one row per filename: total chunks across uploads + latest time.
    const byFile = new Map();
    for (const row of data || []) {
      const key = row.source_file || "Pasted text";
      const existing = byFile.get(key);
      if (existing) {
        existing.chunks += row.chunk_count || 0;
        existing.uploads += 1;
      } else {
        byFile.set(key, {
          source_file: key,
          chunks: row.chunk_count || 0,
          uploads: 1,
          last_uploaded: row.created_at,
        });
      }
    }
    res.json({ sources: Array.from(byFile.values()) });
  } catch (err) {
    console.error("[shoduttor] /api/faq/sources error:", err);
    res.json({ sources: [] });
  }
});

module.exports = router;
