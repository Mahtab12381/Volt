import { describe, expect, it } from 'vitest';
import { recomputeMonth } from '../../src/services/calculationEngine/monthlyRecompute.js';
import { groupByDay, groupByHour, totalDayNight } from '../../src/services/calculationEngine/intervalSplitter.js';
import { LIFELINE_SLAB, SAMPLE_READINGS, STANDARD_SLABS } from './fixtures/sampleReadings.js';
import type { AtomicSegment } from '../../src/services/calculationEngine/types.js';

const DAY_WINDOW = { startHour: 7, endHour: 19 };

function toAtomicSegments(intervals: ReturnType<typeof recomputeMonth>['intervals']): AtomicSegment[] {
  return intervals.flatMap((i) => i.slabSegments);
}

describe('groupByDay — daily rollup identity', () => {
  const result = recomputeMonth(SAMPLE_READINGS, '2026-09', { lifelineSlab: LIFELINE_SLAB, standardSlabs: STANDARD_SLABS });
  const segments = toAtomicSegments(result.intervals);
  const byDay = groupByDay(segments, DAY_WINDOW);

  it('produces per-day totals matching the hand-derived figures', () => {
    expect(byDay.get('2026-09-01')?.kwh).toBeCloseTo(3.6726, 2);
    expect(byDay.get('2026-09-02')?.kwh).toBeCloseTo(5.4225, 2);
    expect(byDay.get('2026-09-03')?.kwh).toBeCloseTo(4.1143, 2);
  });

  it('daily totals sum back to the ungrouped interval total (no kWh lost or duplicated in splitting)', () => {
    const dailySum = [...byDay.values()].reduce((sum, d) => sum + d.kwh, 0);
    const intervalSum = result.intervals.reduce((sum, i) => sum + i.kwhConsumed, 0);
    expect(dailySum).toBeCloseTo(intervalSum, 6);
  });

  it('day + night per day also sums to that day\'s total', () => {
    for (const day of byDay.values()) {
      expect(day.dayKwh + day.nightKwh).toBeCloseTo(day.kwh, 6);
    }
  });
});

describe('totalDayNight — first interval split at the 7am boundary', () => {
  const result = recomputeMonth(SAMPLE_READINGS, '2026-09', { lifelineSlab: LIFELINE_SLAB, standardSlabs: STANDARD_SLABS });
  const firstIntervalSegments = result.intervals[0].slabSegments;

  it('matches the hand-derived night/day split (0.0386 / 1.3718 kWh)', () => {
    const dn = totalDayNight(firstIntervalSegments, DAY_WINDOW);
    expect(dn.nightKwh).toBeCloseTo(0.0386, 2);
    expect(dn.dayKwh).toBeCloseTo(1.3718, 2);
  });
});

describe('groupByHour — identity check', () => {
  it('hourly buckets sum to the total consumption', () => {
    const result = recomputeMonth(SAMPLE_READINGS, '2026-09', { lifelineSlab: LIFELINE_SLAB, standardSlabs: STANDARD_SLABS });
    const segments = toAtomicSegments(result.intervals);
    const buckets = groupByHour(segments);
    const bucketSum = buckets.reduce((sum, b) => sum + b.kwh, 0);
    const intervalSum = result.intervals.reduce((sum, i) => sum + i.kwhConsumed, 0);
    expect(bucketSum).toBeCloseTo(intervalSum, 6);
    expect(buckets).toHaveLength(24);
  });
});
