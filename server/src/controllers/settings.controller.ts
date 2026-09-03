import type { Request, Response } from 'express';
import { z } from 'zod';
import { AppSettingsModel, DEFAULT_SETTINGS, ensureDefaultSettings } from '../models/AppSettings.model.js';

const standardSlabSchema = z.object({
  minKwh: z.number().min(0),
  maxKwh: z.number().nullable(),
  rateTkPerKwh: z.number().positive(),
});

const settingsSchema = z.object({
  lifelineSlab: z.object({ thresholdKwh: z.number().positive(), rateTkPerKwh: z.number().positive() }).optional(),
  standardSlabs: z.array(standardSlabSchema).min(1).optional(),
  demandChargeTkPerKw: z.number().min(0).optional(),
  sanctionedLoadKw: z.number().min(0).optional(),
  meterRentTk: z.number().min(0).optional(),
  vatPercent: z.number().min(0).optional(),
  rebatePercent: z.number().min(0).optional(),
  dayWindow: z.object({ startHour: z.number().min(0).max(23), endHour: z.number().min(0).max(23) }).optional(),
  monthlyBudgetTk: z.number().min(0).optional(),
  budgetAtRiskFraction: z.number().min(0).max(1).optional(),
  defaultUnitMode: z.enum(['kwh', 'tk']).optional(),
});

export async function getSettings(_req: Request, res: Response) {
  await ensureDefaultSettings();
  const settings = await AppSettingsModel.findById('singleton').lean();
  res.json(settings ?? DEFAULT_SETTINGS);
}

export async function updateSettings(req: Request, res: Response) {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  await ensureDefaultSettings();
  const settings = await AppSettingsModel.findByIdAndUpdate('singleton', { $set: parsed.data }, { new: true }).lean();
  res.json(settings);
}
