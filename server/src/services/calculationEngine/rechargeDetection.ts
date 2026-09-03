import type { RechargeDetectionResult } from './types.js';

const EPSILON = 1e-9;

/**
 * Disambiguates a balance change between two consecutive readings into either
 * consumption (Tk) or a recharge/top-up event. Consumption is guaranteed to
 * never be negative: any balance increase is always routed to a recharge
 * event, whether the user flagged it or not.
 */
export function detectRechargeAndConsumption(
  prevBalanceTk: number,
  curr: { balanceTk: number; isRecharge: boolean; rechargeAmountTk: number | null },
): RechargeDetectionResult {
  if (curr.isRecharge) {
    const declared = curr.rechargeAmountTk ?? 0;
    const implied = prevBalanceTk + declared - curr.balanceTk;

    if (implied >= -EPSILON) {
      return {
        tkConsumed: Math.max(0, implied),
        isRecharge: true,
        rechargeAmountTk: declared,
        isAutoDetectedRecharge: false,
        warning: null,
      };
    }

    const extra = -implied;
    return {
      tkConsumed: 0,
      isRecharge: true,
      rechargeAmountTk: declared + extra,
      isAutoDetectedRecharge: true,
      warning: `Declared recharge of Tk ${declared.toFixed(2)} was insufficient to explain the balance change; auto-added Tk ${extra.toFixed(2)}.`,
    };
  }

  if (curr.balanceTk <= prevBalanceTk) {
    return {
      tkConsumed: prevBalanceTk - curr.balanceTk,
      isRecharge: false,
      rechargeAmountTk: 0,
      isAutoDetectedRecharge: false,
      warning: null,
    };
  }

  const delta = curr.balanceTk - prevBalanceTk;
  return {
    tkConsumed: 0,
    isRecharge: true,
    rechargeAmountTk: delta,
    isAutoDetectedRecharge: true,
    warning: `Balance rose by Tk ${delta.toFixed(2)} without a recharge flag; logged as an auto-detected recharge.`,
  };
}
