import { describe, expect, it } from 'vitest';
import { computeNetRechargeCredit } from '../../src/services/calculationEngine/rechargeAdjustment.js';
import type { RechargeAdjustmentSettings } from '../../src/services/calculationEngine/types.js';

// rebatePercent (0.495, not the Settings-page default of 0.5) and the rebate/VAT scoping below
// were reverse-engineered from two real DESCO recharge receipts, not assumed:
//   Receipt A: Energy 748.92, Demand 168, MeterRent 40, VAT 47.62, Rebate -4.54, Gross 1000
//   Receipt B: Energy 1914.24, Demand 0,   MeterRent 0,  VAT 95.24, Rebate -9.48, Gross 2000
const SETTINGS: RechargeAdjustmentSettings = {
  vatPercent: 5,
  rebatePercent: 0.495,
  demandChargeTkPerKw: 42,
  sanctionedLoadKw: 4,
  meterRentTk: 40,
};

describe('computeNetRechargeCredit', () => {
  it('mode "none" passes the entered amount through unchanged', () => {
    expect(computeNetRechargeCredit(500, 'none', SETTINGS)).toBe(500);
  });

  it('"vatRebate" reproduces receipt B (no demand charge/meter rent this recharge): gross 2000 -> energy 1914.24', () => {
    expect(computeNetRechargeCredit(2000, 'vatRebate', SETTINGS)).toBeCloseTo(1914.24, 1);
  });

  it('"all" reproduces receipt A (demand charge + meter rent taken this recharge): gross 1000 -> energy 748.92', () => {
    expect(computeNetRechargeCredit(1000, 'all', SETTINGS)).toBeCloseTo(748.92, 1);
  });

  it('is the exact inverse of the real forward model: rebate on (Energy+Demand), VAT on (Energy+Demand+MeterRent) net of rebate', () => {
    const energyCost = 823.5;
    const demandCharge = SETTINGS.demandChargeTkPerKw * SETTINGS.sanctionedLoadKw;
    const meterRent = SETTINGS.meterRentTk;

    const rebate = -(SETTINGS.rebatePercent / 100) * (energyCost + demandCharge);
    const vatBase = energyCost + demandCharge + meterRent + rebate;
    const vatAmount = (SETTINGS.vatPercent / 100) * vatBase;
    const grossTk = vatBase + vatAmount;

    expect(computeNetRechargeCredit(grossTk, 'all', SETTINGS)).toBeCloseTo(energyCost, 6);
  });

  it('"all" nets out less balance credit than "vatRebate" for the same gross payment', () => {
    const netVatRebateOnly = computeNetRechargeCredit(1000, 'vatRebate', SETTINGS);
    const netAll = computeNetRechargeCredit(1000, 'all', SETTINGS);
    expect(netAll).toBeLessThan(netVatRebateOnly);
  });
});
