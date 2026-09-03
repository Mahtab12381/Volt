import type { Reading } from '@electricity/shared';

/** The API returns lean Mongoose documents (`_id`), not the shared `Reading.id` shape. */
export function getReadingId(reading: Reading): string {
  return (reading as unknown as { _id?: string; id?: string })._id ?? reading.id;
}
