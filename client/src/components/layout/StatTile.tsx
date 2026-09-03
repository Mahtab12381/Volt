import clsx from 'clsx';
import { STATUS } from '../../utils/chartColors.js';

export interface StatTileProps {
  label: string;
  value: string;
  hint?: string;
  badge?: { text: string; tone: 'good' | 'warning' | 'serious' | 'critical' };
}

const BADGE_ICON: Record<string, string> = {
  good: '●',
  warning: '▲',
  serious: '▲',
  critical: '⛔',
};

export function StatTile({ label, value, hint, badge }: StatTileProps) {
  return (
    <div className="rounded-xl border border-border-hairline bg-surface-card p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</div>
      <div className="mt-2 text-2xl font-semibold tabular-nums text-ink-primary">{value}</div>
      <div className="mt-2 flex items-center gap-2">
        {hint && <span className="text-xs text-ink-secondary">{hint}</span>}
        {badge && (
          <span
            className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium')}
            style={{ color: STATUS[badge.tone], backgroundColor: `color-mix(in srgb, ${STATUS[badge.tone]} 16%, transparent)` }}
          >
            <span aria-hidden>{BADGE_ICON[badge.tone]}</span>
            {badge.text}
          </span>
        )}
      </div>
    </div>
  );
}

export function KpiRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>;
}
