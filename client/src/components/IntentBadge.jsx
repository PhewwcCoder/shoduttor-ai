// IntentBadge — a small colored pill for an intent or sentiment value.
const INTENT_COLORS = {
  billing: "bg-amber-100 text-amber-800",
  technical: "bg-blue-100 text-blue-800",
  subscription: "bg-violet-100 text-violet-800",
  product: "bg-teal-100 text-teal-800",
  delivery: "bg-sky-100 text-sky-800",
  account: "bg-indigo-100 text-indigo-800",
  complaint: "bg-rose-100 text-rose-800",
  general: "bg-slate-100 text-slate-700",
};

const SENTIMENT_COLORS = {
  frustrated: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
  angry: "bg-red-100 text-red-800",
  confused: "bg-yellow-100 text-yellow-800",
  neutral: "bg-gray-100 text-gray-600",
};

export default function IntentBadge({ value, kind = "intent" }) {
  if (!value) return <span className="text-gray-300">—</span>;
  const map = kind === "sentiment" ? SENTIMENT_COLORS : INTENT_COLORS;
  const cls = map[value] || "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${cls}`}>
      {value}
    </span>
  );
}
