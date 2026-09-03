import { Schema, model, type InferSchemaType } from 'mongoose';

const monthlyStateSchema = new Schema(
  {
    month: { type: String, required: true, unique: true },
    cumulativeKwh: { type: Number, required: true, default: 0 },
    lifelineEligible: { type: Boolean, required: true, default: true },
    reclassifiedAt: { type: Date, default: null },
    firstReadingId: { type: Schema.Types.ObjectId, ref: 'Reading', default: null },
    lastReadingId: { type: Schema.Types.ObjectId, ref: 'Reading', default: null },
  },
  { timestamps: true },
);

export type MonthlyStateDoc = InferSchemaType<typeof monthlyStateSchema>;
export const MonthlyStateModel = model('MonthlyState', monthlyStateSchema);
