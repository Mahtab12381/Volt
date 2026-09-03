import { useState } from 'react';
import type { AppSettings, StandardSlabBand } from '@electricity/shared';

type Draft = {
  lifelineThresholdKwh: string;
  lifelineRateTkPerKwh: string;
  standardSlabs: { minKwh: string; maxKwh: string; rateTkPerKwh: string }[];
};

function toDraft(settings: AppSettings): Draft {
  return {
    lifelineThresholdKwh: String(settings.lifelineSlab.thresholdKwh),
    lifelineRateTkPerKwh: String(settings.lifelineSlab.rateTkPerKwh),
    standardSlabs: settings.standardSlabs.map((s) => ({
      minKwh: String(s.minKwh),
      maxKwh: s.maxKwh === null ? '' : String(s.maxKwh),
      rateTkPerKwh: String(s.rateTkPerKwh),
    })),
  };
}

export function SlabConfigEditor({
  settings,
  onSave,
  isSaving,
}: {
  settings: AppSettings;
  onSave: (update: { lifelineSlab: AppSettings['lifelineSlab']; standardSlabs: StandardSlabBand[] }) => void;
  isSaving?: boolean;
}) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(settings));

  function updateSlabRow(i: number, field: keyof Draft['standardSlabs'][number], value: string) {
    setDraft((d) => ({
      ...d,
      standardSlabs: d.standardSlabs.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)),
    }));
  }

  function addRow() {
    setDraft((d) => ({ ...d, standardSlabs: [...d.standardSlabs, { minKwh: '', maxKwh: '', rateTkPerKwh: '' }] }));
  }

  function removeRow(i: number) {
    setDraft((d) => ({ ...d, standardSlabs: d.standardSlabs.filter((_, idx) => idx !== i) }));
  }

  function handleSave() {
    onSave({
      lifelineSlab: {
        thresholdKwh: Number(draft.lifelineThresholdKwh),
        rateTkPerKwh: Number(draft.lifelineRateTkPerKwh),
      },
      standardSlabs: draft.standardSlabs.map((s) => ({
        minKwh: Number(s.minKwh),
        maxKwh: s.maxKwh === '' ? null : Number(s.maxKwh),
        rateTkPerKwh: Number(s.rateTkPerKwh),
      })),
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Lifeline slab</h3>
        <div className="grid grid-cols-2 gap-3 sm:w-1/2">
          <label className="flex flex-col gap-1 text-sm text-ink-secondary">
            Threshold (kWh/month)
            <input
              type="number"
              value={draft.lifelineThresholdKwh}
              onChange={(e) => setDraft((d) => ({ ...d, lifelineThresholdKwh: e.target.value }))}
              className="rounded-lg border border-border-hairline bg-[var(--surface-2)] px-3 py-2 text-ink-primary tabular-nums outline-none focus:border-[var(--series-1)]"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-ink-secondary">
            Rate (Tk/kWh)
            <input
              type="number"
              step="0.01"
              value={draft.lifelineRateTkPerKwh}
              onChange={(e) => setDraft((d) => ({ ...d, lifelineRateTkPerKwh: e.target.value }))}
              className="rounded-lg border border-border-hairline bg-[var(--surface-2)] px-3 py-2 text-ink-primary tabular-nums outline-none focus:border-[var(--series-1)]"
            />
          </label>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Standard slab ladder</h3>
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs text-ink-muted">
            <span>Min kWh</span>
            <span>Max kWh (blank = open-ended)</span>
            <span>Rate (Tk/kWh)</span>
            <span />
          </div>
          {draft.standardSlabs.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
              <input
                type="number"
                value={row.minKwh}
                onChange={(e) => updateSlabRow(i, 'minKwh', e.target.value)}
                className="rounded-lg border border-border-hairline bg-[var(--surface-2)] px-3 py-2 text-sm text-ink-primary tabular-nums outline-none focus:border-[var(--series-1)]"
              />
              <input
                type="number"
                value={row.maxKwh}
                placeholder="open-ended"
                onChange={(e) => updateSlabRow(i, 'maxKwh', e.target.value)}
                className="rounded-lg border border-border-hairline bg-[var(--surface-2)] px-3 py-2 text-sm text-ink-primary tabular-nums outline-none focus:border-[var(--series-1)]"
              />
              <input
                type="number"
                step="0.01"
                value={row.rateTkPerKwh}
                onChange={(e) => updateSlabRow(i, 'rateTkPerKwh', e.target.value)}
                className="rounded-lg border border-border-hairline bg-[var(--surface-2)] px-3 py-2 text-sm text-ink-primary tabular-nums outline-none focus:border-[var(--series-1)]"
              />
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="rounded-lg px-2 text-sm text-ink-muted hover:bg-[var(--surface-hover)] hover:text-ink-primary"
                aria-label="Remove slab"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addRow}
            className="mt-1 self-start rounded-lg px-3 py-1.5 text-xs font-medium text-ink-secondary hover:bg-[var(--surface-hover)] hover:text-ink-primary"
          >
            + Add slab
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="self-start rounded-lg bg-[var(--series-1)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isSaving ? 'Saving…' : 'Save tariff config'}
      </button>
    </div>
  );
}
