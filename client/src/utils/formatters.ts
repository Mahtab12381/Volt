const BD_OFFSET_MS = 6 * 60 * 60 * 1000;

export function formatTk(value: number, fractionDigits = 2): string {
  return `৳${value.toLocaleString('en-US', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })}`;
}

export function formatKwh(value: number, fractionDigits = 2): string {
  return `${value.toLocaleString('en-US', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })} kWh`;
}

export function formatDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatDateTime(iso: string): string {
  const shifted = new Date(new Date(iso).getTime() + BD_OFFSET_MS);
  return shifted.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  });
}

export function formatHour(hour: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const period = hour < 12 ? 'AM' : 'PM';
  return `${h}${period}`;
}

/** Converts an ISO timestamp (UTC instant) into the value a <input type="datetime-local"> expects, in Bangladesh wall-clock time. */
export function isoToBdDateTimeLocal(iso: string): string {
  const shifted = new Date(new Date(iso).getTime() + BD_OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const d = String(shifted.getUTCDate()).padStart(2, '0');
  const h = String(shifted.getUTCHours()).padStart(2, '0');
  const mi = String(shifted.getUTCMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${mi}`;
}

/** Converts a <input type="datetime-local"> value (Bangladesh wall-clock, naive) into an ISO string with the explicit +06:00 offset. */
export function bdDateTimeLocalToIso(value: string): string {
  return `${value}:00+06:00`;
}

export function nowAsBdDateTimeLocal(): string {
  return isoToBdDateTimeLocal(new Date().toISOString());
}
