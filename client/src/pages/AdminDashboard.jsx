// AdminDashboard — business owner view: upload FAQ, see live tickets + stats.
import { useEffect, useState, useCallback } from "react";
import StatsBar from "../components/StatsBar";
import FAQUploader from "../components/FAQUploader";
import TicketList from "../components/TicketList";
import BusinessSelect from "../components/BusinessSelect";
import { ChatIcon } from "../components/icons";
import { getTickets, getStats, getBusinesses } from "../lib/api";

// Example IDs across industries, always offered so a fresh DB isn't empty.
const EXAMPLE_BUSINESSES = ["grameenphone", "pathao", "jerseyverse", "robi", "deshi-threads", "dhaka-bank", "foodpanda-bd"];
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

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

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [load]);

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
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600 text-white">
              <ChatIcon />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900">সদুত্তর<span className="text-green-600">.ai</span></span>
              <span className="hidden text-sm text-gray-400 sm:inline">Admin Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <BusinessSelect value={businessId} options={businesses} onChange={setBusinessId} />
            <div className="h-6 w-px bg-gray-200" />
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">
              SA
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        {/* Title row */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Support overview</h1>
            <p className="mt-1 text-sm text-gray-500">
              Live snapshot of every conversation Shoduttor is handling for {cap(businessId)}.
            </p>
          </div>
          <span className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            Live · auto-refreshing every 5s
          </span>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error} — is the backend running on the API URL?
          </div>
        )}

        <StatsBar stats={stats} tickets={tickets} />

        <FAQUploader
          businessId={businessId}
          onUploaded={() => { load(); refreshBusinesses(); }}
        />

        {/* Incoming tickets */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900">Incoming tickets</h2>
              <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                {tickets.length} live
              </span>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Auto-refreshing every 5s
            </span>
          </div>
          <TicketList tickets={tickets} loading={loading && tickets.length === 0} />
        </div>
      </main>
    </div>
  );
}
