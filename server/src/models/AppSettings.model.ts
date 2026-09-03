import { Schema, model, type InferSchemaType } from 'mongoose';

const standardSlabBandSchema = new Schema(
  {
    minKwh: { type: Number, required: true },
    maxKwh: { type: Number, default: null },
    rateTkPerKwh: { type: Number, required: true },
  },
  { _id: false },
);

const appSettingsSchema = new Schema(
  {
    _id: { type: String, default: 'singleton' },
    lifelineSlab: {
      thresholdKwh: { type: Number, required: true },
      rateTkPerKwh: { type: Number, required: true },
    },
    standardSlabs: { type: [standardSlabBandSchema], required: true },
    demandChargeTkPerKw: { type: Number, required: true, default: 42 },
    sanctionedLoadKw: { type: Number, required: true, default: 1 },
    meterRentTk: { type: Number, required: true, default: 40 },
    vatPercent: { type: Number, required: true, default: 5 },
    rebatePercent: { type: Number, required: true, default: 0.5 },
    dayWindow: {
      startHour: { type: Number, required: true, default: 7 },
      endHour: { type: Number, required: true, default: 19 },
    },
    monthlyBudgetTk: { type: Number, required: true, default: 0 },
    budgetAtRiskFraction: { type: Number, required: true, default: 0.9 },
    defaultUnitMode: { type: String, enum: ['kwh', 'tk'], required: true, default: 'kwh' },
  },
  { timestamps: true, _id: false },
);

export type AppSettingsDoc = InferSchemaType<typeof appSettingsSchema>;
export const AppSettingsModel = model('AppSettings', appSettingsSchema);

/** Plain, fully-required shape used across the calculation engine — avoids
 * Mongoose's optional/FlattenMaps inference from leaking into pure functions. */
export interface AppSettingsData {
  _id: string;
  lifelineSlab: { thresholdKwh: number; rateTkPerKwh: number };
  standardSlabs: { minKwh: number; maxKwh: number | null; rateTkPerKwh: number }[];
  demandChargeTkPerKw: number;
  sanctionedLoadKw: number;
  meterRentTk: number;
  vatPercent: number;
  rebatePercent: number;
  dayWindow: { startHour: number; endHour: number };
  monthlyBudgetTk: number;
  budgetAtRiskFraction: number;
  defaultUnitMode: 'kwh' | 'tk';
}

export const DEFAULT_SETTINGS: AppSettingsData = {
  _id: 'singleton',
  lifelineSlab: { thresholdKwh: 50, rateTkPerKwh: 4.63 },
  standardSlabs: [
    { minKwh: 0, maxKwh: 75, rateTkPerKwh: 5.26 },
    { minKwh: 76, maxKwh: 200, rateTkPerKwh: 8.5 },
    { minKwh: 201, maxKwh: 300, rateTkPerKwh: 9.1 },
    { minKwh: 301, maxKwh: 400, rateTkPerKwh: 9.62 },
    { minKwh: 401, maxKwh: 600, rateTkPerKwh: 15.01 },
    { minKwh: 601, maxKwh: null, rateTkPerKwh: 17.35 },
  ],
  demandChargeTkPerKw: 42,
  sanctionedLoadKw: 1,
  meterRentTk: 40,
  vatPercent: 5,
  rebatePercent: 0.5,
  dayWindow: { startHour: 7, endHour: 19 },
  monthlyBudgetTk: 0,
  budgetAtRiskFraction: 0.9,
  defaultUnitMode: 'kwh',
};

export async function ensureDefaultSettings(): Promise<void> {
  await AppSettingsModel.findByIdAndUpdate(
    'singleton',
    { $setOnInsert: DEFAULT_SETTINGS },
    { upsert: true, new: true },
  );

  // Backfill top-level fields added to the schema after a settings document
  // already existed — $setOnInsert above only fires for brand-new documents.
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    if (key === '_id') continue;
    await AppSettingsModel.updateOne({ _id: 'singleton', [key]: { $exists: false } }, { $set: { [key]: value } });
  }

  // Drop fields retired from the schema so they don't linger in .lean() reads.
  await AppSettingsModel.updateOne({ _id: 'singleton' }, { $unset: { lifelineWarningMarginKwh: '' } });
}
