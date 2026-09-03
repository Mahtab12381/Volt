import { useState } from 'react';
import type { AppSettings, UpdateSettingsInput } from '@electricity/shared';

type Draft = Record<
  'demandChargeTkPerKw' | 'sanctionedLoadKw' | 'meterRentTk' | 'vatPercent' | 'rebatePercent' | 'lifelineWarningMarginKwh' | 'dayStartHour' | 'dayEndHour',
  string
>;

function toDraft(settings: AppSettings): Draft {
  return {
    demandChargeTkPerKw: String(settings.demandChargeTkPerKw),
    sanctionedLoadKw: String(settings.sanctionedLoadKw),
    meterRentTk: String(settings.meterRentTk),
    vatPercent: String(settings.vatPercent),
    rebatePercent: String(settings.rebatePercent),
    lifelineWarningMarginKwh: String(settings.lifelineWarningMarginKwh),
    dayStartHour: String(settings.dayWindow.startHour),
    dayEndHour: String(settings.dayWindow.endHour),
  };
}

const FIELDS: { key: keyof Draft; label: string; step?: string }[] = [
  { key: 'demandChargeTkPerKw', label: 'Demand charge (Tk/kW/month)', step: '0.01' },
  { key: 'sanctionedLoadKw', label: 'Sanctioned load (kW)', step: '0.1' },
  { key: 'meterRentTk', label: 'Meter rent (Tk/month)', step: '0.01' },
  { key: 'vatPercent', label: 'VAT (%)', step: '0.1' },
  { key: 'rebatePercent', label: 'Prepaid rebate (%)', step: '0.1' },
  { key: 'lifelineWarningMarginKwh', label: 'Lifeline "at risk" margin (kWh)', step: '1' },
  { key: 'dayStartHour', label: 'Day starts at (0-23)', step: '1' },
  { key: 'dayEndHour', label: 'Night starts at (0-23)', step: '1' },
];

export function FixedChargesForm({
  settings,
  onSave,
  isSaving,
}: {
  settings: AppSettings;
  onSave: (update: UpdateSettingsInput) => void;
  isSaving?: boolean;
}) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(settings));

  function handleSave() {
    onSave({
      demandChargeTkPerKw: Number(draft.demandChargeTkPerKw),
      sanctionedLoadKw: Number(draft.sanctionedLoadKw),
      meterRentTk: Number(draft.meterRentTk),
      vatPercent: Number(draft.vatPercent),
      rebatePercent: Number(draft.rebatePercent),
      lifelineWarningMarginKwh: Number(draft.lifelineWarningMarginKwh),
      dayWindow: { startHour: Number(draft.dayStartHour), endHour: Number(draft.dayEndHour) },
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.key} className="flex flex-col gap-1 text-sm text-ink-secondary">
            {f.label}
            <input
              type="number"
              step={f.step}
              value={draft[f.key]}
              onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
              className="rounded-lg border border-border-hairline bg-[var(--surface-2)] px-3 py-2 text-ink-primary tabular-nums outline-none focus:border-[var(--series-1)]"
            />
          </label>
        ))}
      </div>
      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="self-start rounded-lg bg-[var(--series-1)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isSaving ? 'Saving…' : 'Save fixed charges'}
      </button>
    </div>
  );
}
