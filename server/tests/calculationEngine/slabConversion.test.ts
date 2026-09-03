import { describe, expect, it } from 'vitest';
import { kwhToTkWithSlabs, tkToKwhWithSlabs } from '../../src/services/calculationEngine/slabConversion.js';
import { STANDARD_SLABS } from './fixtures/sampleReadings.js';

describe('tkToKwhWithSlabs', () => {
  it('stays within a single slab when the deduction does not cross a boundary', () => {
    const result = tkToKwhWithSlabs(100, 42.5, STANDARD_SLABS); // 100 kWh is within 76-200 @ 8.50
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0].slabLabel).toBe('76-200');
    expect(result.kwhAcquired).toBeCloseTo(5, 6);
    expect(result.endCumulativeKwh).toBeCloseTo(105, 6);
  });

  it('splits proportionally across a slab boundary crossing', () => {
    // cumulative 195 kWh (in 76-200 @8.50), 60 Tk consumed
    // room in current slab: 200-195=5kWh -> 42.50 Tk; remaining 17.50 Tk -> next slab (201-300 @9.10) -> 1.923077 kWh
    const result = tkToKwhWithSlabs(195, 60, STANDARD_SLABS);
    expect(result.segments).toHaveLength(2);

    expect(result.segments[0].slabLabel).toBe('76-200');
    expect(result.segments[0].kwh).toBeCloseTo(5, 4);
    expect(result.segments[0].tk).toBeCloseTo(42.5, 4);

    expect(result.segments[1].slabLabel).toBe('201-300');
    expect(result.segments[1].kwh).toBeCloseTo(1.923077, 4);
    expect(result.segments[1].tk).toBeCloseTo(17.5, 4);

    expect(result.kwhAcquired).toBeCloseTo(6.923077, 4);
    expect(result.endCumulativeKwh).toBeCloseTo(201.923077, 4);
  });

  it('returns zero when no Tk was consumed', () => {
    const result = tkToKwhWithSlabs(10, 0, STANDARD_SLABS);
    expect(result.kwhAcquired).toBe(0);
    expect(result.segments).toHaveLength(0);
  });

  it('handles the open-ended top slab', () => {
    const result = tkToKwhWithSlabs(650, 173.5, STANDARD_SLABS); // 10 kWh @ 17.35
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0].slabLabel).toBe('601+');
    expect(result.kwhAcquired).toBeCloseTo(10, 4);
  });
});

describe('kwhToTkWithSlabs', () => {
  it('is the inverse of tkToKwhWithSlabs for a single-slab amount', () => {
    const tk = kwhToTkWithSlabs(100, 5, STANDARD_SLABS);
    expect(tk).toBeCloseTo(42.5, 6);
  });

  it('sums cost correctly across a slab-crossing amount', () => {
    const tk = kwhToTkWithSlabs(195, 6.923077, STANDARD_SLABS);
    expect(tk).toBeCloseTo(60, 3);
  });
});
