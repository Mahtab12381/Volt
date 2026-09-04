import { detectRechargeAndConsumption } from './rechargeDetection.js';
import { computeNetRechargeCredit } from './rechargeAdjustment.js';
import { tkToKwhWithSlabs } from './slabConversion.js';
import { bdMonthKey, bdMonthStartUtc } from './time.js';
import type {
  IntervalResult,
  LifelineSlabConfig,
  MonthRecomputeResult,
  RawReading,
  RechargeAdjustmentSettings,
  RechargeDetectionResult,
  SlabBand,
  SlabSegmentResult,
  TimedSlabSegment,
} from './types.js';

const EPSILON = 1e-9;

export interface EngineConfig extends RechargeAdjustmentSettings {
  lifelineSlab: LifelineSlabConfig;
  standardSlabs: SlabBand[];
}

/** Same as detectRechargeAndConsumption, but first backs a gross recharge out to its net balance credit per the reading's rechargeAdjustment mode. */
function detectAdjusted(prevBalanceTk: number, curr: RawReading, settings: RechargeAdjustmentSettings): RechargeDetectionResult {
  const effectiveAmount =
    curr.isRecharge && (curr.rechargeAdjustment === 'vatRebate' || curr.rechargeAdjustment === 'all') && curr.rechargeAmountTk !== null
      ? computeNetRechargeCredit(curr.rechargeAmountTk, curr.rechargeAdjustment, settings)
      : curr.rechargeAmountTk;

  return detectRechargeAndConsumption(prevBalanceTk, {
    balanceTk: curr.balanceTk,
    isRecharge: curr.isRecharge,
    rechargeAmountTk: effectiveAmount,
  });
}

/**
 * Splits readings into per-calendar-month groups (Bangladesh wall clock).
 * When two consecutive readings fall in different months, a virtual reading
 * is inserted at the intervening midnight(s), with its balance linearly
 * interpolated by elapsed time — so each month's slab recompute starts from
 * a clean, self-contained interval instead of one straddling the reset.
 */
export function partitionReadingsByMonth(readings: RawReading[]): Map<string, RawReading[]> {
  const sorted = [...readings].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const groups = new Map<string, RawReading[]>();

  const pushTo = (monthKey: string, reading: RawReading) => {
    const list = groups.get(monthKey);
    if (list) list.push(reading);
    else groups.set(monthKey, [reading]);
  };

  for (let i = 0; i < sorted.length; i++) {
    const curr = sorted[i];
    const prev = sorted[i - 1];

    if (!prev) {
      pushTo(bdMonthKey(curr.timestamp), curr);
      continue;
    }

    let cursor = prev;
    let cursorMonth = bdMonthKey(prev.timestamp);
    const currMonth = bdMonthKey(curr.timestamp);

    let guard = 0;
    while (cursorMonth !== currMonth) {
      guard += 1;
      if (guard > 120) throw new Error('Too many month boundaries between two readings — check input data.');

      const [y, m] = cursorMonth.split('-').map(Number);
      const nextMonthKey = `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, '0')}`;
      const boundary = bdMonthStartUtc(nextMonthKey);

      const totalMs = curr.timestamp.getTime() - prev.timestamp.getTime();
      const fraction = totalMs > 0 ? (boundary.getTime() - prev.timestamp.getTime()) / totalMs : 0;
      const interpolatedBalance = prev.balanceTk + fraction * (curr.balanceTk - prev.balanceTk);

      const virtual: RawReading = {
        id: `virtual-${boundary.toISOString()}`,
        timestamp: boundary,
        balanceTk: interpolatedBalance,
        isRecharge: false,
        rechargeAmountTk: null,
        rechargeAdjustment: 'none',
      };

      pushTo(cursorMonth, virtual);
      pushTo(nextMonthKey, virtual);

      cursor = virtual;
      cursorMonth = nextMonthKey;
    }

    pushTo(currMonth, curr);
  }

  return groups;
}

function attachSegmentTimestamps(segments: SlabSegmentResult[], from: Date, to: Date): TimedSlabSegment[] {
  const totalKwh = segments.reduce((sum, s) => sum + s.kwh, 0);
  const durationMs = to.getTime() - from.getTime();
  let cursor = from.getTime();
  const result: TimedSlabSegment[] = [];

  for (const seg of segments) {
    const share = totalKwh > EPSILON ? seg.kwh / totalKwh : 1 / segments.length;
    const segDurationMs = durationMs * share;
    const segFrom = new Date(cursor);
    const segTo = new Date(cursor + segDurationMs);
    result.push({ ...seg, fromTimestamp: segFrom, toTimestamp: segTo });
    cursor += segDurationMs;
  }

  if (result.length > 0) result[result.length - 1].toTimestamp = to;
  return result;
}

function buildLifelineLabel(config: LifelineSlabConfig): string {
  return `0-${config.thresholdKwh} (lifeline)`;
}

