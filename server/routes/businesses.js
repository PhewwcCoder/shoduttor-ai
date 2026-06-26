// businesses.js — GET /api/businesses : distinct business IDs that have data.
// Powers the dashboard's dynamic business selector. Unions IDs seen in tickets
// and in the FAQ knowledge base, deduped.
const express = require("express");
const router = express.Router();
const { supabase } = require("../lib/supabase");

router.get("/", async (req, res) => {
  try {
    const ids = new Set();

    const [tickets, faq] = await Promise.all([
      supabase.from("tickets").select("business_id"),
      supabase.from("faq_chunks").select("business_id"),
    ]);

    for (const row of tickets.data || []) if (row.business_id) ids.add(row.business_id);
    for (const row of faq.data || []) if (row.business_id) ids.add(row.business_id);

    res.json({ businesses: Array.from(ids).sort() });
  } catch (err) {
    console.error("[shoduttor] /api/businesses error:", err);
    res.json({ businesses: [] });
  }
});

module.exports = router;
