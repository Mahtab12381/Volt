import { formatMonth } from '../../utils/formatters.js';

export function MonthPicker({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (month: string) => void;
}) {
  return (
    <select
      aria-label="Month"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-border-hairline bg-[var(--surface-2)] px-3 py-2 text-sm font-medium text-ink-primary outline-none focus:border-[var(--series-1)]"
    >
      {options.map((month) => (
        <option key={month} value={month}>
          {formatMonth(month)}
        </option>
      ))}
    </select>
  );
}
