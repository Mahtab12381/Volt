import { useState } from 'react';
import type { CreateReadingInput } from '@electricity/shared';
import { bdDateTimeLocalToIso, isoToBdDateTimeLocal, nowAsBdDateTimeLocal } from '../../utils/formatters.js';

export interface ReadingFormValues {
  dateTimeLocal: string;
  balanceTk: string;
  isRecharge: boolean;
  rechargeAmountTk: string;
  note: string;
}

export interface ReadingFormInitial {
  timestamp?: string;
  balanceTk?: number;
  isRecharge?: boolean;
  rechargeAmountTk?: number | null;
  note?: string | null;
}

function toFormValues(input?: ReadingFormInitial): ReadingFormValues {
  return {
    dateTimeLocal: input?.timestamp ? isoToBdDateTimeLocal(input.timestamp) : nowAsBdDateTimeLocal(),
    balanceTk: input?.balanceTk !== undefined ? String(input.balanceTk) : '',
    isRecharge: input?.isRecharge ?? false,
    rechargeAmountTk: input?.rechargeAmountTk !== undefined && input?.rechargeAmountTk !== null ? String(input.rechargeAmountTk) : '',
    note: input?.note ?? '',
  };
}

export function ReadingForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initial?: ReadingFormInitial;
  submitLabel: string;
  onSubmit: (input: CreateReadingInput) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}) {
  const [values, setValues] = useState<ReadingFormValues>(() => toFormValues(initial));
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const balanceTk = Number(values.balanceTk);
    if (Number.isNaN(balanceTk)) {
      setError('Balance must be a number.');
      return;
    }
    if (values.isRecharge && (values.rechargeAmountTk === '' || Number.isNaN(Number(values.rechargeAmountTk)))) {
      setError('Enter the recharge amount, or uncheck "This is a recharge".');
      return;
    }

    onSubmit({
      timestamp: bdDateTimeLocalToIso(values.dateTimeLocal),
      balanceTk,
      isRecharge: values.isRecharge,
      rechargeAmountTk: values.isRecharge ? Number(values.rechargeAmountTk) : undefined,
      note: values.note || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm text-ink-secondary">
          Date &amp; time (BD)
          <input
            type="datetime-local"
            required
            value={values.dateTimeLocal}
            onChange={(e) => setValues((v) => ({ ...v, dateTimeLocal: e.target.value }))}
            className="rounded-lg border border-border-hairline bg-[var(--surface-2)] px-3 py-2 text-ink-primary outline-none focus:border-[var(--series-1)]"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-ink-secondary">
          Meter balance (Tk)
          <input
            type="number"
            step="0.01"
            required
            placeholder="1875.89"
            value={values.balanceTk}
            onChange={(e) => setValues((v) => ({ ...v, balanceTk: e.target.value }))}
            className="rounded-lg border border-border-hairline bg-[var(--surface-2)] px-3 py-2 text-ink-primary tabular-nums outline-none focus:border-[var(--series-1)]"
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-secondary">
        <input
          type="checkbox"
          checked={values.isRecharge}
          onChange={(e) => setValues((v) => ({ ...v, isRecharge: e.target.checked }))}
          className="h-4 w-4 rounded border-border-hairline accent-[var(--series-1)]"
        />
        This is a recharge (balance went up)
      </label>

      {values.isRecharge && (
        <label className="flex flex-col gap-1.5 text-sm text-ink-secondary sm:w-1/2">
          Recharge amount (Tk)
          <input
            type="number"
            step="0.01"
            required
            placeholder="500"
            value={values.rechargeAmountTk}
            onChange={(e) => setValues((v) => ({ ...v, rechargeAmountTk: e.target.value }))}
            className="rounded-lg border border-border-hairline bg-[var(--surface-2)] px-3 py-2 text-ink-primary tabular-nums outline-none focus:border-[var(--series-1)]"
          />
        </label>
      )}

      <label className="flex flex-col gap-1.5 text-sm text-ink-secondary">
        Note (optional)
        <input
          type="text"
          value={values.note}
          onChange={(e) => setValues((v) => ({ ...v, note: e.target.value }))}
          className="rounded-lg border border-border-hairline bg-[var(--surface-2)] px-3 py-2 text-ink-primary outline-none focus:border-[var(--series-1)]"
        />
      </label>

      {error && <p className="text-sm" style={{ color: 'var(--status-critical)' }}>{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-ink-secondary hover:bg-[var(--surface-hover)]"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-[var(--series-1)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
