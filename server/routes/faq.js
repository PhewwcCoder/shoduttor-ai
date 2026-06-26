// faq.js — POST /api/faq/upload : business owner uploads their FAQ document.
// Accepts either a multipart file (field name "file") or a JSON body { text }.
// We chunk it, embed each chunk, and store the vectors in Supabase.
const express = require("express");
const multer = require("multer");
const router = express.Router();

const { embedFAQChunks, chunkFAQ } = require("../services/embeddings");

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

  try {
    const count = await embedFAQChunks(faqText, businessId);
    res.json({
      status: "ok",
      business_id: businessId,
      chunks_embedded: count,
      message: `${count} chunks embedded successfully`,
    });
  } catch (err) {
    console.error("[shoduttor] /api/faq/upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
