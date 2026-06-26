// tickets.js — GET /api/tickets?business_id=... : list tickets for the dashboard.
// Returns newest first. Also exposes /api/tickets/stats for the dashboard stats bar.
const express = require("express");
const router = express.Router();
const { supabase } = require("../lib/supabase");

// GET /api/tickets?business_id=grameenphone
router.get("/", async (req, res) => {
  const businessId = req.query.business_id;
  if (!businessId) {
    return res.status(400).json({ error: "'business_id' query param is required." });
  }

  try {
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    res.json({ tickets: data || [] });
  } catch (err) {
    console.error("[shoduttor] /api/tickets error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tickets/stats?business_id=grameenphone — aggregates for the stats bar.
router.get("/stats", async (req, res) => {
  const businessId = req.query.business_id;
  if (!businessId) {
    return res.status(400).json({ error: "'business_id' query param is required." });
  }

  try {
    const { data, error } = await supabase
      .from("tickets")
      .select("intent, location, resolved, created_at")
      .eq("business_id", businessId);

    if (error) throw new Error(error.message);

    const tickets = data || [];
    const today = new Date().toISOString().slice(0, 10);
    const todayTickets = tickets.filter((t) => (t.created_at || "").slice(0, 10) === today);
    const resolvedCount = tickets.filter((t) => t.resolved).length;

    res.json({
      total: tickets.length,
      today: todayTickets.length,
      resolved_pct: tickets.length ? Math.round((resolvedCount / tickets.length) * 100) : 0,
      top_intent: topKey(tickets, "intent"),
      top_location: topKey(tickets.filter((t) => t.location), "location"),
    });
  } catch (err) {
    console.error("[shoduttor] /api/tickets/stats error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Return the most frequent value of `key` across the array, or null.
function topKey(arr, key) {
  const counts = {};
  for (const item of arr) {
    const k = item[key];
    if (!k) continue;
    counts[k] = (counts[k] || 0) + 1;
  }
  let top = null;
  let max = 0;
  for (const [k, v] of Object.entries(counts)) {
    if (v > max) {
      max = v;
      top = k;
    }
  }
  return top;
}

module.exports = router;
