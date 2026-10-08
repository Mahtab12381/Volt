import { useEffect, useMemo, useState } from 'react';
import type { UnitMode } from '@electricity/shared';
import { PageHeader } from '../components/layout/PageHeader.js';
import { KpiRow, StatTile } from '../components/layout/StatTile.js';
import { LowBalanceBanner } from '../components/layout/LowBalanceBanner.js';
import { UsageVsBudgetCard } from '../components/layout/UsageVsBudgetCard.js';
import { UnitToggle } from '../components/layout/UnitToggle.js';
import { MonthPicker } from '../components/layout/MonthPicker.js';
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
import {
  bdMonthRangeIso,
  currentBdMonthKey,
  formatDate,
  formatDayRange,
  formatKwh,
  formatMonth,
  formatTk,
} from '../utils/formatters.js';

export function DashboardPage() {
  const currentMonth = useMemo(currentBdMonthKey, []);
  const [month, setMonth] = useState(currentMonth);
  const range = useMemo(() => bdMonthRangeIso(month), [month]);

  const settings = useSettings();
  const summary = useSummary(month);
  const trend = useTrend(month);
  const balanceSeries = useBalanceSeries(range.from, range.to);
  const daily = useDaily(range.from, range.to);
  const weekly = useWeekly(range.from, range.to);
  // Left unscoped on purpose: this is the month-over-month comparison, and it
  // doubles as the source of truth for which months the picker can offer.
  const monthly = useMonthly();
  const dayNight = useDayVsNight(range.from, range.to);
  const hourly = useHourlyAverage(range.from, range.to);

  const monthOptions = useMemo(() => {
    const keys = new Set(monthly.data?.points.map((p) => p.month) ?? []);
    keys.add(currentMonth);
    keys.add(month);
    return [...keys].sort((a, b) => b.localeCompare(a));
  }, [monthly.data, currentMonth, month]);

  // A derived interval straddling a month boundary comes back whole, so trim the
  // spill-over days before they show up as stray bars at the chart edges.
  const dailyPoints = useMemo(
    () => daily.data?.points.filter((p) => p.date.startsWith(`${month}-`)) ?? [],
    [daily.data, month],
  );

  const weeklyPoints = useMemo(
    () => weekly.data?.points.filter((p) => p.weekStart.startsWith(`${month}-`)) ?? [],
    [weekly.data, month],
  );

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
        subtitle={`Your electricity consumption for ${formatMonth(month)}.`}
        action={
          <div className="flex items-center gap-2">
            <MonthPicker value={month} options={monthOptions} onChange={setMonth} />
            <UnitToggle value={unit} onChange={setUnit} />
          </div>
        }
      />

      {summary.data && month === currentMonth && (
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
                label="Average usage per day"
                value={formatTk(summary.data.avgDailyTk)}
                hint={`${formatKwh(summary.data.avgDailyKwh)}/day · rolling avg, last 7 days`}
              />
              <StatTile
                label="Current tariff slab"
                value={`${formatTk(summary.data.currentSlab.rateTkPerKwh)}/kWh`}
                hint={
                  summary.data.currentSlab.maxKwh === null
                    ? `${summary.data.currentSlab.minKwh}+ kWh`
                    : `${summary.data.currentSlab.minKwh}–${summary.data.currentSlab.maxKwh} kWh`
                }
                badge={summary.data.currentSlab.track === 'lifeline' ? { text: 'Lifeline rate', tone: 'good' } : undefined}
              />
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
            </KpiRow>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <UsageVsBudgetCard
              cumulativeTkThisMonth={summary.data.cumulativeTkThisMonth}
              cumulativeKwhThisMonth={summary.data.cumulativeKwhThisMonth}
              monthlyBudgetTk={summary.data.monthlyBudgetTk}
              budgetStatus={summary.data.budgetStatus}
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
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {dailyPoints.length > 0 && (
              <UsageBarChart
                title="Daily usage"
                subtitle={`${unit === 'kwh' ? 'kWh consumed' : 'Tk spent'} per day`}
                seriesName="Usage"
                formatValue={usageBarFormat}
                data={dailyPoints.map((p) => ({ key: p.date, value: unit === 'kwh' ? p.kwh : p.tk }))}
                tickFormatter={formatDate}
              />
            )}
            {dayNight.data && <DayNightComparisonChart data={dayNight.data} unit={unit} />}
            {trend.data && <ProjectionChart trend={trend.data} unit={unit} />}
            {weeklyPoints.length > 0 && (
              <UsageBarChart
                title="Weekly usage"
                subtitle={`${unit === 'kwh' ? 'kWh consumed' : 'Tk spent'} per day-of-month block`}
                seriesName="Usage"
                formatValue={usageBarFormat}
                data={weeklyPoints.map((p) => ({
                  key: formatDayRange(p.weekStart, p.weekEnd),
                  value: unit === 'kwh' ? p.kwh : p.tk,
                }))}
                tickFormatter={(k) => k}
              />
            )}
            {monthly.data && monthly.data.points.length > 0 && (
              <UsageBarChart
                title="Monthly usage"
                subtitle={`${unit === 'kwh' ? 'kWh consumed' : 'Tk spent'} per calendar month · all months`}
                seriesName="Usage"
                formatValue={usageBarFormat}
                data={monthly.data.points.map((p) => ({ key: p.month, value: unit === 'kwh' ? p.kwh : p.tk }))}
                tickFormatter={(k) => k}
              />
            )}
            {hourly.data && <HourlyHeatmap buckets={hourly.data.buckets} unit={unit} />}
            {balanceSeries.data && <BalanceTrendChart points={balanceSeries.data.points} />}
            {dailyPoints.length > 0 && <ConsumptionAreaChart points={dailyPoints} unit={unit} />}
          </div>
        </>
      )}
    </div>
  );
}
