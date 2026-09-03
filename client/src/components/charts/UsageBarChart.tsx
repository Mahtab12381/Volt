import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from './ChartCard.js';
import { ChartTooltip, fromRechartsPayload } from './ChartTooltip.js';
import { CHART_CHROME, SERIES } from '../../utils/chartColors.js';
import { formatKwh } from '../../utils/formatters.js';

export interface UsageBarPoint {
  key: string;
  kwh: number;
}

export function UsageBarChart({
  title,
  subtitle,
  data,
  tickFormatter,
  tooltipLabelFormatter,
}: {
  title: string;
  subtitle?: string;
  data: UsageBarPoint[];
  tickFormatter: (key: string) => string;
  tooltipLabelFormatter?: (key: string) => string;
}) {
  return (
    <ChartCard title={title} subtitle={subtitle}>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="20%">
            <CartesianGrid stroke={CHART_CHROME.gridline} vertical={false} />
            <XAxis dataKey="key" tickFormatter={tickFormatter} stroke={CHART_CHROME.textMuted} tick={{ fontSize: 11 }} />
            <YAxis stroke={CHART_CHROME.textMuted} tick={{ fontSize: 11 }} width={48} />
            <Tooltip
              cursor={{ fill: 'var(--surface-hover)' }}
              content={({ active, label, payload }) => (
                <ChartTooltip
                  active={active}
                  label={label ? (tooltipLabelFormatter ?? tickFormatter)(label) : undefined}
                  entries={fromRechartsPayload(payload).map((e) => ({ ...e, name: 'Usage' }))}
                  formatValue={(v) => formatKwh(v)}
                />
              )}
            />
            <Bar dataKey="kwh" fill={SERIES.blue} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