function tryLifelinePass(readings: RawReading[], config: EngineConfig, month: string): MonthRecomputeResult | null {
  const lifelineSlab = config.lifelineSlab;
  let cumulative = 0;
  const intervals: IntervalResult[] = [];

  for (let i = 1; i < readings.length; i++) {
    const prev = readings[i - 1];
    const curr = readings[i];
    const r = detectAdjusted(prev.balanceTk, curr, config);

    let kwh = 0;
    let segments: SlabSegmentResult[] = [];

    if (r.tkConsumed > EPSILON) {
      kwh = r.tkConsumed / lifelineSlab.rateTkPerKwh;
      if (cumulative + kwh > lifelineSlab.thresholdKwh + EPSILON) {
        return null; // abandon — the month must be repriced under the standard ladder
      }
      segments = [
        {
          slabLabel: buildLifelineLabel(lifelineSlab),
          rateTkPerKwh: lifelineSlab.rateTkPerKwh,
          kwh,
          tk: r.tkConsumed,
          startCumulativeKwh: cumulative,
          endCumulativeKwh: cumulative + kwh,
        },
      ];
    }

    intervals.push({
      fromReadingId: prev.id,
      toReadingId: curr.id,
      fromTimestamp: prev.timestamp,
      toTimestamp: curr.timestamp,
      tkConsumed: r.tkConsumed,
      kwhConsumed: kwh,
      isRecharge: r.isRecharge,
      rechargeAmountTk: r.rechargeAmountTk,
      isAutoDetectedRecharge: r.isAutoDetectedRecharge,
      warning: r.warning,
      slabSegments: attachSegmentTimestamps(segments, prev.timestamp, curr.timestamp),
      month,
      slabTrack: 'lifeline',
    });

    cumulative += kwh;
  }

  return { intervals, cumulativeKwh: cumulative, lifelineEligible: true, reclassifiedAt: null };
}

function findLifelineCrossingTimestamp(readings: RawReading[], config: EngineConfig): Date | null {
  const lifelineSlab = config.lifelineSlab;
  let cumulative = 0;
  for (let i = 1; i < readings.length; i++) {
    const prev = readings[i - 1];
    const curr = readings[i];
    const r = detectAdjusted(prev.balanceTk, curr, config);
    if (r.tkConsumed <= EPSILON) continue;
    const kwh = r.tkConsumed / lifelineSlab.rateTkPerKwh;
    if (cumulative + kwh > lifelineSlab.thresholdKwh + EPSILON) {
      const kwhNeeded = lifelineSlab.thresholdKwh - cumulative;
      const fraction = kwh > EPSILON ? kwhNeeded / kwh : 0;
      const durationMs = curr.timestamp.getTime() - prev.timestamp.getTime();
      return new Date(prev.timestamp.getTime() + durationMs * fraction);
    }
    cumulative += kwh;
  }
  return null;
}

function standardPass(readings: RawReading[], config: EngineConfig, month: string): MonthRecomputeResult {
  let cumulative = 0;
  const intervals: IntervalResult[] = [];

  for (let i = 1; i < readings.length; i++) {
    const prev = readings[i - 1];
    const curr = readings[i];
    const r = detectAdjusted(prev.balanceTk, curr, config);

    const conv = tkToKwhWithSlabs(cumulative, r.tkConsumed, config.standardSlabs);
    cumulative = conv.endCumulativeKwh;

    intervals.push({
      fromReadingId: prev.id,
      toReadingId: curr.id,
      fromTimestamp: prev.timestamp,
      toTimestamp: curr.timestamp,
      tkConsumed: r.tkConsumed,
      kwhConsumed: conv.kwhAcquired,
      isRecharge: r.isRecharge,
      rechargeAmountTk: r.rechargeAmountTk,
      isAutoDetectedRecharge: r.isAutoDetectedRecharge,
      warning: r.warning,
      slabSegments: attachSegmentTimestamps(conv.segments, prev.timestamp, curr.timestamp),
      month,
      slabTrack: 'standard',
    });
  }

  return { intervals, cumulativeKwh: cumulative, lifelineEligible: false, reclassifiedAt: null };
}

/** Recomputes one calendar month's intervals under the two-pass lifeline/standard rule. */
export function recomputeMonth(monthReadings: RawReading[], month: string, config: EngineConfig): MonthRecomputeResult {
  const sorted = [...monthReadings].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  if (sorted.length < 2) {
    return { intervals: [], cumulativeKwh: 0, lifelineEligible: true, reclassifiedAt: null };
  }

  const lifelineResult = tryLifelinePass(sorted, config, month);
  if (lifelineResult) return lifelineResult;

  const reclassifiedAt = findLifelineCrossingTimestamp(sorted, config);
  const standardResult = standardPass(sorted, config, month);
  return { ...standardResult, reclassifiedAt };
}

/** Recomputes every month present in the given readings. Virtual reading ids (prefixed "virtual-") are not persisted as their own Reading documents. */
export function recomputeAllMonths(readings: RawReading[], config: EngineConfig): Map<string, MonthRecomputeResult> {
  const groups = partitionReadingsByMonth(readings);
  const results = new Map<string, MonthRecomputeResult>();
  for (const [month, monthReadings] of groups) {
    results.set(month, recomputeMonth(monthReadings, month, config));
  }
  return results;
}
