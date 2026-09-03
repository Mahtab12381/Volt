import { useEffect, useState } from 'react';
import type { UnitMode } from '@electricity/shared';
import { PageHeader } from '../components/layout/PageHeader.js';
import { KpiRow, StatTile } from '../components/layout/StatTile.js';
import { LowBalanceBanner } from '../components/layout/LowBalanceBanner.js';
import { UsageVsBudgetCard } from '../components/layout/UsageVsBudgetCard.js';
import { UnitToggle } from '../components/layout/UnitToggle.js';
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
import { useSettings } from '../hooks/useSettings.js';
import { formatDate, formatKwh, formatTk } from '../utils/formatters.js';

export function DashboardPage() {
  const settings = useSettings();
  const summary = useSummary();
  const trend = useTrend();
  const balanceSeries = useBalanceSeries();
  const daily = useDaily();
  const weekly = useWeekly();
  const monthly = useMonthly();
  const dayNight = useDayVsNight();
  const hourly = useHourlyAverage();

  const [unit, setUnit] = useState<UnitMode>('kwh');
  const [unitInitialized, setUnitInitialized] = useState(false);

  // Seed the session's toggle from the saved default exactly once, without
  // fighting later manual switches on every settings refetch.
  useEffect(() => {
    if (!unitInitialized && settings.data) {
      setUnit(settings.data.defaultUnitMode);
      setUnitInitialized(true);
    }
  }, [settings.data, unitInitialized]);

  const usageBarFormat = unit === 'kwh' ? formatKwh : formatTk;
  const isLoading = summary.isLoading || balanceSeries.isLoading || daily.isLoading;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Dashboard"
        subtitle="Your electricity consumption at a glance."
        action={<UnitToggle value={unit} onChange={setUnit} />}
      />

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
                label="Projected tariff slab"
                value={`${formatTk(summary.data.projectedSlab.rateTkPerKwh)}/kWh`}
                hint={
                  summary.data.projectedSlab.maxKwh === null
                    ? `${summary.data.projectedSlab.minKwh}+ kWh`
                    : `${summary.data.projectedSlab.minKwh}–${summary.data.projectedSlab.maxKwh} kWh`
                }
                badge={summary.data.projectedSlab.track === 'lifeline' ? { text: 'Lifeline rate', tone: 'good' } : undefined}
              />
              <StatTile
                label="Projected month-end bill"
                value={formatTk(summary.data.projectedMonthlyBillTk)}
                hint={`~${formatKwh(summary.data.projectedMonthlyKwh)} total`}
              />
              <StatTile
                label="Budget status"
                value={
                  summary.data.budgetStatus === 'not_set'
                    ? 'No budget set'
                    : summary.data.budgetStatus === 'over_budget'
                      ? 'Over budget'
                      : summary.data.budgetStatus === 'at_risk'
                        ? 'At risk'
                        : 'On track'
                }
                hint={
                  summary.data.budgetStatus === 'not_set'
                    ? 'Set one in Settings'
                    : `${formatTk(summary.data.projectedMonthlyBillTk)} of ${formatTk(summary.data.monthlyBudgetTk)}`
                }
                badge={
                  summary.data.budgetStatus === 'not_set'
                    ? undefined
                    : summary.data.budgetStatus === 'over_budget'
                      ? { text: `${Math.round(summary.data.budgetUsedPercent ?? 0)}% of budget`, tone: 'critical' }
                      : summary.data.budgetStatus === 'at_risk'
                        ? { text: `${Math.round(summary.data.budgetUsedPercent ?? 0)}% of budget`, tone: 'warning' }
                        : { text: `${Math.round(summary.data.budgetUsedPercent ?? 0)}% of budget`, tone: 'good' }
                }
              />
            </KpiRow>
          </div>

          <div className="mb-8 max-w-xl">
            <UsageVsBudgetCard
              cumulativeTkThisMonth={summary.data.cumulativeTkThisMonth}
              cumulativeKwhThisMonth={summary.data.cumulativeKwhThisMonth}
              monthlyBudgetTk={summary.data.monthlyBudgetTk}
              budgetStatus={summary.data.budgetStatus}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {daily.data && (
              <UsageBarChart
                title="Daily usage"
                subtitle={`${unit === 'kwh' ? 'kWh consumed' : 'Tk spent'} per day`}
                seriesName="Usage"
                formatValue={usageBarFormat}
                data={daily.data.points.map((p) => ({ key: p.date, value: unit === 'kwh' ? p.kwh : p.tk }))}
                tickFormatter={formatDate}
              />
            )}
            {dayNight.data && <DayNightComparisonChart data={dayNight.data} unit={unit} />}
            {trend.data && <ProjectionChart trend={trend.data} unit={unit} />}
            {weekly.data && weekly.data.points.length > 0 && (
              <UsageBarChart
                title="Weekly usage"
                subtitle={`${unit === 'kwh' ? 'kWh consumed' : 'Tk spent'} per ISO week`}
                seriesName="Usage"
                formatValue={usageBarFormat}
                data={weekly.data.points.map((p) => ({ key: p.weekStart, value: unit === 'kwh' ? p.kwh : p.tk }))}
                tickFormatter={formatDate}
              />
            )}
            {monthly.data && monthly.data.points.length > 0 && (
              <UsageBarChart
                title="Monthly usage"
                subtitle={`${unit === 'kwh' ? 'kWh consumed' : 'Tk spent'} per calendar month`}
                seriesName="Usage"
                formatValue={usageBarFormat}
                data={monthly.data.points.map((p) => ({ key: p.month, value: unit === 'kwh' ? p.kwh : p.tk }))}
                tickFormatter={(k) => k}
              />
            )}
            {hourly.data && <HourlyHeatmap buckets={hourly.data.buckets} unit={unit} />}
            {balanceSeries.data && <BalanceTrendChart points={balanceSeries.data.points} />}
            {daily.data && <ConsumptionAreaChart points={daily.data.points} unit={unit} />}
          </div>
        </>
      )}
    </div>
  );
}
