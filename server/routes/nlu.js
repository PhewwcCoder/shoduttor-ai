// nlu.js (route) — POST /api/nlu : debug/dev endpoint that runs ONLY Layer 1.
// Lets us test the Banglish parser in isolation (no Supabase / FAQ needed).
const express = require("express");
const router = express.Router();
const { parseMessage } = require("../services/nlu");

router.post("/", async (req, res) => {
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: "'message' is required." });
  try {
    const result = await parseMessage(message);
    res.json(result);
  } catch (err) {
    console.error("[shoduttor] /api/nlu error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
