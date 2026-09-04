import { DerivedIntervalModel } from '../models/DerivedInterval.model.js';
import { MonthlyStateModel } from '../models/MonthlyState.model.js';
import { ReadingModel } from '../models/Reading.model.js';
import { loadEngineSettings } from './calculationEngine/recalculateOrchestrator.js';
import {
  groupByDay,
  groupByHour,
  groupByMonth,
  groupByWeek,
  totalDayNight,
  type DailyAgg,
} from './calculationEngine/intervalSplitter.js';
import { findCurrentSlab, kwhToTkWithSlabs } from './calculationEngine/slabConversion.js';
import { projectMonth } from './calculationEngine/projection.js';
import { bdDateKey, bdDayOfMonth, bdDaysInMonth, bdMonthKey } from './calculationEngine/time.js';
import type { AtomicSegment } from './calculationEngine/types.js';

async function fetchSegments(from?: Date, to?: Date): Promise<AtomicSegment[]> {
  const query: Record<string, unknown> = {};
  const clauses: Record<string, unknown>[] = [];
  if (to) clauses.push({ fromTimestamp: { $lt: to } });
  if (from) clauses.push({ toTimestamp: { $gt: from } });
  if (clauses.length > 0) query.$and = clauses;

  const intervals = await DerivedIntervalModel.find(query).lean();
  return intervals.flatMap((i) => i.slabSegments);
}

