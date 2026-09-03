import type { SlabBand, SlabConversionResult, SlabSegmentResult } from './types.js';

const EPSILON = 1e-9;

/**
 * Converts a Tk deduction into kWh using a slab-rate ladder, given the
 * cumulative kWh already consumed this month. Splits proportionally into
 * multiple segments whenever the deduction crosses a slab boundary.
 */
export function tkToKwhWithSlabs(
  startCumulativeKwh: number,
  tkDeducted: number,
  slabs: SlabBand[],
): SlabConversionResult {
  let remainingTk = tkDeducted;
  let cumulative = startCumulativeKwh;
  const segments: SlabSegmentResult[] = [];

  if (remainingTk <= EPSILON) {
    return { kwhAcquired: 0, endCumulativeKwh: cumulative, segments };
  }

  const sorted = [...slabs].sort((a, b) => a.minKwh - b.minKwh);

  let guard = 0;
  while (remainingTk > EPSILON) {
    guard += 1;
    if (guard > 10000) {
      throw new Error('Slab conversion did not converge — check slab configuration for gaps.');
    }
    // Match by upper bound only: DESCO's published bands are labeled with a
    // human "next unit" gap (e.g. "76-200" then "201-300"), which is not a
    // real gap in continuous kWh terms — the first band whose ceiling exceeds
    // the current cumulative is always the correct one to keep filling.
    const slab = sorted.find((s) => cumulative < (s.maxKwh ?? Infinity) - EPSILON);
    if (!slab) {
      throw new Error(`No slab band covers cumulative usage of ${cumulative} kWh.`);
    }
    const roomKwh = (slab.maxKwh ?? Infinity) - cumulative;
    const roomTk = roomKwh === Infinity ? Infinity : roomKwh * slab.rateTkPerKwh;

    if (remainingTk <= roomTk + EPSILON) {
      const kwh = remainingTk / slab.rateTkPerKwh;
      segments.push({
        slabLabel: slab.label,
        rateTkPerKwh: slab.rateTkPerKwh,
        kwh,
        tk: remainingTk,
        startCumulativeKwh: cumulative,
        endCumulativeKwh: cumulative + kwh,
      });
      cumulative += kwh;
      remainingTk = 0;
    } else {
      segments.push({
        slabLabel: slab.label,
        rateTkPerKwh: slab.rateTkPerKwh,
        kwh: roomKwh,
        tk: roomTk,
        startCumulativeKwh: cumulative,
        endCumulativeKwh: cumulative + roomKwh,
      });
      cumulative += roomKwh;
      remainingTk -= roomTk;
    }
  }

  return { kwhAcquired: cumulative - startCumulativeKwh, endCumulativeKwh: cumulative, segments };
}

/** Inverse direction: given a target kWh total, sums the Tk cost across slabs. Used for forward bill projection. */
export function kwhToTkWithSlabs(startCumulativeKwh: number, targetKwh: number, slabs: SlabBand[]): number {
  let remainingKwh = targetKwh;
  let cumulative = startCumulativeKwh;
  let totalTk = 0;
  const sorted = [...slabs].sort((a, b) => a.minKwh - b.minKwh);

  let guard = 0;
  while (remainingKwh > EPSILON) {
    guard += 1;
    if (guard > 10000) {
      throw new Error('kWh-to-Tk conversion did not converge — check slab configuration for gaps.');
    }
    const slab = sorted.find((s) => cumulative < (s.maxKwh ?? Infinity) - EPSILON);
    if (!slab) {
      throw new Error(`No slab band covers cumulative usage of ${cumulative} kWh.`);
    }
    const roomKwh = (slab.maxKwh ?? Infinity) - cumulative;
    const kwhHere = Math.min(roomKwh, remainingKwh);
    totalTk += kwhHere * slab.rateTkPerKwh;
    cumulative += kwhHere;
    remainingKwh -= kwhHere;
  }

  return totalTk;
}
