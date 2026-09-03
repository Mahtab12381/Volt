import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DayNightResponse, UnitMode } from '@electricity/shared';
import { ChartCard } from './ChartCard.js';
import { ChartLegend } from './ChartLegend.js';
import { ChartTooltip, fromRechartsPayload } from './ChartTooltip.js';
import { CHART_CHROME, SERIES } from '../../utils/chartColors.js';
import { formatDate, formatKwh, formatTk } from '../../utils/formatters.js';

export function DayNightComparisonChart({ data, unit }: { data: DayNightResponse; unit: UnitMode }) {
  const dayKey = unit === 'kwh' ? 'dayKwh' : 'dayTk';
  const nightKey = unit === 'kwh' ? 'nightKwh' : 'nightTk';
  const formatValue = unit === 'kwh' ? formatKwh : formatTk;

  return (
    <ChartCard title={`Day vs. night ${unit === 'kwh' ? 'usage' : 'spend'}`} subtitle="Day = 7am–7pm, Night = 7pm–7am">
      <ChartLegend
        items={[
          { label: 'Day', color: SERIES.blue },
          { label: 'Night', color: SERIES.orange },
        ]}
      />
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.byDay} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="20%">
            <CartesianGrid stroke={CHART_CHROME.gridline} vertical={false} />
            <XAxis dataKey="date" tickFormatter={formatDate} stroke={CHART_CHROME.textMuted} tick={{ fontSize: 11 }} />
            <YAxis stroke={CHART_CHROME.textMuted} tick={{ fontSize: 11 }} width={48} />
            <Tooltip
              cursor={{ fill: 'var(--surface-hover)' }}
              content={({ active, label, payload }) => (
                <ChartTooltip active={active} label={label ? formatDate(label) : undefined} entries={fromRechartsPayload(payload)} formatValue={formatValue} />
              )}
            />
            <Bar dataKey={dayKey} name="Day" fill={SERIES.blue} radius={[4, 4, 0, 0]} maxBarSize={16} />
            <Bar dataKey={nightKey} name="Night" fill={SERIES.orange} radius={[4, 4, 0, 0]} maxBarSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
