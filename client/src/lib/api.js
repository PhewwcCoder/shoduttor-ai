// Tiny API helper. Base URL comes from VITE_API_URL (set in client/.env).
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export { API_URL };

export async function getTickets(businessId) {
  const res = await fetch(`${API_URL}/api/tickets?business_id=${encodeURIComponent(businessId)}`);
  if (!res.ok) throw new Error(`Failed to load tickets (${res.status})`);
  const data = await res.json();
  return data.tickets || [];
}

export async function getStats(businessId) {
  const res = await fetch(`${API_URL}/api/tickets/stats?business_id=${encodeURIComponent(businessId)}`);
  if (!res.ok) throw new Error(`Failed to load stats (${res.status})`);
  return res.json();
}

// Distinct business IDs that have data (for the dynamic selector).
export async function getBusinesses() {
  const res = await fetch(`${API_URL}/api/businesses`);
  if (!res.ok) throw new Error(`Failed to load businesses (${res.status})`);
  const data = await res.json();
  return data.businesses || [];
}

// The FAQ files that make up a business's knowledge base.
export async function getFaqSources(businessId) {
  const res = await fetch(`${API_URL}/api/faq/sources?business_id=${encodeURIComponent(businessId)}`);
  if (!res.ok) throw new Error(`Failed to load FAQ sources (${res.status})`);
  const data = await res.json();
  return data.sources || [];
}

// Upload a plain-text FAQ. Accepts a File (from drag/drop) — sent as multipart.
export async function uploadFAQ(businessId, file) {
  const form = new FormData();
  form.append("business_id", businessId);
  form.append("file", file);
  const res = await fetch(`${API_URL}/api/faq/upload`, { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
  return data;
}

export async function sendChat(businessId, message) {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ business_id: businessId, message }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Chat failed (${res.status})`);
  return data;
}
