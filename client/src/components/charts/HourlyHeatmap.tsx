import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { HourlyBucket, UnitMode } from '@electricity/shared';
import { ChartCard } from './ChartCard.js';
import { ChartTooltip, fromRechartsPayload } from './ChartTooltip.js';
import { CHART_CHROME, SEQUENTIAL_BLUE } from '../../utils/chartColors.js';
import { formatHour, formatKwh, formatTk } from '../../utils/formatters.js';

export function HourlyHeatmap({ buckets, unit }: { buckets: HourlyBucket[]; unit: UnitMode }) {
  const valueOf = (b: HourlyBucket) => (unit === 'kwh' ? b.kwh : b.tk);
  const max = Math.max(...buckets.map(valueOf), 0.0001);
  const formatValue = unit === 'kwh' ? (v: number) => formatKwh(v, 3) : (v: number) => formatTk(v, 2);

  function colorFor(value: number): string {
    const ratio = value / max;
    const idx = Math.min(SEQUENTIAL_BLUE.length - 1, Math.floor(ratio * SEQUENTIAL_BLUE.length));
    return SEQUENTIAL_BLUE[idx];
  }

  const data = buckets.map((b) => ({ hour: b.hour, value: valueOf(b) }));

  return (
    <ChartCard
      title="Usage by hour of day"
      subtitle={`Average ${unit === 'kwh' ? 'kWh' : 'Tk'} per hour across the selected range`}
    >
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="10%">
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
                  formatValue={formatValue}
                />
              )}
            />
            <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={18}>
              {data.map((d) => (
                <Cell key={d.hour} fill={colorFor(d.value)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
