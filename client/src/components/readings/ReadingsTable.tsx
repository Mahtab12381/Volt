import type { Reading } from '@electricity/shared';
import { formatDateTime, formatTk } from '../../utils/formatters.js';
import { STATUS } from '../../utils/chartColors.js';
import { getReadingId } from '../../utils/readingId.js';

export function ReadingsTable({
  readings,
  onEdit,
  onDelete,
}: {
  readings: Reading[]; // expected sorted newest-first
  onEdit: (reading: Reading) => void;
  onDelete: (reading: Reading) => void;
}) {
  if (readings.length === 0) {
    return <p className="py-8 text-center text-sm text-ink-muted">No readings yet — add your first one above.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border-hairline">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-hairline text-left text-xs uppercase tracking-wide text-ink-muted">
            <th className="px-4 py-3 font-medium whitespace-nowrap">Date &amp; time</th>
            <th className="px-4 py-3 font-medium">Balance</th>
            <th className="px-4 py-3 font-medium">Change</th>
            <th className="px-4 py-3 font-medium">Note</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {readings.map((reading, i) => {
            const older = readings[i + 1];
            const delta = older ? reading.balanceTk - older.balanceTk : null;
            const isRechargeRow = reading.isRecharge || reading.isAutoDetectedRecharge;
            const rechargeAmount = reading.isRecharge ? reading.rechargeAmountTk : reading.autoRechargeAmountTk;

            return (
              <tr key={getReadingId(reading)} className="border-b border-border-hairline last:border-0">
                <td className="px-4 py-3 text-ink-primary whitespace-nowrap">{formatDateTime(reading.timestamp)}</td>
                <td className="px-4 py-3 tabular-nums text-ink-primary">{formatTk(reading.balanceTk)}</td>
                <td className="px-4 py-3">
                  {isRechargeRow ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ color: STATUS.good, backgroundColor: 'color-mix(in srgb, var(--status-good) 16%, transparent)' }}
                    >
                      ⚡ Recharge +{formatTk(rechargeAmount ?? 0)}
                      {reading.isAutoDetectedRecharge && !reading.isRecharge && ' (auto)'}
                    </span>
                  ) : delta !== null ? (
                    <span className="tabular-nums text-ink-secondary">-{formatTk(Math.abs(delta))}</span>
                  ) : (
                    <span className="text-ink-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-secondary">{reading.note || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(reading)}
                      className="rounded-md px-2 py-1 text-xs font-medium text-ink-secondary hover:bg-[var(--surface-hover)] hover:text-ink-primary"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(reading)}
                      className="rounded-md px-2 py-1 text-xs font-medium hover:bg-[var(--surface-hover)]"
                      style={{ color: STATUS.critical }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
