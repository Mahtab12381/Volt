import { useEffect, useState } from 'react';
import type { CreateReadingInput, RechargeAdjustment } from '@electricity/shared';
import { bdDateTimeLocalToIso, formatTk, isoToBdDateTimeLocal, nowAsBdDateTimeLocal } from '../../utils/formatters.js';
import { useSettings } from '../../hooks/useSettings.js';
import { useSummary } from '../../hooks/useAnalytics.js';

export interface ReadingFormValues {
  dateTimeLocal: string;
  balanceTk: string;
  isRecharge: boolean;
  rechargeAmountTk: string;
  rechargeAdjustment: RechargeAdjustment;
  note: string;
}

export interface ReadingFormInitial {
  timestamp?: string;
  balanceTk?: number;
  isRecharge?: boolean;
  rechargeAmountTk?: number | null;
  rechargeAdjustment?: RechargeAdjustment;
  note?: string | null;
}

function toFormValues(input?: ReadingFormInitial): ReadingFormValues {
  return {
    dateTimeLocal: input?.timestamp ? isoToBdDateTimeLocal(input.timestamp) : nowAsBdDateTimeLocal(),
    balanceTk: input?.balanceTk !== undefined ? String(input.balanceTk) : '',
    isRecharge: input?.isRecharge ?? false,
    rechargeAmountTk: input?.rechargeAmountTk !== undefined && input?.rechargeAmountTk !== null ? String(input.rechargeAmountTk) : '',
    rechargeAdjustment: input?.rechargeAdjustment ?? 'none',
    note: input?.note ?? '',
  };
}

// Mirrors server/src/services/calculationEngine/rechargeAdjustment.ts — preview only,
// the server is the source of truth for what actually gets recorded.
function previewNetCredit(
  grossTk: number,
  mode: RechargeAdjustment,
  settings: { vatPercent: number; rebatePercent: number; demandChargeTkPerKw: number; sanctionedLoadKw: number; meterRentTk: number },
): number {
  if (mode === 'none') return grossTk;
  const demandCharge = mode === 'all' ? settings.demandChargeTkPerKw * settings.sanctionedLoadKw : 0;
  const meterRent = mode === 'all' ? settings.meterRentTk : 0;
  const v = settings.vatPercent / 100;
  const r = settings.rebatePercent / 100;
  if (r >= 1) return grossTk / (1 + v) - meterRent - demandCharge;
  return (grossTk / (1 + v) - meterRent) / (1 - r) - demandCharge;
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
  const settings = useSettings();
  const summary = useSummary();

  // Auto-fill the meter balance from (current balance + net credit of this recharge) —
  // only for a brand-new reading. An edit doesn't get this: "current balance" is the
  // latest reading overall, which isn't necessarily the one right before the reading
  // being edited, so guessing here could silently overwrite a correct historical value.
  useEffect(() => {
    if (initial) return;
    if (!values.isRecharge) return;
    const grossTk = Number(values.rechargeAmountTk);
    if (Number.isNaN(grossTk) || grossTk <= 0) return;
    if (!settings.data || !summary.data) return;

    const netCredit = previewNetCredit(grossTk, values.rechargeAdjustment, settings.data);
    const newBalance = summary.data.currentBalanceTk + netCredit;
    setValues((v) => ({ ...v, balanceTk: newBalance.toFixed(2) }));
  }, [initial, values.isRecharge, values.rechargeAmountTk, values.rechargeAdjustment, settings.data, summary.data]);

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
      rechargeAdjustment: values.isRecharge ? values.rechargeAdjustment : undefined,
      note: values.note || undefined,
    });
  }

  const grossTk = Number(values.rechargeAmountTk);
  const hasValidRecharge = values.isRecharge && !Number.isNaN(grossTk) && grossTk > 0;
  const showPreview = hasValidRecharge && values.rechargeAdjustment !== 'none' && settings.data;
  const netCredit = showPreview && settings.data ? previewNetCredit(grossTk, values.rechargeAdjustment, settings.data) : null;
  const autoFilledBalance = !initial && hasValidRecharge && !!settings.data && !!summary.data;

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
          {autoFilledBalance && (
            <span className="text-xs text-ink-muted">Auto-filled: current balance + credited amount. Edit if it doesn't match your meter.</span>
          )}
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-secondary">
        <input
          type="checkbox"
          checked={values.isRecharge}
          onChange={(e) => setValues((v) => ({ ...v, isRecharge: e.target.checked, rechargeAdjustment: e.target.checked ? v.rechargeAdjustment : 'none' }))}
          className="h-4 w-4 rounded border-border-hairline accent-[var(--series-1)]"
        />
        This is a recharge (balance went up)
      </label>

      {values.isRecharge && (
        <div className="flex flex-col gap-3 sm:w-2/3">
          <label className="flex flex-col gap-1.5 text-sm text-ink-secondary">
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

          <div className="flex flex-col gap-2 rounded-lg border border-border-hairline bg-[var(--surface-2)] p-3">
            <p className="text-xs text-ink-muted">
              If the amount above is the gross cash you paid (not the net amount credited to your balance), have the app back out
              the difference using your Settings percentages:
            </p>
            <label className="flex items-center gap-2 text-sm text-ink-secondary">
              <input
                type="checkbox"
                checked={values.rechargeAdjustment === 'vatRebate'}
                onChange={(e) => setValues((v) => ({ ...v, rechargeAdjustment: e.target.checked ? 'vatRebate' : 'none' }))}
                className="h-4 w-4 rounded border-border-hairline accent-[var(--series-1)]"
              />
              Deduct VAT &amp; rebate only
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-secondary">
              <input
                type="checkbox"
                checked={values.rechargeAdjustment === 'all'}
                onChange={(e) => setValues((v) => ({ ...v, rechargeAdjustment: e.target.checked ? 'all' : 'none' }))}
                className="h-4 w-4 rounded border-border-hairline accent-[var(--series-1)]"
              />
              Deduct VAT, rebate &amp; this month's meter rent + demand charge
            </label>

            {netCredit !== null && (
              <p className="text-xs text-ink-secondary">
                ≈ <span className="font-medium tabular-nums text-ink-primary">{formatTk(netCredit)}</span> will be credited to your
                balance for this recharge.
              </p>
            )}
          </div>
        </div>
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
