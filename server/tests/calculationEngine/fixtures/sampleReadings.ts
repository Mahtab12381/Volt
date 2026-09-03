import { BD_OFFSET_MS } from '../../../src/services/calculationEngine/time.js';
import type { RawReading } from '../../../src/services/calculationEngine/types.js';

/** Builds a Date whose Bangladesh (UTC+6) wall-clock time is y-m-d h:mi. */
export function bd(y: number, m: number, d: number, h: number, mi: number): Date {
  return new Date(Date.UTC(y, m - 1, d, h, mi, 0, 0) - BD_OFFSET_MS);
}

/** The user's real September 2026 meter readings (first 3 days). */
export const SAMPLE_READINGS: RawReading[] = [
  { id: 'r1', timestamp: bd(2026, 9, 1, 6, 40), balanceTk: 1875.89, isRecharge: false, rechargeAmountTk: null },
  { id: 'r2', timestamp: bd(2026, 9, 1, 18, 50), balanceTk: 1869.36, isRecharge: false, rechargeAmountTk: null },
  { id: 'r3', timestamp: bd(2026, 9, 2, 6, 48), balanceTk: 1845.1, isRecharge: false, rechargeAmountTk: null },
  { id: 'r4', timestamp: bd(2026, 9, 2, 23, 1), balanceTk: 1835.47, isRecharge: false, rechargeAmountTk: null },
  { id: 'r5', timestamp: bd(2026, 9, 3, 6, 48), balanceTk: 1822.09, isRecharge: false, rechargeAmountTk: null },
  { id: 'r6', timestamp: bd(2026, 9, 3, 18, 50), balanceTk: 1814.73, isRecharge: false, rechargeAmountTk: null },
];

export const LIFELINE_SLAB = { thresholdKwh: 50, rateTkPerKwh: 4.63 };

export const STANDARD_SLABS = [
  { minKwh: 0, maxKwh: 75, rateTkPerKwh: 5.26, label: '0-75' },
  { minKwh: 76, maxKwh: 200, rateTkPerKwh: 8.5, label: '76-200' },
  { minKwh: 201, maxKwh: 300, rateTkPerKwh: 9.1, label: '201-300' },
  { minKwh: 301, maxKwh: 400, rateTkPerKwh: 9.62, label: '301-400' },
  { minKwh: 401, maxKwh: 600, rateTkPerKwh: 15.01, label: '401-600' },
  { minKwh: 601, maxKwh: null, rateTkPerKwh: 17.35, label: '601+' },
];
