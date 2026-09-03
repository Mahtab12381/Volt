import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { HourlyBucket } from '@electricity/shared';
import { ChartCard } from './ChartCard.js';
import { ChartTooltip, fromRechartsPayload } from './ChartTooltip.js';
import { CHART_CHROME, SEQUENTIAL_BLUE } from '../../utils/chartColors.js';
import { formatHour, formatKwh } from '../../utils/formatters.js';

export function HourlyHeatmap({ buckets }: { buckets: HourlyBucket[] }) {
  const max = Math.max(...buckets.map((b) => b.kwh), 0.0001);

  function colorFor(kwh: number): string {
    const ratio = kwh / max;
    const idx = Math.min(SEQUENTIAL_BLUE.length - 1, Math.floor(ratio * SEQUENTIAL_BLUE.length));
    return SEQUENTIAL_BLUE[idx];
  }

  return (
    <ChartCard title="Usage by hour of day" subtitle="Average kWh per hour across the selected range">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={buckets} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="10%">
            <CartesianGrid stroke={CHART_CHROME.gridline} vertical={false} />
            <XAxis dataKey="hour" tickFormatter={formatHour} stroke={CHART_CHROME.textMuted} tick={{ fontSize: 10 }} interval={2} />
            <YAxis stroke={CHART_CHROME.textMuted} tick={{ fontSize: 11 }} width={48} />
            <Tooltip
              cursor={{ fill: 'var(--surface-hover)' }}
              content={({ active, label, payload }) => (
                <ChartTooltip
                  active={active}
                  label={typeof label === 'number' ? formatHour(label) : undefined}
                  entries={fromRechartsPayload(payload).map((e) => ({ ...e, name: 'Usage' }))}
                  formatValue={(v) => formatKwh(v, 3)}
                />
              )}
            />
            <Bar dataKey="kwh" radius={[3, 3, 0, 0]} maxBarSize={18}>
              {buckets.map((b) => (
                <Cell key={b.hour} fill={colorFor(b.kwh)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
