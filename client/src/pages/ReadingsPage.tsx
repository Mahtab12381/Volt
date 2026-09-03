import { useState } from 'react';
import type { Reading } from '@electricity/shared';
import { PageHeader } from '../components/layout/PageHeader.js';
import { Modal } from '../components/layout/Modal.js';
import { ReadingForm } from '../components/readings/ReadingForm.js';
import { ReadingsTable } from '../components/readings/ReadingsTable.js';
import { useCreateReading, useDeleteReading, useReadingsList, useUpdateReading } from '../hooks/useReadings.js';
import { getReadingId } from '../utils/readingId.js';
import { STATUS } from '../utils/chartColors.js';

export function ReadingsPage() {
  const { data, isLoading } = useReadingsList({ limit: 200 });
  const createReading = useCreateReading();
  const updateReading = useUpdateReading();
  const deleteReading = useDeleteReading();

  const [editing, setEditing] = useState<Reading | null>(null);
  const [deleting, setDeleting] = useState<Reading | null>(null);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Readings" subtitle="Log a new meter balance reading, or edit/delete past entries." />

      <section className="mb-8 rounded-xl border border-border-hairline bg-surface-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink-primary">Add a reading</h2>
        <ReadingForm
          submitLabel="Add reading"
          isSubmitting={createReading.isPending}
          onSubmit={(input) => createReading.mutate(input)}
        />
        {createReading.isError && (
          <p className="mt-3 text-sm" style={{ color: STATUS.critical }}>
            {(createReading.error as Error).message}
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold text-ink-primary">History</h2>
        {isLoading ? (
          <p className="text-sm text-ink-muted">Loading…</p>
        ) : (
          <ReadingsTable readings={data?.items ?? []} onEdit={setEditing} onDelete={setDeleting} />
        )}
      </section>

      {editing && (
        <Modal title="Edit reading" onClose={() => setEditing(null)}>
          <ReadingForm
            initial={editing}
            submitLabel="Save changes"
            isSubmitting={updateReading.isPending}
            onCancel={() => setEditing(null)}
            onSubmit={(input) =>
              updateReading.mutate(
                { id: getReadingId(editing), input },
                { onSuccess: () => setEditing(null) },
              )
            }
          />
        </Modal>
      )}

      {deleting && (
        <Modal title="Delete reading?" onClose={() => setDeleting(null)}>
          <p className="mb-4 text-sm text-ink-secondary">
            This will permanently delete the reading and recalculate all downstream consumption figures. This can't be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleting(null)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-ink-secondary hover:bg-[var(--surface-hover)]"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                deleteReading.mutate(getReadingId(deleting), { onSuccess: () => setDeleting(null) })
              }
              disabled={deleteReading.isPending}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: STATUS.critical }}
            >
              {deleteReading.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
