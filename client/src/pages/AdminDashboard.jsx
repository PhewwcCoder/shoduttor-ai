// AdminDashboard — business owner view: upload FAQ, see live tickets + stats.
import { useEffect, useState, useCallback } from "react";
import StatsBar from "../components/StatsBar";
import FAQUploader from "../components/FAQUploader";
import TicketList from "../components/TicketList";
import BusinessSelect from "../components/BusinessSelect";
import { getTickets, getStats, getBusinesses } from "../lib/api";

// Example IDs across industries, always offered so a fresh DB isn't empty.
const EXAMPLE_BUSINESSES = ["grameenphone", "pathao", "robi", "deshi-threads", "dhaka-bank", "foodpanda-bd"];

export default function AdminDashboard() {
  const [businessId, setBusinessId] = useState("grameenphone");
  const [businesses, setBusinesses] = useState(EXAMPLE_BUSINESSES);
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, s] = await Promise.all([getTickets(businessId), getStats(businessId)]);
      setTickets(t);
      setStats(s);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  // Reload on business change, then poll every 5s so the table feels live.
  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [load]);

  // Fetch the real list of businesses with data; merge with examples (deduped).
  const refreshBusinesses = useCallback(async () => {
    try {
      const live = await getBusinesses();
      setBusinesses([...new Set([...EXAMPLE_BUSINESSES, ...live])]);
    } catch {
      /* keep examples on failure */
    }
  }, []);

  useEffect(() => {
    refreshBusinesses();
  }, [refreshBusinesses]);

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-green-600">Shoduttor.ai</span>
          <span className="text-sm text-gray-400">Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Business ID</label>
          <BusinessSelect value={businessId} options={businesses} onChange={setBusinessId} />
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 p-6">
        {error && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {error} — is the backend running on the API URL?
          </div>
        )}

        <StatsBar
          stats={stats}
          resolved={tickets.filter((t) => t.resolved).length}
          escalated={tickets.filter((t) => !t.resolved).length}
        />

        <FAQUploader
          businessId={businessId}
          onUploaded={() => { load(); refreshBusinesses(); }}
        />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              Incoming tickets <span className="text-gray-400">({tickets.length})</span>
            </h2>
            <span className="text-xs text-gray-400">Auto-refreshing every 5s</span>
          </div>
          <TicketList tickets={tickets} loading={loading && tickets.length === 0} />
        </div>
      </main>
    </div>
  );
}
