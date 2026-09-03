import { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader.js';
import { SlabConfigEditor } from '../components/settings/SlabConfigEditor.js';
import { FixedChargesForm } from '../components/settings/FixedChargesForm.js';
import { useSettings, useUpdateSettings } from '../hooks/useSettings.js';
import { readingsApi } from '../api/readings.api.js';
import { STATUS } from '../utils/chartColors.js';

export function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const [recalcState, setRecalcState] = useState<'idle' | 'running' | 'done'>('idle');

  async function handleRecalculateAll() {
    setRecalcState('running');
    await readingsApi.recalculateAll();
    setRecalcState('done');
    setTimeout(() => setRecalcState('idle'), 2500);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Settings" subtitle="Tariff configuration and fixed charges, used for kWh conversion and bill projection." />

      <div
        className="mb-6 rounded-xl border px-4 py-3 text-sm text-ink-secondary"
        style={{ borderColor: 'var(--border-hairline)', backgroundColor: 'var(--surface-2)' }}
      >
        <p className="mb-1 font-medium text-ink-primary">These rates are estimates you control</p>
        <p>
          Slab rates were seeded from a third-party summary of DESCO's tariff, not the official notification — double-check
          against DESCO's published tariff page before relying on these figures. This app also doesn't version rate changes
          over time: editing a rate here and recalculating applies it to <em>all</em> historical data, so past months'
          figures may shift. The lifeline (0–50 kWh) rate is retroactive in real DESCO billing — if a month's usage ever
          crosses 50 kWh, the whole month is repriced from the next slab, which this app models, but the "at risk" and
          "on track" badges are still best-effort estimates until the month closes.
        </p>
      </div>

      {isLoading || !settings ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : (
        <div className="flex flex-col gap-8">
          <section className="rounded-xl border border-border-hairline bg-surface-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-ink-primary">Tariff slabs</h2>
            <SlabConfigEditor
              settings={settings}
              isSaving={updateSettings.isPending}
              onSave={(update) => updateSettings.mutate(update)}
            />
          </section>

          <section className="rounded-xl border border-border-hairline bg-surface-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-ink-primary">Fixed charges &amp; day window</h2>
            <FixedChargesForm
              settings={settings}
              isSaving={updateSettings.isPending}
              onSave={(update) => updateSettings.mutate(update)}
            />
          </section>

          <section className="rounded-xl border border-border-hairline bg-surface-card p-5">
            <h2 className="mb-2 text-sm font-semibold text-ink-primary">Recalculate all data</h2>
            <p className="mb-4 text-sm text-ink-secondary">
              After changing a tariff rate, run this to reprice all historical readings against the new configuration.
            </p>
            <button
              type="button"
              onClick={handleRecalculateAll}
              disabled={recalcState === 'running'}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: STATUS.warning, color: '#1a1400' }}
            >
              {recalcState === 'running' ? 'Recalculating…' : recalcState === 'done' ? 'Done ✓' : 'Recalculate all'}
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
