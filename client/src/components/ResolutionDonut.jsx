// ResolutionDonut — replaces the static "Auto-resolved %" KPI card with a small
// donut: Auto-Resolved by AI (green) vs Escalated to Humans (amber). Sized to fit
// the existing metric-row card height (donut + legend laid out horizontally).
import { PieChart, Pie, Cell, Tooltip } from "recharts";

// Match the dashboard badge palette: resolved=green, escalated=amber.
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

export default function ResolutionDonut({ resolved = 0, escalated = 0 }) {
  const total = resolved + escalated;
  const pct = total ? Math.round((resolved / total) * 100) : 0;

  const data = [
    { name: "Auto-Resolved by AI", value: resolved, key: "resolved" },
    { name: "Escalated to Humans", value: escalated, key: "escalated" },
  ];

  return (
    <div className="flex-1 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Donut with the resolved % in the center */}
        <div className="relative shrink-0" style={{ width: 56, height: 56 }}>
          {total === 0 ? (
            // Empty state: a flat gray ring so the card never looks broken.
            <div className="h-14 w-14 rounded-full border-[7px] border-gray-100" />
          ) : (
            <PieChart width={56} height={56}>
              <Pie
                data={data}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={16}
                outerRadius={27}
                startAngle={90}
                endAngle={-270}
                paddingAngle={resolved > 0 && escalated > 0 ? 2 : 0}
                stroke="none"
                isAnimationActive={false}
              >
                {data.map((d) => (
                  <Cell key={d.key} fill={COLORS[d.key]} />
                ))}
              </Pie>
              <Tooltip
                content={<DonutTooltip total={total} />}
                wrapperStyle={{ outline: "none", zIndex: 30 }}
              />
            </PieChart>
          )}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="text-[11px] font-bold text-gray-900">{pct}%</span>
          </div>
        </div>

        {/* Legend */}
        <div className="min-w-0">
          <div className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
            Resolution
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-600">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: COLORS.resolved }} />
            Auto-resolved <span className="font-semibold text-gray-900">{resolved}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: COLORS.escalated }} />
            Escalated <span className="font-semibold text-gray-900">{escalated}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
