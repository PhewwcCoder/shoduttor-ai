// StatsBar — the four summary cards at the top of the dashboard.
import ResolutionDonut from "./ResolutionDonut";

function Card({ label, value, accent }) {
  return (
    <div className="flex-1 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${accent || "text-gray-900"}`}>{value}</div>
    </div>
  );
}

export default function StatsBar({ stats, resolved = 0, escalated = 0 }) {
  if (!stats) return null;
  return (
    <div className="flex flex-wrap gap-4">
      <Card label="Tickets today" value={stats.today ?? 0} />
      <ResolutionDonut resolved={resolved} escalated={escalated} />
      <Card label="Top intent" value={stats.top_intent || "—"} />
      <Card label="Top location" value={stats.top_location || "—"} />
    </div>
  );
}
