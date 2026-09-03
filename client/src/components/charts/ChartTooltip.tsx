interface TooltipEntry {
  name: string;
  value: number;
  color: string;
  unit?: string;
}

export function ChartTooltip({
  active,
  label,
  entries,
  formatValue,
}: {
  active?: boolean;
  label?: string;
  entries?: TooltipEntry[];
  formatValue?: (value: number) => string;
}) {
  if (!active || !entries || entries.length === 0) return null;

  return (
    <div className="rounded-lg border border-border-hairline bg-[var(--surface-2)] px-3 py-2 text-xs shadow-xl">
      {entries.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 whitespace-nowrap">
          <span className="tabular-nums font-semibold text-ink-primary">
            {formatValue ? formatValue(entry.value) : entry.value}
          </span>
          <span className="inline-flex items-center gap-1 text-ink-secondary">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}
          </span>
        </div>
      ))}
      {label && <div className="mt-1 text-[10px] text-ink-muted">{label}</div>}
    </div>
  );
}

/** Adapts Recharts' tooltip payload shape into ChartTooltip's entries prop. */
export function fromRechartsPayload(payload: readonly unknown[] | undefined): TooltipEntry[] {
  if (!payload) return [];
  return payload.map((p) => {
    const entry = p as { name?: string; value?: number; color?: string; stroke?: string; fill?: string };
    return {
      name: entry.name ?? '',
      value: entry.value ?? 0,
      color: entry.color ?? entry.stroke ?? entry.fill ?? 'var(--series-1)',
    };
  });
}
