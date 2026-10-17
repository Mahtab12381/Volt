// 'none' = rechargeAmountTk is already the net amount credited to balance.
// 'vatRebate' = rechargeAmountTk is the gross amount paid; VAT/rebate (from Settings) are backed out.
// 'all' = same as 'vatRebate', plus the monthly meter rent + demand charge are also backed out.
export type RechargeAdjustment = 'none' | 'vatRebate' | 'all';

// How many months of meter rent + demand charge a single recharge paid for. A
// recharge made after a skipped month carries both fixed charges twice, so 'all'
// has to know the count. Only meaningful for 'all'; always 1 for the other modes.
export const DEFAULT_FIXED_CHARGE_MONTHS = 1;

export interface Reading {
  id: string;
  timestamp: string; // ISO 8601, UTC
  balanceTk: number;
  isRecharge: boolean;
  rechargeAmountTk: number | null;
  rechargeAdjustment: RechargeAdjustment;
  rechargeFixedChargeMonths: number;
  isAutoDetectedRecharge: boolean;
  autoRechargeAmountTk: number | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReadingInput {
  timestamp: string;
  balanceTk: number;
  isRecharge?: boolean;
  rechargeAmountTk?: number;
  rechargeAdjustment?: RechargeAdjustment;
  rechargeFixedChargeMonths?: number;
  note?: string;
}

export type UpdateReadingInput = Partial<CreateReadingInput>;

export interface SlabSegment {
  slabLabel: string;
  rateTkPerKwh: number;
  kwh: number;
  tk: number;
  startCumulativeKwh: number;
  endCumulativeKwh: number;
  fromTimestamp: string;
  toTimestamp: string;
}

export type SlabTrack = 'lifeline' | 'standard';

export interface DerivedInterval {
  id: string;
  fromReadingId: string;
  toReadingId: string;
  fromTimestamp: string;
  toTimestamp: string;
  tkConsumed: number;
  kwhConsumed: number;
  isRecharge: boolean;
  rechargeAmountTk: number;
  isAutoDetectedRecharge: boolean;
  warning: string | null;
  slabSegments: SlabSegment[];
  month: string; // "YYYY-MM"
  slabTrack: SlabTrack;
}

export interface MonthlyState {
  month: string;
  cumulativeKwh: number;
  lifelineEligible: boolean;
  reclassifiedAt: string | null;
}
