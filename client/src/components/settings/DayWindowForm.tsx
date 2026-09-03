import { useState } from 'react';
import type { AppSettings, UpdateSettingsInput } from '@electricity/shared';

export function DayWindowForm({
  settings,
  onSave,
  isSaving,
}: {
  settings: AppSettings;
  onSave: (update: UpdateSettingsInput) => void;
  isSaving?: boolean;
}) {
  const [dayStartHour, setDayStartHour] = useState(String(settings.dayWindow.startHour));
  const [dayEndHour, setDayEndHour] = useState(String(settings.dayWindow.endHour));

  function handleSave() {
    onSave({ dayWindow: { startHour: Number(dayStartHour), endHour: Number(dayEndHour) } });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-secondary">
        Sets the boundary between "day" and "night" hours used by the day-vs-night usage chart and the hourly breakdown.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-ink-secondary">
          Day starts at (0-23)
          <input
            type="number"
            step="1"
            min="0"
            max="23"
            value={dayStartHour}
            onChange={(e) => setDayStartHour(e.target.value)}
            className="rounded-lg border border-border-hairline bg-[var(--surface-2)] px-3 py-2 text-ink-primary tabular-nums outline-none focus:border-[var(--series-1)]"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink-secondary">
          Night starts at (0-23)
          <input
            type="number"
            step="1"
            min="0"
            max="23"
            value={dayEndHour}
            onChange={(e) => setDayEndHour(e.target.value)}
            className="rounded-lg border border-border-hairline bg-[var(--surface-2)] px-3 py-2 text-ink-primary tabular-nums outline-none focus:border-[var(--series-1)]"
          />
        </label>
      </div>
      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="self-start rounded-lg bg-[var(--series-1)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isSaving ? 'Saving…' : 'Save day window'}
      </button>
    </div>
  );
}
