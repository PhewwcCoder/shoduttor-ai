// TicketList — the incoming-tickets table. Renders just the table (the card
// chrome + section header live in AdminDashboard).
import IntentBadge from "./IntentBadge";

const SENTIMENT_DOT = {
  frustrated: "#fb923c",
  urgent: "#ef4444",
  angry: "#ef4444",
  confused: "#eab308",
  neutral: "#9ca3af",
};

function fmtTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}, ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export default function TicketList({ tickets, loading }) {
  if (loading) return <div className="px-6 py-10 text-center text-sm text-gray-400">Loading tickets…</div>;
  if (!tickets || tickets.length === 0)
    return (
      <div className="px-6 py-10 text-center text-sm text-gray-400">
        No tickets yet. Send a message from the widget to see one appear here.
      </div>
    );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-[11px] uppercase tracking-wider text-gray-400">
            <th className="px-5 py-3 font-semibold">Status</th>
            <th className="px-5 py-3 font-semibold">Customer message</th>
            <th className="px-5 py-3 font-semibold">Translation</th>
            <th className="px-5 py-3 font-semibold">Intent</th>
            <th className="px-5 py-3 font-semibold">Sentiment</th>
            <th className="px-5 py-3 font-semibold">Department</th>
            <th className="px-5 py-3 font-semibold">Time</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id} className="border-b border-gray-50 align-top last:border-0 hover:bg-gray-50/60">
              <td className="px-5 py-4">
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: t.resolved ? "#16a34a" : "#f59e0b" }}
                  />
                  <span className={`text-xs font-medium ${t.resolved ? "text-green-700" : "text-amber-700"}`}>
                    {t.resolved ? "resolved" : "escalated"}
                  </span>
                </span>
              </td>
              <td className="max-w-[220px] px-5 py-4 font-semibold text-gray-900">{t.original_message}</td>
              <td className="max-w-[260px] px-5 py-4 text-gray-500">{t.english_translation}</td>
              <td className="px-5 py-4"><IntentBadge value={t.intent} kind="intent" /></td>
              <td className="px-5 py-4">
                <span className="flex items-center gap-1.5 whitespace-nowrap text-gray-600">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: SENTIMENT_DOT[t.sentiment] || "#9ca3af" }} />
                  <span className="capitalize">{t.sentiment}</span>
                </span>
              </td>
              <td className="px-5 py-4 whitespace-nowrap text-gray-700">{t.department}</td>
              <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-400">{fmtTime(t.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
