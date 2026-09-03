import { STATUS } from '../../utils/chartColors.js';
import { formatTk } from '../../utils/formatters.js';

export function LowBalanceBanner({
  currentBalanceTk,
  estimatedDaysUntilExhaustion,
  thresholdDays = 3,
}: {
  currentBalanceTk: number;
  estimatedDaysUntilExhaustion: number | null;
  thresholdDays?: number;
}) {
  if (estimatedDaysUntilExhaustion === null || estimatedDaysUntilExhaustion > thresholdDays) return null;

  const tone = estimatedDaysUntilExhaustion <= 1 ? 'critical' : 'serious';

  return (
    <div
      className="mb-6 flex items-center gap-3 rounded-xl border px-4 py-3"
      style={{
        borderColor: `color-mix(in srgb, ${STATUS[tone]} 40%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${STATUS[tone]} 12%, transparent)`,
      }}
    >
      <span aria-hidden style={{ color: STATUS[tone] }}>
        ⚠
      </span>
      <div className="text-sm text-ink-primary">
        <span className="font-medium">Low balance:</span> {formatTk(currentBalanceTk)} left, projected to last about{' '}
        <span className="font-medium">{estimatedDaysUntilExhaustion.toFixed(1)} more day(s)</span> at your recent usage pace.
      </div>
    </div>
  );
}
