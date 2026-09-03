import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DailyPoint } from '@electricity/shared';
import { ChartCard } from './ChartCard.js';
import { ChartTooltip, fromRechartsPayload } from './ChartTooltip.js';
import { CHART_CHROME, SERIES } from '../../utils/chartColors.js';
import { formatDate, formatKwh } from '../../utils/formatters.js';

export function ConsumptionAreaChart({ points }: { points: DailyPoint[] }) {
  let cumulative = 0;
  const data = points.map((p) => {
    cumulative += p.kwh;
    return { date: p.date, cumulativeKwh: cumulative };
  });

  return (
    <ChartCard title="Cumulative consumption this month" subtitle="Running total kWh — resets at the start of each month">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="cumulativeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SERIES.blue} stopOpacity={0.25} />
                <stop offset="100%" stopColor={SERIES.blue} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART_CHROME.gridline} vertical={false} />
            <XAxis dataKey="date" tickFormatter={formatDate} stroke={CHART_CHROME.textMuted} tick={{ fontSize: 11 }} />
            <YAxis stroke={CHART_CHROME.textMuted} tick={{ fontSize: 11 }} width={48} />
            <Tooltip
              content={({ active, label, payload }) => (
                <ChartTooltip
                  active={active}
                  label={label ? formatDate(label) : undefined}
                  entries={fromRechartsPayload(payload).map((e) => ({ ...e, name: 'Cumulative' }))}
                  formatValue={(v) => formatKwh(v)}
                />
              )}
            />
            <Area type="monotone" dataKey="cumulativeKwh" stroke={SERIES.blue} strokeWidth={2} fill="url(#cumulativeFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
