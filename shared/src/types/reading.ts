// 'none' = rechargeAmountTk is already the net amount credited to balance.
// 'vatRebate' = rechargeAmountTk is the gross amount paid; VAT/rebate (from Settings) are backed out.
// 'all' = same as 'vatRebate', plus the monthly meter rent + demand charge are also backed out.
export type RechargeAdjustment = 'none' | 'vatRebate' | 'all';

export interface Reading {
  id: string;
  timestamp: string; // ISO 8601, UTC
  balanceTk: number;
  isRecharge: boolean;
  rechargeAmountTk: number | null;
  rechargeAdjustment: RechargeAdjustment;
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
