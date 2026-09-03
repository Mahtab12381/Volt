import { useState } from 'react';
import type { AppSettings, UpdateSettingsInput } from '@electricity/shared';

export function BudgetForm({
  settings,
  onSave,
  isSaving,
}: {
  settings: AppSettings;
  onSave: (update: UpdateSettingsInput) => void;
  isSaving?: boolean;
}) {
  const [monthlyBudgetTk, setMonthlyBudgetTk] = useState(String(settings.monthlyBudgetTk || ''));
  const [atRiskPercent, setAtRiskPercent] = useState(String(Math.round(settings.budgetAtRiskFraction * 100)));

  function handleSave() {
    onSave({
      monthlyBudgetTk: monthlyBudgetTk === '' ? 0 : Number(monthlyBudgetTk),
      budgetAtRiskFraction: Number(atRiskPercent) / 100,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-secondary">
        Set how much you want to spend per month. The dashboard's <span className="text-ink-primary">Budget status</span> tile
        compares your projected month-end bill against this amount instead of the DESCO lifeline slab — the slab math still
        runs correctly behind the scenes for kWh/Tk conversion, it just no longer drives that badge.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-ink-secondary">
          Monthly budget (Tk)
          <input
            type="number"
            step="1"
            placeholder="e.g. 2000 (blank = no budget set)"
            value={monthlyBudgetTk}
            onChange={(e) => setMonthlyBudgetTk(e.target.value)}
            className="rounded-lg border border-border-hairline bg-[var(--surface-2)] px-3 py-2 text-ink-primary tabular-nums outline-none focus:border-[var(--series-1)]"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink-secondary">
          "At risk" threshold (% of budget)
          <input
            type="number"
            step="1"
            min="0"
            max="100"
            value={atRiskPercent}
            onChange={(e) => setAtRiskPercent(e.target.value)}
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
        {isSaving ? 'Saving…' : 'Save budget'}
      </button>
    </div>
  );
}
