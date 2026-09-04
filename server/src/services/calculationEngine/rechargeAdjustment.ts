import type { RechargeAdjustment, RechargeAdjustmentSettings } from './types.js';

/**
 * Backs a gross recharge payment out to the net Tk amount actually credited
 * to the balance (the "energy cost" the balance later draws down against at
 * slab rates), inverting DESCO's real recharge-time pipeline as confirmed
 * against two real recharge receipts:
 *
 *   rebate  = -rebatePercent% * (energyCost + demandCharge)     — meter rent is NOT rebated
 *   vatBase = energyCost + demandCharge + meterRent + rebate
 *   VAT     = vatPercent% * vatBase                             — meter rent and demand charge ARE taxed
 *   gross   = vatBase + VAT = vatBase * (1 + vatPercent%)
 *           = [(energyCost + demandCharge) * (1 - rebatePercent%) + meterRent] * (1 + vatPercent%)
 *
 * so, solving for energyCost:
 *
 *   energyCost = [gross / (1 + vatPercent%) - meterRent] / (1 - rebatePercent%) - demandCharge
 *
 * 'vatRebate' mode is the same formula with demandCharge = meterRent = 0 (this
 * particular recharge didn't carry the periodic fixed-charge deduction), which
 * collapses to energyCost = gross / [(1 - rebatePercent%) * (1 + vatPercent%)].
 */
export function computeNetRechargeCredit(
  grossTk: number,
  mode: RechargeAdjustment,
  settings: RechargeAdjustmentSettings,
): number {
  if (mode === 'none') return grossTk;

  const demandCharge = mode === 'all' ? settings.demandChargeTkPerKw * settings.sanctionedLoadKw : 0;
  const meterRent = mode === 'all' ? settings.meterRentTk : 0;

  const v = settings.vatPercent / 100;
  const r = settings.rebatePercent / 100;
  if (r >= 1) return grossTk / (1 + v) - meterRent - demandCharge;

  return (grossTk / (1 + v) - meterRent) / (1 - r) - demandCharge;
}
