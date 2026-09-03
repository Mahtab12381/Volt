import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { BalanceSeriesPoint } from '@electricity/shared';
import { ChartCard } from './ChartCard.js';
import { ChartTooltip, fromRechartsPayload } from './ChartTooltip.js';
import { CHART_CHROME, SERIES } from '../../utils/chartColors.js';
import { formatDateTime, formatTk } from '../../utils/formatters.js';

export function BalanceTrendChart({ points }: { points: BalanceSeriesPoint[] }) {
  const data = points.map((p) => ({ timestamp: p.timestamp, balanceTk: p.balanceTk, isRecharge: p.isRecharge }));

  return (
    <ChartCard title="Balance over time" subtitle="Raw meter balance readings (Tk)">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={CHART_CHROME.gridline} vertical={false} />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(v: string) => formatDateTime(v)}
              stroke={CHART_CHROME.textMuted}
              tick={{ fontSize: 11 }}
              minTickGap={40}
            />
            <YAxis
              stroke={CHART_CHROME.textMuted}
              tick={{ fontSize: 11 }}
              width={56}
              tickFormatter={(v: number) => `৳${v}`}
            />
            <Tooltip
              content={({ active, label, payload }) => (
                <ChartTooltip
                  active={active}
                  label={label ? formatDateTime(label) : undefined}
                  entries={fromRechartsPayload(payload).map((e) => ({ ...e, name: 'Balance' }))}
                  formatValue={(v) => formatTk(v)}
                />
              )}
            />
            <Line
              type="monotone"
              dataKey="balanceTk"
              stroke={SERIES.blue}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
