export function ChartLegend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  if (items.length < 2) return null;
  return (
    <div className="mb-3 flex flex-wrap gap-4">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5 text-xs text-ink-secondary">
          <svg width="16" height="8" aria-hidden>
            <line
              x1="0"
              y1="4"
              x2="16"
              y2="4"
              stroke={item.color}
              strokeWidth="2"
              strokeDasharray={item.dashed ? '3 3' : undefined}
            />
          </svg>
          {item.label}
        </div>
      ))}
    </div>
  );
}
