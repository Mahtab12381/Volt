import { describe, expect, it } from 'vitest';
import { partitionReadingsByMonth, recomputeMonth } from '../../src/services/calculationEngine/monthlyRecompute.js';
import { bd, LIFELINE_SLAB, SAMPLE_READINGS, STANDARD_SLABS } from './fixtures/sampleReadings.js';
import type { RawReading } from '../../src/services/calculationEngine/types.js';

describe('recomputeMonth — real sample data (stays within lifeline)', () => {
  const result = recomputeMonth(SAMPLE_READINGS, '2026-09', {
    lifelineSlab: LIFELINE_SLAB,
    standardSlabs: STANDARD_SLABS,
  });

  it('produces one interval per consecutive reading pair', () => {
    expect(result.intervals).toHaveLength(5);
  });

  it('stays on the lifeline track for the whole month', () => {
    expect(result.lifelineEligible).toBe(true);
    expect(result.reclassifiedAt).toBeNull();
    expect(result.intervals.every((i) => i.slabTrack === 'lifeline')).toBe(true);
  });

  it('matches the hand-derived total: 61.16 Tk -> ~13.2095 kWh', () => {
    const totalTk = result.intervals.reduce((sum, i) => sum + i.tkConsumed, 0);
    expect(totalTk).toBeCloseTo(61.16, 2);
    expect(result.cumulativeKwh).toBeCloseTo(13.2095, 3);
  });

  it('matches the hand-derived per-interval kWh figures', () => {
    const expected = [1.410367, 5.239741, 2.079914, 2.889847, 1.589633];
    result.intervals.forEach((interval, i) => {
      expect(interval.kwhConsumed).toBeCloseTo(expected[i], 3);
    });
  });

  it('flags no recharges (balance only ever drops in this sample)', () => {
    expect(result.intervals.every((i) => !i.isRecharge)).toBe(true);
  });
});

describe('recomputeMonth — lifeline reclassification', () => {
  // Synthetic month: readings drop fast enough in Tk that lifeline-rate kWh crosses 50 mid-month.
  const readings: RawReading[] = [
    { id: 'a', timestamp: bd(2026, 10, 1, 0, 0), balanceTk: 1000, isRecharge: false, rechargeAmountTk: null },
    { id: 'b', timestamp: bd(2026, 10, 10, 0, 0), balanceTk: 900, isRecharge: false, rechargeAmountTk: null }, // 100 Tk / 4.63 = 21.6 kWh
    { id: 'c', timestamp: bd(2026, 10, 20, 0, 0), balanceTk: 700, isRecharge: false, rechargeAmountTk: null }, // +200 Tk -> would push cumulative past 50 kWh lifeline
  ];

  const result = recomputeMonth(readings, '2026-10', { lifelineSlab: LIFELINE_SLAB, standardSlabs: STANDARD_SLABS });

  it('abandons the lifeline track and reprices the whole month as standard', () => {
    expect(result.lifelineEligible).toBe(false);
    expect(result.reclassifiedAt).not.toBeNull();
    expect(result.intervals.every((i) => i.slabTrack === 'standard')).toBe(true);
  });

  it('repriced total Tk still equals the sum of raw balance drops', () => {
    const totalTk = result.intervals.reduce((sum, i) => sum + i.tkConsumed, 0);
    expect(totalTk).toBeCloseTo(300, 6);
  });
});

describe('partitionReadingsByMonth', () => {
  it('splits an interval spanning a month boundary at the boundary', () => {
    const readings: RawReading[] = [
      { id: 'a', timestamp: bd(2026, 9, 30, 22, 0), balanceTk: 1000, isRecharge: false, rechargeAmountTk: null },
      { id: 'b', timestamp: bd(2026, 10, 1, 2, 0), balanceTk: 960, isRecharge: false, rechargeAmountTk: null },
    ];
    const groups = partitionReadingsByMonth(readings);
    expect(groups.get('2026-09')).toHaveLength(2); // original + virtual boundary
    expect(groups.get('2026-10')).toHaveLength(2); // virtual boundary + original
    const sepLast = groups.get('2026-09')![1];
    const octFirst = groups.get('2026-10')![0];
    expect(sepLast.timestamp.getTime()).toBe(octFirst.timestamp.getTime());
    // 4 hours elapsed total, boundary is 2h in -> half the 40 Tk drop = 980
    expect(sepLast.balanceTk).toBeCloseTo(980, 6);
  });

  it('keeps a single-month interval untouched', () => {
    const groups = partitionReadingsByMonth(SAMPLE_READINGS);
    expect(groups.size).toBe(1);
    expect(groups.get('2026-09')).toHaveLength(6);
  });
});
