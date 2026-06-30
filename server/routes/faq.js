// faq.js — POST /api/faq/upload : business owner uploads their knowledge file.
// Accepts a multipart file (.txt / .pdf / .xlsx / .xls) OR a JSON body { text }.
// We extract text, chunk it, embed each chunk, and store the vectors in Supabase.
const express = require("express");
const multer = require("multer");
const router = express.Router();

const { embedFAQChunks, chunkFAQ, deleteFAQByFile } = require("../services/embeddings");
const { extractText } = require("../services/extract");
const { supabase } = require("../lib/supabase");

// Keep the uploaded file in memory. PDFs/spreadsheets can be larger than .txt.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB cap
});

// Remove a file's previous upload-log rows (so re-upload shows one fresh entry).
async function clearUploadLog(businessId, sourceFile) {
  try {
    await supabase.from("faq_uploads").delete().eq("business_id", businessId).eq("source_file", sourceFile);
  } catch (e) {
    console.warn("[shoduttor] clearUploadLog:", e.message);
  }
}

router.post("/upload", upload.single("file"), async (req, res) => {
  const businessId = req.body.business_id || req.query.business_id;
  if (!businessId) {
    return res.status(400).json({ error: "'business_id' is required." });
  }

  // The source filename: real name for files, or an optional "filename" for text.
  const sourceFile =
    (req.file && req.file.originalname) || req.body.filename || "Pasted text";

  // Extract text: parse PDF/XLSX from the file buffer, else use the .txt/body text.
  let faqText;
  try {
    if (req.file) {
      faqText = await extractText(req.file.buffer, req.file.originalname, req.file.mimetype);
    } else {
      faqText = typeof req.body.text === "string" ? req.body.text : "";
    }
  } catch (e) {
    return res.status(400).json({ error: `Could not read the file: ${e.message}` });
  }

  if (!faqText || faqText.trim().length === 0) {
    return res.status(400).json({ error: "No readable text found (upload a .txt/.pdf/.xlsx, or send 'text')." });
  }

  const previewChunks = chunkFAQ(faqText);
  if (previewChunks.length === 0) {
    return res.status(400).json({
      error: "Produced 0 usable chunks. The file may be empty, scanned/image-only, or too short.",
    });
  }

  try {
    // Replace-on-reupload: clear this file's old chunks + log first, so the same
    // filename updates in place instead of stacking duplicates.
    const replaced = await deleteFAQByFile(businessId, sourceFile);
    await clearUploadLog(businessId, sourceFile);

    const count = await embedFAQChunks(faqText, businessId, sourceFile);

    // Log the upload (non-fatal if the faq_uploads table is missing).
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
      replaced_chunks: replaced,
      message: `${count} chunks embedded successfully${replaced ? ` (replaced ${replaced} old)` : ""}`,
    });
  } catch (err) {
    console.error("[shoduttor] /api/faq/upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/faq/source — remove one file from a business's knowledge base.
// Body: { business_id, source_file }
router.delete("/source", async (req, res) => {
  const { business_id, source_file } = req.body || {};
  if (!business_id || !source_file) {
    return res.status(400).json({ error: "'business_id' and 'source_file' are required." });
  }
  try {
    const removed = await deleteFAQByFile(business_id, source_file);
    await clearUploadLog(business_id, source_file);
    res.json({ status: "ok", source_file, removed_chunks: removed });
  } catch (err) {
    console.error("[shoduttor] /api/faq/source DELETE error:", err);
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
