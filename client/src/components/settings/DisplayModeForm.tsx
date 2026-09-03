import type { AppSettings, UnitMode, UpdateSettingsInput } from '@electricity/shared';
import { UnitToggle } from '../layout/UnitToggle.js';

export function DisplayModeForm({
  settings,
  onSave,
  isSaving,
}: {
  settings: AppSettings;
  onSave: (update: UpdateSettingsInput) => void;
  isSaving?: boolean;
}) {
  function handleChange(mode: UnitMode) {
    onSave({ defaultUnitMode: mode });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink-secondary">
        Choose whether the dashboard's graphs open in kWh or Tk by default. You can still switch units for the current
        session with the toggle at the top of the Dashboard — this only sets what it starts on.
      </p>
      <div className="flex items-center gap-3">
        <UnitToggle value={settings.defaultUnitMode} onChange={handleChange} />
        {isSaving && <span className="text-xs text-ink-muted">Saving…</span>}
      </div>
    </div>
  );
}
