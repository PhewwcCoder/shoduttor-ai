// ResolutionDonut — just the donut (Auto-Resolved green vs Escalated amber) with
// the resolved % in the center and hover tooltips. The card chrome + legend live
// in StatsBar so the donut can be composed into the Resolution Rate card.
import { PieChart, Pie, Cell, Tooltip } from "recharts";

const COLORS = { resolved: "#16a34a", escalated: "#f59e0b" };

function DonutTooltip({ active, payload, total }) {
  if (!active || !payload || !payload.length) return null;
  const slice = payload[0].payload;
  const pct = total ? Math.round((slice.value / total) * 100) : 0;
  return (
    <div className="rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg">
      {slice.name}: {slice.value} ticket{slice.value === 1 ? "" : "s"} ({pct}%)
    </div>
  );
}

export default function ResolutionDonut({ resolved = 0, escalated = 0, size = 116 }) {
  const total = resolved + escalated;
  const pct = total ? Math.round((resolved / total) * 100) : 0;
  const outer = size / 2;
  const inner = outer - 13;

  const data = [
    { name: "Auto-Resolved by AI", value: resolved, key: "resolved" },
    { name: "Escalated to Humans", value: escalated, key: "escalated" },
  ];

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {total === 0 ? (
        <div
          className="rounded-full border-gray-100"
          style={{ width: size, height: size, borderWidth: 13 }}
        />
      ) : (
        <PieChart width={size} height={size}>
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={inner}
            outerRadius={outer}
            startAngle={90}
            endAngle={-270}
            paddingAngle={resolved > 0 && escalated > 0 ? 2 : 0}
            stroke="none"
            cornerRadius={4}
            isAnimationActive={false}
          >
            {data.map((d) => (
              <Cell key={d.key} fill={COLORS[d.key]} />
            ))}
          </Pie>
          <Tooltip content={<DonutTooltip total={total} />} wrapperStyle={{ outline: "none", zIndex: 30 }} />
        </PieChart>
      )}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold leading-none text-gray-900">{pct}%</span>
        <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-400">
          Resolved
        </span>
      </div>
    </div>
  );
}
