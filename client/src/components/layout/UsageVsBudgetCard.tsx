import type { SummaryResponse } from '@electricity/shared';
import { STATUS } from '../../utils/chartColors.js';
import { formatKwh, formatTk } from '../../utils/formatters.js';

type ActiveBudgetStatus = Exclude<SummaryResponse['budgetStatus'], 'not_set'>;

const STATUS_META: Record<ActiveBudgetStatus, { label: string; tone: 'good' | 'warning' | 'critical' }> = {
  on_track: { label: 'On track', tone: 'good' },
  at_risk: { label: 'At risk', tone: 'warning' },
  over_budget: { label: 'Over budget', tone: 'critical' },
};

export function UsageVsBudgetCard({
  cumulativeTkThisMonth,
  cumulativeKwhThisMonth,
  monthlyBudgetTk,
  budgetStatus,
}: {
  cumulativeTkThisMonth: number;
  cumulativeKwhThisMonth: number;
  monthlyBudgetTk: number;
  budgetStatus: SummaryResponse['budgetStatus'];
}) {
  if (budgetStatus === 'not_set') {
    return (
      <div className="rounded-xl border border-border-hairline bg-surface-card p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-ink-muted">This month's usage</div>
        <div className="mt-2 text-2xl font-semibold tabular-nums text-ink-primary">{formatTk(cumulativeTkThisMonth)}</div>
        <div className="mt-0.5 text-sm text-ink-secondary">~{formatKwh(cumulativeKwhThisMonth)} used</div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]" />
        <div className="mt-1.5 text-xs text-ink-secondary">Set a monthly budget in Settings to track it here.</div>
      </div>
    );
  }

  const meta = STATUS_META[budgetStatus];
  const barColor = STATUS[meta.tone];
  const percent = monthlyBudgetTk > 0 ? (cumulativeTkThisMonth / monthlyBudgetTk) * 100 : 0;
  const barWidth = Math.min(100, Math.max(0, percent));

  return (
    <div className="rounded-xl border border-border-hairline bg-surface-card p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wide text-ink-muted">This month's usage</div>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ color: barColor, backgroundColor: `color-mix(in srgb, ${barColor} 16%, transparent)` }}
        >
          {meta.label}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-2xl font-semibold tabular-nums text-ink-primary">{formatTk(cumulativeTkThisMonth)}</span>
        <span className="text-sm text-ink-secondary">of {formatTk(monthlyBudgetTk)} budget</span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
        <div className="h-full rounded-full transition-[width]" style={{ width: `${barWidth}%`, backgroundColor: barColor }} />
      </div>
      <div className="mt-1.5 text-xs text-ink-secondary">
        {formatKwh(cumulativeKwhThisMonth)} used so far · {Math.round(percent)}% of budget
      </div>
    </div>
  );
}
