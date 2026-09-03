import { PageHeader } from '../components/layout/PageHeader.js';
import { KpiRow, StatTile } from '../components/layout/StatTile.js';
import { LowBalanceBanner } from '../components/layout/LowBalanceBanner.js';
import { BalanceTrendChart } from '../components/charts/BalanceTrendChart.js';
import { ConsumptionAreaChart } from '../components/charts/ConsumptionAreaChart.js';
import { UsageBarChart } from '../components/charts/UsageBarChart.js';
import { DayNightComparisonChart } from '../components/charts/DayNightComparisonChart.js';
import { ProjectionChart } from '../components/charts/ProjectionChart.js';
import { HourlyHeatmap } from '../components/charts/HourlyHeatmap.js';
import {
  useBalanceSeries,
  useDaily,
  useDayVsNight,
  useHourlyAverage,
  useMonthly,
  useSummary,
  useTrend,
  useWeekly,
} from '../hooks/useAnalytics.js';
import { formatDate, formatKwh, formatTk } from '../utils/formatters.js';

export function DashboardPage() {
  const summary = useSummary();
  const trend = useTrend();
  const balanceSeries = useBalanceSeries();
  const daily = useDaily();
  const weekly = useWeekly();
  const monthly = useMonthly();
  const dayNight = useDayVsNight();
  const hourly = useHourlyAverage();

  const isLoading = summary.isLoading || balanceSeries.isLoading || daily.isLoading;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Dashboard" subtitle="Your electricity consumption at a glance." />

      {summary.data && (
        <LowBalanceBanner
          currentBalanceTk={summary.data.currentBalanceTk}
          estimatedDaysUntilExhaustion={summary.data.estimatedDaysUntilExhaustion}
        />
      )}

      {isLoading || !summary.data ? (
        <p className="text-sm text-ink-muted">Loading dashboard…</p>
      ) : (
        <>
          <div className="mb-8">
            <KpiRow>
              <StatTile label="Current balance" value={formatTk(summary.data.currentBalanceTk)} />
              <StatTile
                label="This month's usage"
                value={formatKwh(summary.data.cumulativeKwhThisMonth)}
                hint={formatTk(summary.data.cumulativeTkThisMonth) + ' spent'}
              />
              <StatTile
                label="Projected month-end bill"
                value={formatTk(summary.data.projectedMonthlyBillTk)}
                hint={`~${formatKwh(summary.data.projectedMonthlyKwh)} total`}
              />
              <StatTile
                label="Lifeline status"
                value={summary.data.lifelineEligible ? 'On track' : 'Lost this month'}
                badge={
                  !summary.data.lifelineEligible
                    ? { text: 'Standard rates', tone: 'critical' }
                    : summary.data.lifelineAtRisk
                      ? { text: 'At risk (near 50 kWh)', tone: 'warning' }
                      : { text: 'Within lifeline', tone: 'good' }
                }
              />
            </KpiRow>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {balanceSeries.data && <BalanceTrendChart points={balanceSeries.data.points} />}
            {daily.data && <ConsumptionAreaChart points={daily.data.points} />}
            {trend.data && <ProjectionChart trend={trend.data} />}
            {dayNight.data && <DayNightComparisonChart data={dayNight.data} />}
            {hourly.data && <HourlyHeatmap buckets={hourly.data.buckets} />}
            {daily.data && (
              <UsageBarChart
                title="Daily usage"
                subtitle="kWh consumed per day"
                data={daily.data.points.map((p) => ({ key: p.date, kwh: p.kwh }))}
                tickFormatter={formatDate}
              />
            )}
            {weekly.data && weekly.data.points.length > 0 && (
              <UsageBarChart
                title="Weekly usage"
                subtitle="kWh consumed per ISO week"
                data={weekly.data.points.map((p) => ({ key: p.weekStart, kwh: p.kwh }))}
                tickFormatter={formatDate}
              />
            )}
            {monthly.data && monthly.data.points.length > 0 && (
              <UsageBarChart
                title="Monthly usage"
                subtitle="kWh consumed per calendar month"
                data={monthly.data.points.map((p) => ({ key: p.month, kwh: p.kwh }))}
                tickFormatter={(k) => k}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
