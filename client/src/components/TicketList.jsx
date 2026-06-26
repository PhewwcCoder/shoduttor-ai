// TicketList — a table of incoming tickets with intent/sentiment badges.
import IntentBadge from "./IntentBadge";

function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function TicketList({ tickets, loading }) {
  if (loading) return <div className="p-6 text-sm text-gray-500">Loading tickets…</div>;
  if (!tickets || tickets.length === 0)
    return <div className="p-6 text-sm text-gray-500">No tickets yet. Send a message from the widget to see one appear here.</div>;

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Customer message</th>
            <th className="px-4 py-3">Translation</th>
            <th className="px-4 py-3">Intent</th>
            <th className="px-4 py-3">Sentiment</th>
            <th className="px-4 py-3">Location</th>
            <th className="px-4 py-3">Department</th>
            <th className="px-4 py-3">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {tickets.map((t) => (
            <tr key={t.id} className="align-top hover:bg-gray-50">
              <td className="px-4 py-3">
                {t.resolved ? (
                  <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                    resolved
                  </span>
                ) : (
                  <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                    escalated
                  </span>
                )}
              </td>
              <td className="px-4 py-3 font-medium text-gray-900">{t.original_message}</td>
              <td className="px-4 py-3 text-gray-600">{t.english_translation}</td>
              <td className="px-4 py-3"><IntentBadge value={t.intent} kind="intent" /></td>
              <td className="px-4 py-3"><IntentBadge value={t.sentiment} kind="sentiment" /></td>
              <td className="px-4 py-3 text-gray-700">{t.location || <span className="text-gray-300">—</span>}</td>
              <td className="px-4 py-3 text-gray-700">{t.department}</td>
              <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-400">{timeAgo(t.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
