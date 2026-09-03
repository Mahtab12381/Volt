import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TrendResponse } from '@electricity/shared';
import { ChartCard } from './ChartCard.js';
import { ChartTooltip, fromRechartsPayload } from './ChartTooltip.js';
import { CHART_CHROME, SERIES } from '../../utils/chartColors.js';
import { formatDate, formatTk } from '../../utils/formatters.js';

export function ProjectionChart({ trend }: { trend: TrendResponse }) {
  let cumulative = 0;
  const actualPoints = trend.actual.map((p) => {
    cumulative += p.tk;
    return { date: p.date, actualTk: cumulative, projectedTk: null as number | null };
  });

  let projCumulative = cumulative;
  const lastActualDate = actualPoints[actualPoints.length - 1]?.date;
  const bridgePoint = lastActualDate ? [{ date: lastActualDate, actualTk: null, projectedTk: cumulative }] : [];
  const projectedPoints = trend.projected.map((p) => {
    projCumulative += p.tk;
    return { date: p.date, actualTk: null as number | null, projectedTk: projCumulative };
  });

  const data = [...actualPoints, ...bridgePoint, ...projectedPoints];

  return (
    <ChartCard title="Spend trend &amp; projection" subtitle="Cumulative Tk spent this month, projected to month-end">
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-ink-secondary">
        <span className="flex items-center gap-1.5">
          <svg width="16" height="8">
            <line x1="0" y1="4" x2="16" y2="4" stroke={SERIES.blue} strokeWidth="2" />
          </svg>
          Actual
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="16" height="8">
            <line x1="0" y1="4" x2="16" y2="4" stroke={SERIES.blue} strokeWidth="2" strokeDasharray="3 3" opacity={0.6} />
          </svg>
          Projected
        </span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={CHART_CHROME.gridline} vertical={false} />
            <XAxis dataKey="date" tickFormatter={formatDate} stroke={CHART_CHROME.textMuted} tick={{ fontSize: 11 }} />
            <YAxis stroke={CHART_CHROME.textMuted} tick={{ fontSize: 11 }} width={56} tickFormatter={(v: number) => `৳${v}`} />
            {lastActualDate && <ReferenceLine x={lastActualDate} stroke={CHART_CHROME.baseline} strokeDasharray="2 2" />}
            <Tooltip
              content={({ active, label, payload }) => (
                <ChartTooltip
                  active={active}
                  label={label ? formatDate(label) : undefined}
                  entries={fromRechartsPayload(payload).filter((e) => e.value !== null)}
                  formatValue={(v) => formatTk(v)}
                />
              )}
            />
            <Line type="monotone" dataKey="actualTk" name="Actual" stroke={SERIES.blue} strokeWidth={2} dot={false} connectNulls />
            <Line
              type="monotone"
              dataKey="projectedTk"
              name="Projected"
              stroke={SERIES.blue}
              strokeOpacity={0.6}
              strokeDasharray="4 4"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
