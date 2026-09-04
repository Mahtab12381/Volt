export type RechargeAdjustment = 'none' | 'vatRebate' | 'all';

export interface RawReading {
  id: string;
  timestamp: Date;
  balanceTk: number;
  isRecharge: boolean;
  rechargeAmountTk: number | null;
  rechargeAdjustment: RechargeAdjustment;
}

// The subset of AppSettings needed to back a gross recharge payment out to
// the net amount actually credited to the balance — the inverse of the
// energyCost -> rebate -> VAT -> +fixed pipeline in projection.ts.
export interface RechargeAdjustmentSettings {
  vatPercent: number;
  rebatePercent: number;
  demandChargeTkPerKw: number;
  sanctionedLoadKw: number;
  meterRentTk: number;
}

export interface SlabBand {
  minKwh: number;
  maxKwh: number | null;
  rateTkPerKwh: number;
  label: string;
}

export interface LifelineSlabConfig {
  thresholdKwh: number;
  rateTkPerKwh: number;
}

export interface RechargeDetectionResult {
  tkConsumed: number;
  isRecharge: boolean;
  rechargeAmountTk: number;
  isAutoDetectedRecharge: boolean;
  warning: string | null;
}

export interface SlabSegmentResult {
  slabLabel: string;
  rateTkPerKwh: number;
  kwh: number;
  tk: number;
  startCumulativeKwh: number;
  endCumulativeKwh: number;
}

export interface TimedSlabSegment extends SlabSegmentResult {
  fromTimestamp: Date;
  toTimestamp: Date;
}

export interface SlabConversionResult {
  kwhAcquired: number;
  endCumulativeKwh: number;
  segments: SlabSegmentResult[];
}

export type SlabTrack = 'lifeline' | 'standard';

export interface IntervalResult {
  fromReadingId: string;
  toReadingId: string;
  fromTimestamp: Date;
  toTimestamp: Date;
  tkConsumed: number;
  kwhConsumed: number;
  isRecharge: boolean;
  rechargeAmountTk: number;
  isAutoDetectedRecharge: boolean;
  warning: string | null;
  slabSegments: TimedSlabSegment[];
  month: string;
  slabTrack: SlabTrack;
}

export interface MonthRecomputeResult {
  intervals: IntervalResult[];
  cumulativeKwh: number;
  lifelineEligible: boolean;
  reclassifiedAt: Date | null;
}

export interface AtomicSegment {
  fromTimestamp: Date;
  toTimestamp: Date;
  kwh: number;
  tk: number;
}