function sortedDaily(byDay: Map<string, DailyAgg>): DailyAgg[] {
  return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export async function getBalanceSeries(from?: Date, to?: Date) {
  const query: Record<string, unknown> = {};
  if (from || to) {
    query.timestamp = {};
    if (from) (query.timestamp as Record<string, Date>).$gte = from;
    if (to) (query.timestamp as Record<string, Date>).$lte = to;
  }
  const readings = await ReadingModel.find(query).sort({ timestamp: 1 }).lean();
  return readings.map((r) => ({
    timestamp: r.timestamp.toISOString(),
    balanceTk: r.balanceTk,
    isRecharge: r.isRecharge || r.isAutoDetectedRecharge,
  }));
}

export async function getDaily(from?: Date, to?: Date) {
  const { settings } = await loadEngineSettings();
  const segments = await fetchSegments(from, to);
  const byDay = groupByDay(segments, settings.dayWindow);
  return sortedDaily(byDay);
}

export async function getWeekly(from?: Date, to?: Date) {
  const segments = await fetchSegments(from, to);
  const byWeek = groupByWeek(segments);
  return [...byWeek.values()].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

export async function getMonthly(from?: Date, to?: Date) {
  const segments = await fetchSegments(from, to);
  const byMonth = groupByMonth(segments);
  const states = await MonthlyStateModel.find({ month: { $in: [...byMonth.keys()] } }).lean();
  const stateByMonth = new Map(states.map((s) => [s.month, s]));

  return [...byMonth.values()]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((m) => {
      const state = stateByMonth.get(m.month);
      return {
        month: m.month,
        kwh: m.kwh,
        tk: m.tk,
        billEstimate: m.tk, // actual Tk deducted this month (energy portion only; fixed charges are projection-only, see projection.ts)
        lifelineEligible: state?.lifelineEligible ?? true,
      };
    });
}

export async function getHourly(params: { mode: 'single' | 'average'; date?: Date; from?: Date; to?: Date }) {
  const { settings } = await loadEngineSettings();
  if (params.mode === 'single' && params.date) {
    const dayStart = params.date;
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const segments = await fetchSegments(dayStart, dayEnd);
    return groupByHour(segments);
  }

  const segments = await fetchSegments(params.from, params.to);
  const buckets = groupByHour(segments);
  const byDay = groupByDay(segments, settings.dayWindow);
  const dayCount = Math.max(1, byDay.size);
  return buckets.map((b) => ({ hour: b.hour, kwh: b.kwh / dayCount, tk: b.tk / dayCount }));
}

export async function getDayNight(from?: Date, to?: Date) {
  const { settings } = await loadEngineSettings();
  const segments = await fetchSegments(from, to);
  const totals = totalDayNight(segments, settings.dayWindow);
  const byDay = groupByDay(segments, settings.dayWindow);
  return {
    totals,
    byDay: sortedDaily(byDay).map((d) => ({
      date: d.date,
      dayKwh: d.dayKwh,
      nightKwh: d.nightKwh,
      dayTk: d.dayTk,
      nightTk: d.nightTk,
    })),
  };
}

async function buildProjectionInput(monthKey: string) {
  const { settings, standardSlabs } = await loadEngineSettings();
  const state = await MonthlyStateModel.findOne({ month: monthKey }).lean();
  const cumulativeKwhSoFar = state?.cumulativeKwh ?? 0;

  const [y, m] = monthKey.split('-').map(Number);
  const monthStart = new Date(Date.UTC(y, m - 1, 1));
  const monthEnd = new Date(Date.UTC(y, m, 1));
  const segments = await fetchSegments(monthStart, monthEnd);
  const byDay = sortedDaily(groupByDay(segments, settings.dayWindow));
  const recentDailyKwh = byDay.slice(-7).map((d) => d.kwh);
  const recentDailyTk = byDay.slice(-7).map((d) => d.tk);

  const latestReading = await ReadingModel.findOne().sort({ timestamp: -1 }).lean();
  const daysInMonth = bdDaysInMonth(monthKey);
  const isCurrentMonth = latestReading ? bdMonthKey(latestReading.timestamp) === monthKey : false;
  const daysElapsed = isCurrentMonth && latestReading ? bdDayOfMonth(latestReading.timestamp) : daysInMonth;
  const daysRemainingInMonth = Math.max(0, daysInMonth - daysElapsed);

  const config = {
    lifelineSlab: settings.lifelineSlab,
    standardSlabs,
    demandChargeTkPerKw: settings.demandChargeTkPerKw,
    sanctionedLoadKw: settings.sanctionedLoadKw,
    meterRentTk: settings.meterRentTk,
    vatPercent: settings.vatPercent,
    rebatePercent: settings.rebatePercent,
  };

  return { cumulativeKwhSoFar, recentDailyKwh, recentDailyTk, daysRemainingInMonth, daysElapsed, daysInMonth, config, state, byDay, settings };
}

export type BudgetStatus = 'not_set' | 'on_track' | 'at_risk' | 'over_budget';

export function computeBudgetStatus(
  projectedMonthlyBillTk: number,
  monthlyBudgetTk: number,
  atRiskFraction: number,
): { budgetStatus: BudgetStatus; budgetUsedPercent: number | null } {
  if (monthlyBudgetTk <= 0) {
    return { budgetStatus: 'not_set', budgetUsedPercent: null };
  }
  const usedFraction = projectedMonthlyBillTk / monthlyBudgetTk;
  const budgetUsedPercent = usedFraction * 100;
  if (usedFraction > 1) return { budgetStatus: 'over_budget', budgetUsedPercent };
  if (usedFraction >= atRiskFraction) return { budgetStatus: 'at_risk', budgetUsedPercent };
  return { budgetStatus: 'on_track', budgetUsedPercent };
}

export async function getProjection(monthKey: string) {
  const { cumulativeKwhSoFar, recentDailyKwh, daysRemainingInMonth, config } = await buildProjectionInput(monthKey);
  return projectMonth({ cumulativeKwhSoFar, recentDailyKwh, daysRemainingInMonth, config });
}

export async function getSummary(monthKey: string) {
  const { cumulativeKwhSoFar, recentDailyKwh, recentDailyTk, daysRemainingInMonth, daysElapsed, state, config, settings } =
    await buildProjectionInput(monthKey);

  const projection = projectMonth({ cumulativeKwhSoFar, recentDailyKwh, daysRemainingInMonth, config });
  const latestReading = await ReadingModel.findOne().sort({ timestamp: -1 }).lean();
  const avgDailyKwh = recentDailyKwh.length > 0 ? recentDailyKwh.reduce((a, b) => a + b, 0) / recentDailyKwh.length : 0;
  const avgDailyTk = recentDailyTk.length > 0 ? recentDailyTk.reduce((a, b) => a + b, 0) / recentDailyTk.length : 0;

  const cumulativeTkThisMonth = (await getMonthly()).find((m) => m.month === monthKey)?.tk ?? 0;

  const avgDailyTkMonthToDate = daysElapsed > 0 ? cumulativeTkThisMonth / daysElapsed : 0;
  const currentBalanceTk = latestReading?.balanceTk ?? 0;
  const estimatedDaysUntilExhaustion = avgDailyTkMonthToDate > 0 ? currentBalanceTk / avgDailyTkMonthToDate : null;

  const { budgetStatus, budgetUsedPercent } = computeBudgetStatus(
    projection.totalEstimate,
    settings.monthlyBudgetTk,
    settings.budgetAtRiskFraction,
  );

  // The slab your projected month-end total would land in, not the slab
  // you're literally in today — mirrors the same forward-looking track
  // decision projectMonth() makes when pricing projection.totalEstimate.
  const projectedLifelineEligible = projection.projectedTotalKwh <= settings.lifelineSlab.thresholdKwh;
  const projectedSlab = findCurrentSlab(
    projection.projectedTotalKwh,
    projectedLifelineEligible,
    settings.lifelineSlab,
    config.standardSlabs,
  );

  const lifelineEligible = state?.lifelineEligible ?? true;
  const currentSlab = findCurrentSlab(cumulativeKwhSoFar, lifelineEligible, settings.lifelineSlab, config.standardSlabs);

  const totalFixedCostTk = projection.demandCharge + projection.meterRent;

  return {
    currentBalanceTk,
    cumulativeKwhThisMonth: cumulativeKwhSoFar,
    cumulativeTkThisMonth,
    projectedMonthlyKwh: projection.projectedTotalKwh,
    projectedMonthlyBillTk: projection.totalEstimate,
    lifelineEligible,
    daysElapsed,
    daysRemaining: daysRemainingInMonth,
    avgDailyKwh,
    avgDailyTk,
    estimatedDaysUntilExhaustion,
    monthlyBudgetTk: settings.monthlyBudgetTk,
    budgetStatus,
    budgetUsedPercent,
    projectedSlab,
    currentSlab,
    totalFixedCostTk,
  };
}

export async function getTrend(monthKey: string) {
  const { cumulativeKwhSoFar, recentDailyKwh, daysRemainingInMonth, byDay, config } = await buildProjectionInput(monthKey);

  const actual = byDay.map((d) => ({ date: d.date, kwh: d.kwh, tk: d.tk }));

  const avgDailyKwh = recentDailyKwh.length > 0 ? recentDailyKwh.reduce((a, b) => a + b, 0) / recentDailyKwh.length : 0;
  const projectedTotal = cumulativeKwhSoFar + avgDailyKwh * daysRemainingInMonth;
  const useLifeline = projectedTotal <= config.lifelineSlab.thresholdKwh;

  const lastDate = actual.length > 0 ? actual[actual.length - 1].date : bdDateKey(new Date());
  let cumulative = cumulativeKwhSoFar;
  const projected: { date: string; kwh: number; tk: number }[] = [];
  for (let i = 1; i <= daysRemainingInMonth; i++) {
    const [y, m, d] = lastDate.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d + i));
    const dateKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(
      date.getUTCDate(),
    ).padStart(2, '0')}`;
    const dayKwh = avgDailyKwh;
    const dayTk = useLifeline ? dayKwh * config.lifelineSlab.rateTkPerKwh : kwhToTkWithSlabs(cumulative, dayKwh, config.standardSlabs);
    cumulative += dayKwh;
    projected.push({ date: dateKey, kwh: dayKwh, tk: dayTk });
  }

  return { actual, projected };
}
