import clsx from 'clsx';
import type { UnitMode } from '@electricity/shared';

const OPTIONS: { value: UnitMode; label: string }[] = [
  { value: 'kwh', label: 'kWh' },
  { value: 'tk', label: 'Tk' },
];

export function UnitToggle({ value, onChange }: { value: UnitMode; onChange: (mode: UnitMode) => void }) {
  return (
    <div
      role="radiogroup"
      aria-label="Graph unit"
      className="inline-flex rounded-lg border border-border-hairline bg-[var(--surface-2)] p-0.5"
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={clsx(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            value === opt.value ? 'bg-[var(--series-1)] text-white' : 'text-ink-secondary hover:text-ink-primary',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
