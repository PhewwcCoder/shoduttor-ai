// StatsBar — the four polished KPI cards at the top of the dashboard.
import ResolutionDonut from "./ResolutionDonut";
import { ChatIcon, SlidersIcon, PinIcon } from "./icons";

// Shared card shell.
function Card({ children, className = "" }) {
  return (
    <div className={`flex-1 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function Label({ children }) {
  return <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{children}</div>;
}

// A tinted rounded-square icon chip (top-right of a card).
function Chip({ children, tint }) {
  return (
    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tint}`}>{children}</div>
  );
}

// Counts of tickets per day for the last 7 days (for the sparkline).
function last7Days(tickets) {
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push({ key: d.toISOString().slice(0, 10), count: 0 });
  }
  const idx = Object.fromEntries(days.map((d, i) => [d.key, i]));
  for (const t of tickets) {
    const k = (t.created_at || "").slice(0, 10);
    if (k in idx) days[idx[k]].count++;
  }
  return days;
}

export default function StatsBar({ stats, tickets = [] }) {
  if (!stats) return null;

  const total = tickets.length;
  const resolved = tickets.filter((t) => t.resolved).length;
  const escalated = total - resolved;

  const topIntent = stats.top_intent || null;
  const topIntentCount = topIntent ? tickets.filter((t) => t.intent === topIntent).length : 0;
  const intentPct = total ? Math.round((topIntentCount / total) * 100) : 0;

  const spark = last7Days(tickets);
  const sparkMax = Math.max(1, ...spark.map((d) => d.count));

  return (
    <div className="flex flex-wrap gap-4">
      {/* Tickets today + sparkline */}
      <Card>
        <div className="flex items-start justify-between">
          <Label>Tickets today</Label>
          <Chip tint="bg-green-50 text-green-600"><ChatIcon /></Chip>
        </div>
        <div className="mt-1 text-4xl font-bold text-gray-900">{stats.today ?? 0}</div>
        <div className="mt-3 flex h-8 items-end gap-1">
          {spark.map((d, i) => (
            <div
              key={d.key}
              title={`${d.key}: ${d.count}`}
              className={`flex-1 rounded-sm ${i === spark.length - 1 ? "bg-green-500" : "bg-green-100"}`}
              style={{ height: `${Math.max(12, (d.count / sparkMax) * 100)}%` }}
            />
          ))}
        </div>
      </Card>

      {/* Resolution rate donut */}
      <Card className="min-w-[280px]">
        <div className="flex items-start justify-between">
          <Label>Resolution rate</Label>
          {escalated > 0 ? (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
              {escalated} need an agent
            </span>
          ) : (
            <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-medium text-green-700">
              all auto-resolved
            </span>
          )}
        </div>
        <div className="mt-2 flex items-center gap-4">
          <ResolutionDonut resolved={resolved} escalated={escalated} size={112} />
          <div className="min-w-0 flex-1 space-y-2">
            <LegendRow color="#16a34a" label="Auto-resolved" value={resolved} />
            <LegendRow color="#f59e0b" label="Escalated to agent" value={escalated} />
          </div>
        </div>
      </Card>

      {/* Top intent + share bar */}
      <Card>
        <div className="flex items-start justify-between">
          <Label>Top intent</Label>
          <Chip tint="bg-indigo-50 text-indigo-500"><SlidersIcon /></Chip>
        </div>
        <div className="mt-3 text-3xl font-bold capitalize text-gray-900">{topIntent || "—"}</div>
        {topIntent ? (
          <>
            <div className="mt-1 text-xs text-gray-400">{topIntentCount} of {total} tickets</div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-blue-600" style={{ width: `${intentPct}%` }} />
            </div>
          </>
        ) : (
          <div className="mt-1 text-xs text-gray-400">No tickets yet</div>
        )}
      </Card>

      {/* Top location */}
      <Card>
        <div className="flex items-start justify-between">
          <Label>Top location</Label>
          <Chip tint="bg-gray-50 text-gray-400"><PinIcon /></Chip>
        </div>
        {stats.top_location ? (
          <div className="mt-3 text-3xl font-bold text-gray-900">{stats.top_location}</div>
        ) : (
          <>
            <div className="mt-3 text-2xl font-bold leading-tight text-gray-300">Not enough<br />data yet</div>
            <div className="mt-2 text-xs text-gray-400">Locations appear once tickets include an address.</div>
          </>
        )}
      </Card>
    </div>
  );
}

function LegendRow({ color, label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-gray-600">
        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        {label}
      </span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}
