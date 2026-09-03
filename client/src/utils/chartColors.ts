// Fixed-order categorical slots — assign by role, never cycle or reassign on filter.
export const SERIES = {
  blue: 'var(--series-1)',
  orange: 'var(--series-2)',
  aqua: 'var(--series-3)',
  yellow: 'var(--series-4)',
  magenta: 'var(--series-5)',
  green: 'var(--series-6)',
  violet: 'var(--series-7)',
  red: 'var(--series-8)',
} as const;

export const SEQUENTIAL_BLUE = ['var(--seq-100)', 'var(--seq-250)', 'var(--seq-400)', 'var(--seq-550)', 'var(--seq-700)'];

export const STATUS = {
  good: 'var(--status-good)',
  warning: 'var(--status-warning)',
  serious: 'var(--status-serious)',
  critical: 'var(--status-critical)',
} as const;

export const CHART_CHROME = {
  gridline: 'var(--gridline)',
  baseline: 'var(--baseline)',
  textSecondary: 'var(--text-secondary)',
  textMuted: 'var(--text-muted)',
  surface: 'var(--surface-1)',
};
